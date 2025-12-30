const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const approvalSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    user_name: { type: String, required: true },
    target_name: { type: String, required: true },
    creation: { type: Date, required: true },
    begin: { type: Date, required: true },
    end: { type: Date },
    ticket: { type: String },
    email: { type: String, required: true, match: /.+\@.+\..+/ },
    ipAddress: { type: String, required: true },
    bastionName: { type: String },
    duration: { type: Number },
    comment: { type: String }, // User comment
    quorum: { type: Number },
    answers: [
      {
        approver_name: String,
        comment: String, // Approver comment
        approved: Boolean,
        date: Date,
      },
    ],
  },
  { timestamps: true }
); // Automatically adds createdAt and updatedAt fields

const Approval = mongoose.model("Approval", approvalSchema);

module.exports = Approval;
