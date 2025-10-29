import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import imageCompression from "browser-image-compression";
import cloudinary from "../src/lib/cloudinary.js";
import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import imageRoutes from "./routes/image.route.js";
import groupRoutes from "./routes/group.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json({ limit: "150mb" })); // Tăng lên 150MB cho file 100MB (base64 + overhead)
app.use(express.urlencoded({ limit: "150mb", extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin);
    },
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/groups", groupRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, "0.0.0.0", () => {
  console.log("server is running on PORT:" + PORT);
  console.log(`Backend accessible at: http://10.10.30.33:${PORT}`);
  connectDB();
});

async function handleImageUpload(file) {
  const options = {
    maxSizeMB: 1, // tối đa 1MB
    maxWidthOrHeight: 1024, // resize nếu lớn hơn 1024px
    useWebWorker: true,
  };
  const compressedFile = await imageCompression(file, options);
  // Tiếp tục upload compressedFile lên server hoặc Cloudinary
}
// routes/image.route.js
// import express from "express"; // Removed duplicate import

const router = express.Router();

router.post("/upload", async (req, res) => {
  try {
    const { image } = req.body; // base64 hoặc file
    const uploadResponse = await cloudinary.uploader.upload(image);
    res.json({ url: uploadResponse.secure_url });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;

