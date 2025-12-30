// routes/companyInfo.js
const express = require("express");
const router = express.Router();
const CompanyInfo = require("../models/companyInfo.model");

// Get company name
router.get("/", async (req, res) => {
  try {
    const doc = await CompanyInfo.findOne();
    res.json({ companyName: doc?.companyName || "" });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch company name" });
  }
});

// Set or update company name
router.post("/", async (req, res) => {
  const { companyName } = req.body;
  if (!companyName) {
    return res.status(400).json({ message: "Company name is required" });
  }

  try {
    let doc = await CompanyInfo.findOne();
    if (doc) {
      doc.companyName = companyName;
      await doc.save();
    } else {
      doc = await CompanyInfo.create({ companyName });
    }

    res.json({
      message: "Company name saved successfully",
      companyName: doc.companyName,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to save company name" });
  }
});

module.exports = router;
