const express = require("express");
const router = express.Router();
const LDAPConfig = require("../models/ldapConfig.model");
const ldap = require("ldapjs");

// 🔄 Save or Update LDAP Configuration
router.post("/", async (req, res) => {
  try {
    const config = await LDAPConfig.findOne();
    if (config) {
      Object.assign(config, req.body);
      await config.save();
      return res.json({ message: "LDAP configuration updated", config });
    }

    const newConfig = await LDAPConfig.create(req.body);
    res
      .status(201)
      .json({ message: "LDAP configuration saved", config: newConfig });
  } catch (err) {
    console.error("Error saving LDAP config:", err.message);
    res.status(500).json({ message: "Failed to save config" });
  }
});

router.get("/", async (req, res) => {
  try {
    const config = await LDAPConfig.findOne();
    if (!config) {
      return res.status(404).json({ message: "No LDAP configuration found" });
    }
    res.json(config);
  } catch (err) {
    console.error("Error fetching LDAP config:", err.message);
    res.status(500).json({ message: "Failed to fetch config" });
  }
});

router.post("/test-network", async (req, res) => {
  try {
    const { server, port } = req.body;
    const ldapPort = parseInt(port, 10);

    if (!server || !ldapPort) {
      return res
        .status(400)
        .json({ message: "Server and valid port are required" });
    }

    const client = ldap.createClient({
      url: `ldap://${server}:${ldapPort}`,
      timeout: 3000,
      connectTimeout: 3000,
    });

    client.on("error", (err) => {
      return res.status(500).json({
        message: "Network connection failed",
        error: err.message,
      });
    });

    client.bind("", "", (err) => {
      client.unbind();
      if (err && err.code !== 49) {
        return res.status(500).json({
          message: "Connection refused",
          error: err.message,
        });
      }
      return res.status(200).json({ message: "Connection successful" });
    });
  } catch (error) {
    console.error("Test Network Error:", error.message);
    res.status(500).json({ message: "Unexpected error", error: error.message });
  }
});

// 🔑 Test Authentication
router.post("/test-auth", async (req, res) => {
  const { user, password } = req.body;
  const config = await LDAPConfig.findOne();
  if (!config) return res.status(404).json({ message: "No LDAP config found" });

  const client = ldap.createClient({
    url: `ldap://${config.server}:${config.port}`,
    timeout: 3000,
  });

  client.bind(user, password, (err) => {
    if (err) {
      return res
        .status(401)
        .json({ message: "Bind failed", error: err.message });
    }
    client.unbind();
    res.status(200).json({ message: "Authentication successful" });
  });
});

module.exports = router;
