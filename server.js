
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const multer = require("multer");
// const { GridFSBucket } = require("mongodb"); // For PDF storage
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("cloudinary").v2;
// const dotenv = require("dotenv");
// const path = require("path");
// const GridFsStorage = require("multer-gridfs-storage")

// dotenv.config();
// const app = express();
// app.use(express.json());
// app.use(cors());

// mongoose
//   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// const conn = mongoose.connection; 

// // GridFS setup for PDFs (after connection is open)
// let bucket;
// conn.once("open", () => {
//   bucket = new GridFSBucket(conn.db, { bucketName: "pdfs" });
//   console.log("GridFS bucket ready for PDFs");
// });

// // Cloudinary Configuration for Video Uploads
// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.CLOUD_API_KEY,
//   api_secret: process.env.CLOUD_API_SECRET,
// });

// // Multer Storage for Video Uploads (Cloudinary)
// const videoStorage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "videos",
//     resource_type: "video",
//   },
// });
// const uploadVideo = multer({ storage: videoStorage });

// // Multer Storage for PDF Uploads (GridFS)
// const uploadPDF = multer({ storage: multer.memoryStorage() });
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "audio_files",
//     resource_type: "raw",
//     format: "webm",
//   },
// });
// const upload = multer({ storage });

// //-------------------- 📌 Audio Upload API -------------------- *

// // ✅ Audio Schema (MongoDB)
// const Audio = mongoose.model("Audio", new mongoose.Schema({ url: String }));

// // ✅ Upload Audio File
// app.post("/upload-audio", upload.single("audio"), async (req, res) => {
//   try {
//     const audio = new Audio({ url: req.file.path });
//     await audio.save();
//     res.json({ message: "Audio uploaded successfully!", url: req.file.path });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error uploading audio" });
//   }
// });

// // // ✅ Fetch Saved Audio Files
// app.get("/get-audios", async (req, res) => {
//   try {
//     const audios = await Audio.find();
//     res.json(audios);
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching audios" });
//   }
// });


// // ✅ Serve the WebGL build as static files
// app.use("/webgl", express.static(path.join(__dirname, "WebGL")));

// app.get("/", (req, res) => {
//   res.send("Server is running...");
// });

// /* -------------------- 📌 Video Upload API -------------------- */
// app.post("/upload-video", uploadVideo.single("video"), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//     const Video = mongoose.model("Video", new mongoose.Schema({ title: String, videoUrl: String }));
//     const newVideo = await Video.create({ title: req.body.title, videoUrl: req.file.path });

//     res.json({ message: "Video uploaded successfully!", video: newVideo });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// /* -------------------- 📌 Fetch All Videos -------------------- */
// app.get("/videos", async (req, res) => {
//   try {
//     const Video = mongoose.model("Video", new mongoose.Schema({ title: String, videoUrl: String }));
//     const videos = await Video.find();
//     res.json(videos);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// /* -------------------- 📌 Fetch a Single Video -------------------- */
// app.get("/video/:id", async (req, res) => {
//   try {
//     const Video = mongoose.model("Video", new mongoose.Schema({ title: String, videoUrl: String }));
//     const video = await Video.findById(req.params.id);
//     if (!video) return res.status(404).json({ error: "Video not found" });

//     res.json(video);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });
// /* -------------------- 📌 Fetch All PDFs -------------------- */
// app.get("/pdfs", async (req, res) => {
//   try {
//     const files = await bucket.find().toArray();
//     if (!files.length) return res.status(404).json({ error: "No PDFs found" });

//     res.json(files.map((file) => ({ title: file.filename, pdfUrl: `/pdf/${file._id}` })));
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// /* -------------------- 📌 Fetch and Serve PDF -------------------- */
// app.get("/pdf/:id", async (req, res) => {
//   try {
//     const stream = bucket.openDownloadStream(new mongoose.Types.ObjectId(req.params.id));
//     res.set("Content-Type", "application/pdf");
//     stream.pipe(res);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// /* -------------------- 📌 Latest PDF change -------------------- */



// /* -------------------- 📌 Start Server -------------------- */
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const Grid = require("gridfs-stream");
const { Readable } = require("stream"); // Converts buffer to stream
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// // ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const conn = mongoose.connection; 

let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("pdfs");
});

// ✅ Multer Storage for Video Uploads (Cloudinary)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "videos",
    resource_type: "video",
  },
});
const uploadVideo = multer({ storage: videoStorage });

// ✅ Multer Storage for Audio Uploads (Cloudinary)
const audioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "audio_files",
    resource_type: "raw",
    format: "webm",
  },
});
const uploadAudio = multer({ storage: audioStorage });

// ✅ Multer Storage for PDFs (Memory Buffer)
const uploadPDF = multer({ storage: multer.memoryStorage() });

// ✅ Audio Schema (MongoDB)
const Audio = mongoose.model("Audio", new mongoose.Schema({ url: String }));

// ✅ Upload Audio File
app.post("/upload-audio", uploadAudio.single("audio"), async (req, res) => {
  try {
    const audio = new Audio({ url: req.file.path });
    await audio.save();
    res.json({ message: "Audio uploaded successfully!", url: req.file.path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error uploading audio" });
  }
});

// ✅ Fetch Saved Audio Files
app.get("/get-audios", async (req, res) => {
  try {
    const audios = await Audio.find();
    res.json(audios);
  } catch (err) {
    res.status(500).json({ message: "Error fetching audios" });
  }
});

// ✅ Serve the WebGL build as static files
app.use("/webgl", express.static(path.join(__dirname, "WebGL")));

// ✅ Default Route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

//-------------------- 📌 Video Upload API -------------------- *

// ✅ Upload Video
app.post("/upload-video", uploadVideo.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const Video = mongoose.model("Video", new mongoose.Schema({ title: String, videoUrl: String }));
    const newVideo = await Video.create({ title: req.body.title, videoUrl: req.file.path });

    res.json({ message: "Video uploaded successfully!", video: newVideo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Fetch All Videos
app.get("/videos", async (req, res) => {
  try {
    const Video = mongoose.model("Video", new mongoose.Schema({ title: String, videoUrl: String }));
    const videos = await Video.find();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Fetch a Single Video
app.get("/video/:id", async (req, res) => {
  try {
    const Video = mongoose.model("Video", new mongoose.Schema({ title: String, videoUrl: String }));
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//-------------------- 📌 PDF Upload & Retrieval API -------------------- *

// ✅ Upload PDF File
app.post("/upload-pdf", uploadPDF.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    const writeStream = gfs.createWriteStream({
      filename: req.file.originalname,
      contentType: "application/pdf",
    });

    readableStream.pipe(writeStream);

    writeStream.on("close", (file) => {
      res.json({ message: "PDF uploaded successfully!", fileId: file._id });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading PDF" });
  }
});

// ✅ Fetch All PDFs
app.get("/pdfs", async (req, res) => {
  try {
    const files = await gfs.files.find().toArray();
    if (!files.length) return res.status(404).json({ error: "No PDFs found" });

    res.json(files.map((file) => ({ title: file.filename, pdfUrl: `/get-pdf/${file._id}` })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Fetch and Serve PDF
app.get("/get-pdf/:id", async (req, res) => {
  try {
    const file = await pdfBucket.find({ _id: new mongoose.Types.ObjectId(req.params.id) }).toArray();
    if (!file || file.length === 0) return res.status(404).json({ message: "File not found" });

    res.setHeader("Content-Type", "application/pdf");  // ✅ Ensure it's set
    const readStream = pdfBucket.openDownloadStream(new mongoose.Types.ObjectId(req.params.id));
    readStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving PDF" });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
