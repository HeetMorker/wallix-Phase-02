const express = require("express");
const router = express.Router();

const reportApis = [
  "sessions",
  "user-group",
  "applications",
  "approvals",
  "device-report",
  "scans",
  "user-group-maping",
  "authorized-users",
  "DOCR",
  "credentials",
  "authentications",
  "usergroupRestrictions",
  "targetgroupRestrictions",
  "scanjobs",
  "OutOfOfficeReport",
  "otp",
];

router.get("/", (req, res) => {
  res.json({ apis: reportApis });
});

module.exports = router;
