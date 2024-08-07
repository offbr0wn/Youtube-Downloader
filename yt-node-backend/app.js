const express = require("express");
const compression = require("compression");
const ytdl = require("@distube/ytdl-core");
const fs = require("fs");
const app = express();
const cors = require("cors");
// const { createServer } = require("node:http");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const helmet = require("helmet");
const contentDisposition = require("content-disposition");
const ffmpeg = require("fluent-ffmpeg");
const cp = require("child_process");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const { HttpsProxyAgent } = require("https-proxy-agent");

ffmpeg.setFfmpegPath(ffmpegPath);

const port = process.env.PORT || 3001;
const proxy = "http://165.225.198.124:8800";
const cookiesArray = [
  {
    domain: ".youtube.com",
    expirationDate: 1738600116,
    hostOnly: false,
    httpOnly: false,
    name: "__Secure-1PAPISID",
    path: "/",
    sameSite: "unspecified",
    secure: true,
    session: false,
    storeId: "0",
    value: "JLWF3u9DrtIEMabH/A9lGh4QIO8Chq0OVZ",
    id: 1,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738600116,
    hostOnly: false,
    httpOnly: true,
    name: "__Secure-1PSID",
    path: "/",
    sameSite: "unspecified",
    secure: true,
    session: false,
    storeId: "0",
    value:
      "g.a000mghXlXjObXSwMTX4opPo49OhO3iJVmJeMB75dfut0fMLr64Yk7vunnRdk_ttViEWSJgMngACgYKAR8SARcSFQHGX2Mivx-qUxQJULk6LI7o_aYjphoVAUF8yKqwCRpQKXoTDSgHAsPcNbNw0076",
    id: 2,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738604243.208548,
    hostOnly: false,
    httpOnly: true,
    name: "__Secure-1PSIDCC",
    path: "/",
    sameSite: "unspecified",
    secure: true,
    session: false,
    storeId: "0",
    value:
      "AKEyXzWwnszKLvl9TT1It7F9CmEcR5vzX8_IBDU1ajCH4Fu7rIeZmGGZhmMXGdRqkRgcvpv5azA",
    id: 3,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738604243.208127,
    hostOnly: false,
    httpOnly: true,
    name: "__Secure-1PSIDTS",
    path: "/",
    sameSite: "unspecified",
    secure: true,
    session: false,
    storeId: "0",
    value:
      "sidts-CjIB4E2dkdkwaFRVXx_S5dElDuIL0BHdQCUhY9NkMsV6gUyjk7_h2yiDjIU3ofIBaDN8eRAA",
    id: 4,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738600116,
    hostOnly: false,
    httpOnly: false,
    name: "__Secure-3PAPISID",
    path: "/",
    sameSite: "no_restriction",
    secure: true,
    session: false,
    storeId: "0",
    value: "JLWF3u9DrtIEMabH/A9lGh4QIO8Chq0OVZ",
    id: 5,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738600116,
    hostOnly: false,
    httpOnly: true,
    name: "__Secure-3PSID",
    path: "/",
    sameSite: "no_restriction",
    secure: true,
    session: false,
    storeId: "0",
    value:
      "g.a000mghXlXjObXSwMTX4opPo49OhO3iJVmJeMB75dfut0fMLr64YjsH-al1lu4L7nKB0lv-imwACgYKAd8SARcSFQHGX2MiHzed6CLgna6tUAYdmnhThRoVAUF8yKpIPkr8rYSviiXYWEatN2HH0076",
    id: 6,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738604243.208628,
    hostOnly: false,
    httpOnly: true,
    name: "__Secure-3PSIDCC",
    path: "/",
    sameSite: "no_restriction",
    secure: true,
    session: false,
    storeId: "0",
    value:
      "AKEyXzX-JUk9XovcD9cb48upLo3INhS9W1ZwAEtoGOd6jtmvTgtsaz73YKGIymlZApu6zU_xITo",
    id: 7,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738604243.208379,
    hostOnly: false,
    httpOnly: true,
    name: "__Secure-3PSIDTS",
    path: "/",
    sameSite: "no_restriction",
    secure: true,
    session: false,
    storeId: "0",
    value:
      "sidts-CjIB4E2dkdkwaFRVXx_S5dElDuIL0BHdQCUhY9NkMsV6gUyjk7_h2yiDjIU3ofIBaDN8eRAA",
    id: 8,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738600116,
    hostOnly: false,
    httpOnly: false,
    name: "APISID",
    path: "/",
    sameSite: "unspecified",
    secure: false,
    session: false,
    storeId: "0",
    value: "gwtdEymH_DxReRkM/AhHodS3oav3gtB4UJ",
    id: 9,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738600116,
    hostOnly: false,
    httpOnly: true,
    name: "HSID",
    path: "/",
    sameSite: "unspecified",
    secure: false,
    session: false,
    storeId: "0",
    value: "AwqptlqF1W8ObqWwn",
    id: 10,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738602823,
    hostOnly: false,
    httpOnly: true,
    name: "LOGIN_INFO",
    path: "/",
    sameSite: "no_restriction",
    secure: true,
    session: false,
    storeId: "0",
    value:
      "AFmmF2swRQIgWgUrGCQxUTkZJPYQNLheWaMNXh4dOvoCBwEHZWO__NECIQDze-eb8U1PD20r_i3QIcmBvlTg51PtRAzxRcez3EVYQQ:QUQ3MjNmd2hLVDJka0xIVzhlbjEwdlZNZnJrbXNhMTVpYmZsTHZaUU5rNGxRZUEyaHRfUU1mR2tNTEtzQlBvSUs1UnB6XzJ1TV9tb3ZYRVUtMU5yQmZaQllCc01nZ1BUZmI0MHZZd2g3bURkbmY0Ny1JZ1d1M2ZpclF5WDRjdm01aU9SeHU4QjJnR2U1aEtqcWRSc1kwRGkzZUpYSGI3NjlR",
    id: 11,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1723655625,
    hostOnly: false,
    httpOnly: false,
    name: "PREF",
    path: "/",
    sameSite: "unspecified",
    secure: true,
    session: false,
    storeId: "0",
    value: "f6=40000000&f7=4100&tz=Europe.London&f4=4000000&f5=20000",
    id: 12,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738600116,
    hostOnly: false,
    httpOnly: false,
    name: "SAPISID",
    path: "/",
    sameSite: "unspecified",
    secure: true,
    session: false,
    storeId: "0",
    value: "JLWF3u9DrtIEMabH/A9lGh4QIO8Chq0OVZ",
    id: 13,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738600116,
    hostOnly: false,
    httpOnly: false,
    name: "SID",
    path: "/",
    sameSite: "unspecified",
    secure: false,
    session: false,
    storeId: "0",
    value:
      "g.a000mghXlXjObXSwMTX4opPo49OhO3iJVmJeMB75dfut0fMLr64Y0NNVTDMujkbufrZouOaANAACgYKAbESARcSFQHGX2Mi1uWwlYBcULgov1ko50nobhoVAUF8yKqUhdr0F7EfRQVk_jNI8pGO0076",
    id: 14,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738604243.208474,
    hostOnly: false,
    httpOnly: false,
    name: "SIDCC",
    path: "/",
    sameSite: "unspecified",
    secure: false,
    session: false,
    storeId: "0",
    value:
      "AKEyXzVsRWlHUxqGxD6fpjWrJXcr42m5Jsl3GZZRHwIKZfA5HjC3uZq9cOqlKO7qd2kG9s4SIMo",
    id: 15,
  },
  {
    domain: ".youtube.com",
    hostOnly: false,
    httpOnly: false,
    name: "SOCS",
    path: "/",
    sameSite: "unspecified",
    secure: true,
    session: true,
    storeId: "0",
    value:
      "CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA3X3AxGgJlbiADGgYIgJnPpwY",
    id: 16,
  },
  {
    domain: ".youtube.com",
    expirationDate: 1738600116,
    hostOnly: false,
    httpOnly: true,
    name: "SSID",
    path: "/",
    sameSite: "unspecified",
    secure: true,
    session: false,
    storeId: "0",
    value: "Ae3aCvfXdMdGWr_HL",
    id: 17,
  },
  {
    domain: ".youtube.com",
    hostOnly: false,
    httpOnly: false,
    name: "wide",
    path: "/",
    sameSite: "unspecified",
    secure: false,
    session: true,
    storeId: "0",
    value: "0",
    id: 18,
  },
];
const cookies = cookiesArray.map((cookie) => ({
  name: cookie.name,
  value: cookie.value,
}));
// const agent = ytdl.createProxyAgent({ uri: proxy }, cookies);
const agent = ytdl.createAgent(cookies);
// const agent = new HttpsProxyAgent(proxy);

// app.use(bodyParser.json());
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());

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
  const info = await ytdl.getInfo(url, {
    agent: agent,
  });
  const duration = info.videoDetails.lengthSeconds; // Duration in seconds

  const videoStream = ytdl(url, {
    quality: "highestvideo",
    agent: agent,
  });
  const audioStream = ytdl(url, {
    quality: "highestaudio",
    agent: agent,
  });

  // Create a temporary output file path
  const outputFilePath = `temp_${Date.now()}.mp4`;

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

// Method to get video information
async function getVideoInfo(url) {
  try {
    const info = await ytdl.getInfo(url, { agent: agent });

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
    const { formats } = await ytdl.getInfo(url, {
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
