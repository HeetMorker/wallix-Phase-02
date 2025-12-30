// const express = require("express");
// const fs = require("fs");

// const router = express.Router();

// router.post("/activate", (req, res) => {
//   const newLicense = req.body.license;
//   console.log(req.body);
//   try {
//     fs.writeFileSync("license", newLicense, { encoding: "utf8" });
//     res.status(200).json({ message: "license updated successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "error in updating license" });
//   }
// });

// module.exports = router;
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.post("/activate", async (req, res) => {
  try {
    const { license } = req.body;

    if (!license) {
      return res.status(400).json({ message: "License key is required" });
    }

    const licensePath = path.resolve(process.cwd(), "license");
    fs.writeFileSync(licensePath, license, { encoding: "utf8" });

    return res.status(200).json({ message: "License updated successfully" });
  } catch (err) {
    console.error("License activation failed:", err);
    return res.status(500).json({ message: "Error in updating license" });
  }
});

module.exports = router;
