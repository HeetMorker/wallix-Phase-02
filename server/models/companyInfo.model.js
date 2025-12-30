const mongoose = require("mongoose");

const companyInfoSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("CompanyInfo", companyInfoSchema);
