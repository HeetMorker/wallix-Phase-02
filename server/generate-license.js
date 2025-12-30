const jwt = require("jsonwebtoken");

const payload = {
  name: "Dhruv Joshi",
  email: "dhruv@mechsoftme.com",
};

const secret = "wallixSecretDhruv Joshi";

const token = jwt.sign(payload, secret, {
  expiresIn: "365d",
});

console.log("🔑 Token:", token);
