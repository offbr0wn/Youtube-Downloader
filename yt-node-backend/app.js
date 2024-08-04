const express = require("express");
const bodyParser = require("body-parser");
const ytdl = require("@distube/ytdl-core");
const fs = require("fs");
const app = express();
const cors = require("cors");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const { format } = require("path");
const s = "videos-downloader";

const port = 3001;

// app.use(bodyParser.json());
app.use(express.json());
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
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
async function downloadVideo(res, url, socketId, formatType) {
  // const videoPath = path.join(__dirname, 'video.mp4');
  // const audioPath = path.join(__dirname, 'audio.mp3');
  // const outputPath = path.join(__dirname, 'output.mp4');
console.log(formatType)
  const ytDownload = ytdl(url, {
    
    filter: (format) => {
      if (formatType === "video") {
        return format.hasVideo;
      } else {
        return format.hasAudio;
      }
    },
    quality: "highest",
    requestOptions: {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        "Accept-Language": "en-US,en;q=0.8",
      },
    },
  });
  ytDownload.pipe(res);

  ytDownload.on("progress", (_, downloaded, total) => {
    const percent = (downloaded / total) * 100;
    if (socketId) {
      io.to(socketId).emit("progress", { percent });
    }
  });

  ytDownload.on("end", () => {
    res.status(200).end();
    if (socketId) {
      io.to(socketId).emit("progress", { percent: 100 });
    }
  });

  ytDownload.on("error", (error) => {
    console.error("Failed to download YT video:", error);
    res.status(500).json({ error: `${error}` });
    if (socketId) {
      io.to(socketId).emit("progress", { error: error.message });
    }
  });
}

// Method to get video information
async function getVideoInfo(url) {
  try {
    const info = await ytdl.getInfo(url);

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
  res.set(
    "Content-Disposition",
    `attachment; filename="video.mp4"`,
    "Content-Type",
    "video/mp4"
  );
  const { url, quality, socketId, formatType } = req.body;

  if (!url) {
    return res
      .status(400)
      .json({ error: "Missing 'url' parameter in the request body." });
  }

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  try {
    await downloadVideo(res, url, socketId, formatType);
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
    const { formats } = await ytdl.getInfo(url);
    const filterFormat = formats.filter((item) => item.hasAudio);
    return res.status(200).json(videoInfo);
  } else {
    return res.status(500).json({ error: errorMessage });
  }
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
