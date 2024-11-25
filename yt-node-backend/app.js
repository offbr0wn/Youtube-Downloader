const express = require("express");
const compression = require("compression");
const ytdl = require("@distube/ytdl-core");
const path = require("path");
const fs = require("fs");
const app = express();
const cors = require("cors");
const http = require("http");
const server = http.createServer(app, {
  cors: {
    origin: "*",
  },
});
const { Server } = require("socket.io");
const helmet = require("helmet");
const contentDisposition = require("content-disposition");
const ffmpeg = require("fluent-ffmpeg");
const cp = require("child_process");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
require("dotenv").config();

ffmpeg.setFfmpegPath(ffmpegPath);

const port = process.env.PORT || 3001;
const proxy = process.env.PROXY_IP;

const cookiesArray = [
  {
    domain: ".youtube.com",
    expirationDate: 1738609706.158883,
    hostOnly: false,
    httpOnly: true,
    name: "LOGIN_INFO",
    path: "/",
    sameSite: "no_restriction",
    secure: true,
    session: false,
    storeId: "0",
    value:
      "AFmmF2swRQIhANzgqj3jKZbgJ-0Lug6Cnm1xT82feksFpaKHB8AgUJRoAiBT0Tl0MvnvqKAvvYEVsr-3SV_sPf75yFz4VhT6csgIdA:QUQ3MjNmejRNVVpYUFlOSi1yR2xwM1h3cjhKS2FUcUJBNFg2REtRT2t6bjlUaHhTM0xTRjloc3lXRy1sUnpWdE9HcGtiTW5KSS1DUU0yd083aVlkOTNWZmhyUDNLcWdQc0xHbU83SXVPcEpyUmg4Snh1SkpXckFpeV9GSU16OHk0QkJTVTVRSEFuRHZXTUh0QndadFdGREVXNFJFVDVvbTBTVElfYUkwSUU4MWVMN0VDaHNkUXduOVJDZk16dUxDeEdUSnhBX256ZDYtLVEwRy1Wdzc0VE4wS3pNQWlRcEMzdw==",
    id: 11,
  },
];

const agent = ytdl.createAgent(cookiesArray);

// app.use(bodyParser.json());
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV !== "development"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("App connected");
  socket.on("disconnect", () => {
    console.log("App disconnected");
    socket.removeAllListeners();
  });
});

// Method to pass video url and resolution to downloadVideo function
async function downloadVideo(res, url, socketId, formatType, quality) {
  const info = await ytdl.getInfo(url, {
    agent,
  });
  const duration = info.videoDetails.lengthSeconds; // Duration in seconds

  const bestFormat = ytdl.chooseFormat(info.formats, {
    quality: "highestvideo",
    filter: (format) => {
      if (formatType === "webm" || formatType === "mp4") {
        return (
          format?.container === formatType && format.qualityLabel === quality
        );
      }
    },
  });

  const videoStream = ytdl(url, {
    format: bestFormat,
    agent,
  });
  const audioStream = ytdl(url, {
    quality: "highestaudio",
    agent,
  });

  // Create a temporary output file path
  const outputFilePath = `temp_${Date.now()}.${formatType}`;

  // Spawn the FFmpeg process
  const ffmpegProcess = cp.spawn(
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
    const readStream = fs.createReadStream(outputFilePath);
    readStream.pipe(res);

    // Delete the temporary file after streaming
    readStream.on("end", () => {
      fs.unlink(outputFilePath, (err) => {
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

// FormatType is mp4 or webm
// quality is 144p, 240p, 360p, 480p, 720p, 1080p
async function downloadBasicWay(res, url, socketId, formatType, quality) {
  const info = await ytdl.getInfo(url, { agent });
  const bestFormat = ytdl.chooseFormat(info.formats, {
    // quality: "",
    filter: (format) => {
      if (formatType === "mp3") {
        return format?.mimeType?.match(/audio/);
      }
    },
  });

  const ytDownload = ytdl(url, {
    format: bestFormat,
    agent,
  });

  ytDownload
    .on("progress", (_, downloaded, total) => {
      const percent = (downloaded / total) * 100;
      if (socketId) {
        io.to(socketId).emit("progress", { percent });
      }
    })
    .pipe(res);

  ytDownload.on("end", () => {
    res.status(200).end();
    if (socketId) {
      io.to(socketId).emit("progress", { percent: 100 });
    }
    cleanUpTemporaryFiles();
  });

  ytDownload.on("error", (error) => {
    console.error("Failed to download YT video:", error);
    res.status(500).json({ error: `${error}` });
    if (socketId) {
      io.to(socketId).emit("progress", { error: error.message });
    }
    cleanUpTemporaryFiles();
  });
}
// Function to clean up html file when video is downloaded
function cleanUpTemporaryFiles() {
  // Assuming all temporary files follow a specific pattern
  const tempFilePattern = /^.*-watch\.html$/;
  const directory = __dirname;

  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    files.forEach((file) => {
      if (tempFilePattern.test(file)) {
        const filePath = path.join(directory, file);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Failed to delete file ${file}:`, err);
          } else {
            console.log(`File ${file} deleted`);
          }
        });
      }
    });
  });
}
// Method to get video information
async function getVideoInfo(url, formatType, quality) {
  try {
    const info = await ytdl.getInfo(url, {
      agent,
    });

    const bestFormat = ytdl.chooseFormat(info.formats, {
      quality: formatType === "mp3" ? "highestaudio" : null,
      filter: (format) => {
        if (formatType === "mp3") {
          return format.hasAudio && format.mimeType?.match(/audio/);
        }

        return (
          format?.container === formatType && format.qualityLabel === quality
        );
      },
    });
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
      format: bestFormat,
    };
    cleanUpTemporaryFiles();
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
  const { url, quality, socketId, formatType } = req.body;
  res.setHeader(
    "Content-Disposition",
    contentDisposition(`video.${formatType}`)
  );

  if (!url) {
    return res
      .status(400)
      .json({ error: "Missing 'url' parameter in the request body." });
  }

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  try {
    // console.log("Downloading video...:", formatType, quality);
    if (formatType === "mp3") {
      await downloadBasicWay(res, url, socketId, formatType, quality);
    } else {
      await downloadVideo(res, url, socketId, formatType, quality);
    }
  } catch (error) {
    console.error("Failed to download video:", error);
    return res
      .status(500)
      .json({ error: `Failed to download video from link : ${error}` });
  }
});

// Post Request to get video information
app.post("/video_info", async (req, res) => {
  const { url, formatType, quality } = req.body;

  if (!url) {
    return res
      .status(400)
      .json({ error: "Missing 'url' parameter in the request body." });
  }

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  const [videoInfo, errorMessage] = await getVideoInfo(
    url,
    formatType,
    quality
  );

  if (videoInfo) {
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
