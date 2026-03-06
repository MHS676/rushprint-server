const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { Readable } = require("stream");
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer — memory storage (no disk writes)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files are allowed."), false);
    },
});

// POST /api/admin/upload  (protected)
router.post("/", verifyToken, upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file provided." });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "rushprint", resource_type: "image" },
        (error, result) => {
            if (error) {
                console.error("Cloudinary upload error:", error.message);
                return res.status(500).json({ success: false, message: error.message });
            }
            res.json({ success: true, url: result.secure_url, public_id: result.public_id });
        }
    );

    // Pipe buffer into Cloudinary upload stream
    const readable = new Readable();
    readable.push(req.file.buffer);
    readable.push(null);
    readable.pipe(uploadStream);
});

module.exports = router;
