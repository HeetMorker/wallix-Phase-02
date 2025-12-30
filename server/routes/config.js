const express = require("express");
const AdminConfig = require("../models/adminConfig.model");
const router = express.Router();

// PUT /api/config - Update a config entry
router.put("/", async (req, res) => {
  const { property, value } = req.body;

  // Defensive check
  if (!property || value === undefined) {
    return res.status(400).json({ message: "Missing property or value" });
  }

  try {
    const config = await AdminConfig.updateOne({ property }, { value });
    res.json({ message: "Config updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error in updating config" });
  }
});

// GET /api/config/:property - Fetch a config entry
router.get("/:property", async (req, res) => {
  try {
    const config = await AdminConfig.findOne({ property: req.params.property });

    if (!config) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json({ value: config.value });
  } catch (err) {
    console.error("GET /config error:", err);
    res.status(500).json({ message: "Error in fetching config" });
  }
});

module.exports = router;
