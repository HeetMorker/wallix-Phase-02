require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");

const db = async () => {
  await mongoose.connect(process.env.DB_URL);
  console.log("Database Connected Successfully");
};

module.exports = db;
