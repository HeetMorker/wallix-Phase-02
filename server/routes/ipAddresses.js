const express = require("express");
const router = express.Router();
const IPAddress = require("../models/ipAddress.model");

// GET route to retrieve all IP addresses
router.get("/", async (req, res) => {
  try {
    const ipAddresses = await IPAddress.find();
    res.json(ipAddresses);
  } catch (error) {
    console.error("Error fetching IP addresses:", error);
    res.status(500).json({ message: "Error fetching IP addresses" });
  }
});

// POST route to add new IP address
router.post("/", async (req, res) => {
  const { api, ipAddress, authKey, bastionName } = req.body;

  try {
    const newIPAddress = new IPAddress({
      api,
      ipAddress,
      authKey,
      bastionName,
    });
    await newIPAddress.save();
    res.status(201).json({ message: "IP address added successfully" });
  } catch (error) {
    console.error("Error saving IP address:", error);
    res.status(500).json({ message: "Error saving IP address" });
  }
});

// PUT route to update an IP address by ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { api, ipAddress, authKey, bastionName } = req.body;

  try {
    const existingEntry = await IPAddress.findById(id);
    if (!existingEntry) {
      return res.status(404).json({ message: "IP address not found" });
    }

    // Prevent updating bastionName if it already exists
    if (
      existingEntry.bastionName &&
      bastionName !== existingEntry.bastionName
    ) {
      return res
        .status(400)
        .json({ message: "Bastion Name cannot be changed once set" });
    }

    existingEntry.api = api;
    existingEntry.ipAddress = ipAddress;
    existingEntry.authKey = authKey;
    if (!existingEntry.bastionName && bastionName) {
      existingEntry.bastionName = bastionName;
    }

    await existingEntry.save();

    res.json({ message: "IP address updated successfully" });
  } catch (error) {
    console.error("Error updating IP address:", error);
    res.status(500).json({ message: "Error updating IP address" });
  }
});

// DELETE route to delete an IP address by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedIPAddress = await IPAddress.findByIdAndDelete(id);

    if (!deletedIPAddress) {
      return res.status(404).json({ message: "IP address not found" });
    }

    res.json({ message: "IP address deleted successfully" });
  } catch (error) {
    console.error("Error deleting IP address:", error);
    res.status(500).json({ message: "Error deleting IP address" });
  }
});
module.exports = router;
