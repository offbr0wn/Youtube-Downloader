import express, { json } from "express";
import compression from 'compression';
import bodyParser from "body-parser";
import ytdl, { getInfo } from "@distube/ytdl-core";
import { createReadStream, unlink } from "fs";
const app = express();
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import helmet from "helmet";
import compression from "compression";
import { format } from "path";
import contentDisposition from "content-disposition";
import { setFfmpegPath } from "fluent-ffmpeg";
import { spawn } from "child_process";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
setFfmpegPath(ffmpegPath);

const port = 3001;

// app.use(bodyParser.json());
app.use(json());
app.use(cors());
app.use(helmet());
app.use(compression());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("App connected");
  socket.on("disconnect", () => {
    console.log("App disconnected");
  });
});

// Method to pass video url and resolution to downloadVideo function
async function downloadVideo(res, url, socketId) {
  // const ytDownload = ytdl(url, {
  //   filter: (format) => format.hasAudio ,

  //   // filter: (format) => {
  //   //   if (formatType === "video") {
  //   //     return format.hasVideo;
  //   //   } else {
  //   //     return format.hasAudio;
  //   //   }
  //   // },

  //   requestOptions: {
  //     headers: {
  //       "User-Agent":
  //         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
  //       "Accept-Language": "en-US,en;q=0.8",
  //     },
  //   },
  // });

  // ytDownload
  //   .on("progress", (_, downloaded, total) => {
  //     const percent = (downloaded / total) * 100;
  //     if (socketId) {
  //       io.to(socketId).emit("progress", { percent });
  //     }
  //   })
  //   .pipe(res);

  // ytDownload.on("end", () => {
  //   res.status(200).end();
  //   if (socketId) {
  //     io.to(socketId).emit("progress", { percent: 100 });
  //   }
  // });

  // ytDownload.on("error", (error) => {
  //   console.error("Failed to download YT video:", error);
  //   res.status(500).json({ error: `${error}` });
  //   if (socketId) {
  //     io.to(socketId).emit("progress", { error: error.message });
  //   }
  // });
  const info = await getInfo(url);
  const duration = info.videoDetails.lengthSeconds; // Duration in seconds
  console.log("Duration:", duration);
  const videoStream = ytdl(url, { quality: "highestvideo" });
  const audioStream = ytdl(url, { quality: "highestaudio" });

  // Create a temporary output file path
  const outputFilePath = `temp_${Date.now()}.mp4`;

  // Spawn the FFmpeg process
  const ffmpegProcess = spawn(
    ffmpegPath,
    [
      "-loglevel",
      "8",
      "-hide_banner",
      "-progress",
      "pipe:3",
      "-i",
      "pipe:4", // Input for video
      "-i",
      "pipe:5", // Input for audio
      "-map",
      "0:a?", // Map audio stream
      "-map",
      "1:v?", // Map video stream
      "-c:v",
      "copy", // Copy video codec
      "-c:a",
      "aac", // Use AAC for audio codec
      "-f",
      "mp4", // Output format
      outputFilePath, // Temporary output file
    ],
    {
      windowsHide: true,
      stdio: [
        "inherit",
        "inherit",
        "inherit", // Standard streams
        "pipe",
        "pipe",
        "pipe",
        "pipe", // Custom pipes for progress and streams
      ],
    }
  );

  // Handle FFmpeg progress updates
  ffmpegProcess.stdio[3].on("data", (chunk) => {
    const progressMessage = chunk.toString().trim();
    const regex = /out_time=(\d{2}):(\d{2}):(\d{2}\.\d{6})/;
    const matches = regex.exec(progressMessage);

    if (matches) {
      const hours = parseInt(matches[1], 10);
      const minutes = parseInt(matches[2], 10);
      const seconds = parseFloat(matches[3]);

      // Convert the current time to total seconds
      const currentTimeSeconds = hours * 3600 + minutes * 60 + seconds;

      // Calculate percent
      const percent = (currentTimeSeconds / duration) * 100;
      if (socketId) {
        io.to(socketId).emit("progress", {
          percent: Math.min(percent, 100), //
        });
      }
    }
  });

  // Handle FFmpeg process close
  ffmpegProcess.on("close", () => {
    // Stream the temporary file to the response
    const readStream = createReadStream(outputFilePath);
    readStream.pipe(res);

    // Delete the temporary file after streaming
    readStream.on("end", () => {
      unlink(outputFilePath, (err) => {
        if (err) {
          console.error("Failed to delete temporary file:", err);
        } else {
          console.log("Temporary file deleted successfully.");
        }
      });
    });

    // Handle read stream errors
    readStream.on("error", (error) => {
      console.error("Error reading temporary file:", error);
      res.status(500).json({ error: "Failed to read temporary file." });
    });
  });

  // Handle errors from FFmpeg process
  ffmpegProcess.on("error", (error) => {
    console.error("Failed to process video:", error);
    res.status(500).json({ error: `${error}` });
    if (socketId) {
      io.to(socketId).emit("progress", { error: error.message });
    }
  });

  // Handle errors from video and audio streams
  videoStream.on("error", (error) => {
    console.error("Video stream error:", error);
    res.status(500).json({ error: `Video stream error: ${error}` });
  });

  audioStream.on("error", (error) => {
    console.error("Audio stream error:", error);
    res.status(500).json({ error: `Audio stream error: ${error}` });
  });

  // Pipe video and audio streams to FFmpeg
  videoStream.pipe(ffmpegProcess.stdio[4]);
  audioStream.pipe(ffmpegProcess.stdio[5]);
}

// Method to get video information
async function getVideoInfo(url) {
  try {
    const info = await getInfo(url);

    const videoThumbnail = info.videoDetails.thumbnails.filter(
      (item) => item.height === 1080
    );
    const videoInfo = {
      title: info.videoDetails.title,
      thumbnail: videoThumbnail[0].url,
      author: info.videoDetails.author.name,
      length: info.videoDetails.lengthSeconds,
      views: info.videoDetails.viewCount,
      description: info.videoDetails.description,
      publish_date: info.videoDetails.publishDate,
      url,
    };
    return [videoInfo, null];
  } catch (error) {
    return [null, error.message];
  }
}
// Checks if YT URl is valid
function isValidYouTubeUrl(url) {
  const pattern =
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+|youtube\.com\/watch\?v=[\w-]+|youtube\.com\/embed\/[\w-]+|m\.youtube\.com\/watch\?v=[\w-]+(&\S*)?$/;
  /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+(&\S*)?$/;
  return pattern.test(url);
}

// Path to post request to download video with resolution
app.post("/download", async (req, res) => {
  res.setHeader("Content-Disposition", contentDisposition(`video.mp4`));
  const { url, quality, socketId } = req.body;

  if (!url) {
    return res
      .status(400)
      .json({ error: "Missing 'url' parameter in the request body." });
  }

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  try {
    await downloadVideo(res, url, socketId);
  } catch (error) {
    console.error("Failed to download video:", error);
    return res
      .status(500)
      .json({ error: `Failed to download video from link : ${error}` });
  }
});

// Post Request to get video information
app.post("/video_info", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res
      .status(400)
      .json({ error: "Missing 'url' parameter in the request body." });
  }

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  const [videoInfo, errorMessage] = await getVideoInfo(url);

  if (videoInfo) {
    const { formats } = await getInfo(url, {
      quality: "highest",
    });
    // const filterFormat = formats.filter((item) => item.hasAudio && item.hasVideo);
    return res.status(200).json(videoInfo);
  } else {
    return res.status(500).json({ error: errorMessage });
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to the YouTube Downloader API");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
