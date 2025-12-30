// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const router = express.Router();
// const Logo = require("../models/Logo");

// // Configure multer
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = path.join(process.cwd(), "uploads");
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     cb(null, "logo" + ext); // always save as "logo.png" or "logo.jpg"
//   },
// });

// const upload = multer({ storage });

// // POST /api/logo/upload
// router.post("/upload", upload.single("logo"), async (req, res) => {
//   try {
//     const filename = req.file.filename;

//     // Remove existing logo record (if any)
//     await Logo.deleteMany({});

//     // Save new logo record
//     const newLogo = new Logo({ filename });
//     await newLogo.save();

//     res.status(200).json({ message: "Logo uploaded successfully", filename });
//   } catch (error) {
//     console.error("Error uploading logo:", error);
//     res.status(500).json({ message: "Failed to upload logo" });
//   }
// });

// // GET /api/logo
// router.get("/", async (req, res) => {
//   try {
//     const latest = await Logo.findOne().sort({ uploadedAt: -1 });

//     if (!latest) {
//       return res.status(404).json({ message: "No logo found" });
//     }

//     res.json({ filename: latest.filename });
//   } catch (error) {
//     console.error("Error fetching logo:", error);
//     res.status(500).json({ message: "Failed to fetch logo" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const Logo = require("../models/Logo");

// Use multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", upload.single("logo"), async (req, res) => {
  try {
    const { buffer, mimetype } = req.file;
    const base64 = `data:${mimetype};base64,${buffer.toString("base64")}`;

    // Remove previous logo
    await Logo.deleteMany();

    const newLogo = new Logo({ base64, contentType: mimetype });
    await newLogo.save();

    res.status(200).json({ message: "Logo uploaded successfully" });
  } catch (err) {
    console.error("Error uploading logo:", err);
    res.status(500).json({ message: "Failed to upload logo" });
  }
});

router.get("/", async (req, res) => {
  try {
    const logo = await Logo.findOne().sort({ uploadedAt: -1 });
    if (!logo) return res.status(404).json({ message: "Logo not found" });

    res.status(200).json({ base64: logo.base64 });
  } catch (err) {
    console.error("Error fetching logo:", err);
    res.status(500).json({ message: "Failed to fetch logo" });
  }
});

module.exports = router;
