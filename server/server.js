// require("dotenv").config({
//   path: require("path").resolve(__dirname, "../.env"),
// });

// const express = require("express");
// const cors = require("cors");
// const session = require("express-session");
// const https = require("https");
// const fs = require("fs");
// const jwt = require("jsonwebtoken");
// const path = require("path");
// const helmet = require("helmet");
// const rateLimit = require("express-rate-limit");

// const app = express();

// /* -------------------------- Basic hardening -------------------------- */
// app.set("trust proxy", 1);
// app.disable("x-powered-by");
// app.use((req, res, next) => {
//   res.removeHeader("Server");
//   next();
// });

// /* ------------------------------ CORS ------------------------------- */
// const corsOrigins = [
//   process.env.CORS_ORIGIN,
//   "http://localhost:3000",
//   "http://127.0.0.1:3000",
// ].filter(Boolean);

// app.use(
//   cors({
//     origin: corsOrigins.length ? corsOrigins : true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
//     credentials: true,
//     maxAge: 86400,
//   })
// );

// /* --------------------------- Security ----------------------------- */
// app.use(helmet());
// app.use(
//   helmet.contentSecurityPolicy({
//     useDefaults: true,
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       imgSrc: ["'self'", "data:", "blob:"],
//       fontSrc: ["'self'", "data:"],
//       connectSrc: ["'self'", "*"],
//       objectSrc: ["'none'"],
//       baseUri: ["'self'"],
//       frameAncestors: ["'none'"],
//       formAction: ["'self'"],
//       upgradeInsecureRequests: [],
//     },
//   })
// );
// app.use(helmet.noSniff());
// app.use(helmet.frameguard({ action: "deny" }));
// app.use(helmet.referrerPolicy({ policy: "no-referrer" }));

// /* ------------------------- Body parsing --------------------------- */
// app.use(express.json({ limit: "2mb" }));
// app.use(express.urlencoded({ extended: false }));

// /* ------------------------ Cache control --------------------------- */
// const noStore = (req, res, next) => {
//   res.setHeader("Cache-Control", "no-store");
//   res.setHeader("Pragma", "no-cache");
//   res.setHeader("Expires", "0");
//   next();
// };
// app.use("/api", noStore);

// /* ---------------------- Static & uploads -------------------------- */
// const uploadsPath = path.join(process.cwd(), "uploads");

// app.use(
//   "/",
//   express.static("public", {
//     setHeaders: (res) => {
//       res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
//       res.removeHeader("Server");
//     },
//   })
// );

// app.use(
//   "/uploads",
//   express.static(uploadsPath, {
//     dotfiles: "ignore",
//     setHeaders: (res) => {
//       res.setHeader("Cache-Control", "no-store");
//       res.removeHeader("Server");
//       res.setHeader(
//         "Content-Security-Policy",
//         "default-src 'none'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline';"
//       );
//     },
//   })
// );

// /* --------------------- Rate-limit auth route ---------------------- */
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use("/api/auth/login", authLimiter);

// /* --------------------------- App imports -------------------------- */
// const dbConnect = require("./config/database");
// const User = require("./models/User");
// const License = require("./models/license.model");

// const { auth, authorizedForAPIs, authorize } = require("./middleware/auth");

// const sessionRoutes = require("./routes/sessions");
// const userGroupRoutes = require("./routes/userGroups");
// const targetGroupRoutes = require("./routes/targetGroup");
// const deviceReportRoutes = require("./routes/deviceReport");
// const applicationRoutes = require("./routes/application");
// const scansRoutes = require("./routes/scans");
// const scanJobsRoutes = require("./routes/scanjobs").router;
// const accountsRoutes = require("./routes/accounts");
// const approvalsRoutes = require("./routes/approvals");
// const ipAddressRoutes = require("./routes/ipAddresses");
// const fetchAllRoute = require("./routes/fetchAll");
// const authRoutes = require("./routes/auth");
// const authorizationRoutes = require("./routes/authorization");
// const authenticationsRoutes = require("./routes/authentications");
// const reportRoutes = require("./routes/reportRoutes");
// const licenseRouter = require("./routes/license");
// const configRouter = require("./routes/config");
// const scheduledReportsRoute = require("./routes/scheduledReport");
// const getUsersRoute = require("./routes/getUsers");
// const reportLogs = require("./routes/reportLogs");
// const reportApisRoute = require("./routes/reportApis");
// const smtpConfigRoutes = require("./routes/smtpConfig");
// const ldapConfigRoutes = require("./routes/ldapConfig.route");
// const usergroupRestrictionRoute =
//   require("./routes/usergroupRestrictions").router;
// const targetgroupRestrictionRoute =
//   require("./routes/targetgroupRestrictions").router;
// const { fetchSplunkData } = require("./routes/splunkData");
// const sendReport = require("./routes/sendReport");
// const logoRoutes = require("./routes/logo");
// const companyInfoRoutes = require("./routes/companyInfo");
// const runReportsTrigger = require("./routes/runReportsTrigger");
// const { startReportScheduler } = require("./jobs/reportScheduler");

// /* ----------------------------- Health ping ----------------------------- */
// app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));

// /* --------------------------- Public routes --------------------------- */
// /* Keep /api/license public so you can activate a license even when invalid/missing */
// app.use("/api/logo", logoRoutes);
// app.use("/api/auth", authRoutes);
// app.use("/api/license", licenseRouter);

// /* ----------------------------- Splunk proxy ----------------------------- */
// app.get(
//   "/api/credentials",
//   auth,
//   authorizedForAPIs(["credentials"]),
//   async (_req, res) => {
//     try {
//       const data = await fetchSplunkData();
//       res.json(data);
//     } catch (error) {
//       console.error("Error fetching Splunk data:", error);
//       res.status(500).json({ error: "Failed to fetch data from Splunk" });
//     }
//   }
// );

// /* -------------------------- License gate (/api) -------------------------- */
// /* Everything mounted AFTER this requires a valid license */
// // --- License Verification (applies to /api) ---
// const PUBLIC_LICENSE_SAFE = [
//   /^\/api\/auth(\/|$)/, // login/logout/refresh
//   /^\/api\/license(\/|$)/, // status + activate (UI needs this)
//   /^\/api\/role$/, // UI fetch after login
//   /^\/api\/username$/, // UI header/name
//   /^\/api\/allowedAPIs$/, // build nav
//   /^\/api\/logo(\/|$)/, // branding assets
//   /^\/api\/health(\/|$)/, // optional health endpoint
// ];

// const licenseGate = async (req, res, next) => {
//   // Always allow preflight and the public bootstrap endpoints
//   if (req.method === "OPTIONS") return next();
//   const url = req.originalUrl || req.url || "";
//   if (PUBLIC_LICENSE_SAFE.some((re) => re.test(url))) return next();

//   try {
//     // Read license file
//     const licensePath = path.resolve(process.cwd(), "license");
//     const tokenStr = fs.readFileSync(licensePath, "utf8");

//     // Fetch owner from DB
//     const lic = await License.findOne({});
//     if (!lic || !lic.name) {
//       return res.status(402).json({ error: "LICENSE_REQUIRED" });
//     }

//     // Verify token with owner-bound secret
//     jwt.verify(tokenStr, "wallixSecret" + lic.name);
//     return next(); // ✅ licensed, proceed
//   } catch (err) {
//     if (err?.name === "TokenExpiredError") {
//       return res.status(401).json({ error: "LICENSE_EXPIRED" });
//     }
//     // File missing, invalid token, or any other issue -> lock app
//     return res.status(402).json({ error: "LICENSE_REQUIRED" });
//   }
// };

// app.use("/api", licenseGate);

// /* -------------------------- Helper endpoints -------------------------- */
// app.get("/api/allowedAPIs", auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     res.status(200).json({ allowedAPIs: user.allowedAPIs });
//   } catch (error) {
//     console.error("Error fetching allowedAPIs:", error);
//     res.status(500).json({ message: "Failed to fetch allowedAPIs" });
//   }
// });

// app.get("/api/role", auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     res.status(200).json({ role: user.role });
//   } catch (error) {
//     console.error("Error fetching role:", error);
//     res.status(500).json({ message: "Failed to fetch role" });
//   }
// });

// app.get("/api/username", auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     res.status(200).json({ username: user.username });
//   } catch (error) {
//     console.error("Error fetching username:", error);
//     res.status(500).json({ message: "Failed to fetch username" });
//   }
// });

// /* ---------------------------- Admin routes ---------------------------- */
// app.use("/api/config", auth, authorize("admin"), configRouter);

// /* ---------------------------- Protected API ---------------------------- */
// app.use("/api/users", getUsersRoute);
// app.use("/api/ipaddresses", ipAddressRoutes);
// app.use("/api/scheduled-reports", scheduledReportsRoute);
// app.use("/api/send-report", sendReport);
// app.use("/api", fetchAllRoute);
// app.use("/api/authorizations", authorizationRoutes.router);
// app.use("/api/report-logs", reportLogs);
// app.use("/api/reportApis", reportApisRoute);
// app.use("/api/smtp-config", smtpConfigRoutes);
// app.use("/api/ldap-config", ldapConfigRoutes);
// app.use("/api/company-info", companyInfoRoutes);

// app.use(
//   "/api/sessions",
//   auth,
//   authorizedForAPIs(["sessions"]),
//   sessionRoutes.router
// );
// app.use(
//   "/api/usergroups",
//   auth,
//   authorizedForAPIs(["user-group", "authorized-users"]),
//   userGroupRoutes.router
// );
// app.use("/api/targetgroup", targetGroupRoutes.router);
// app.use(
//   "/api/devicereport",
//   auth,
//   authorizedForAPIs(["device-report", "DOCR"]),
//   deviceReportRoutes.router
// );
// app.use(
//   "/api/applications",
//   auth,
//   authorizedForAPIs(["applications"]),
//   applicationRoutes.router
// );
// app.use("/api/scans", auth, authorizedForAPIs(["scans"]), scansRoutes.router);
// app.use("/api/scanjobs", scanJobsRoutes);
// app.use(
//   "/api/accounts",
//   auth,
//   authorizedForAPIs(["accounts"]),
//   accountsRoutes.router
// );
// app.use(
//   "/api/approvals",
//   auth,
//   authorizedForAPIs(["approvals"]),
//   approvalsRoutes.router
// );
// app.use("/api/authentications", authenticationsRoutes.router);
// app.use("/api/usergrouprestrictions", usergroupRestrictionRoute);
// app.use("/api/targetgrouprestrictions", targetgroupRestrictionRoute);
// app.use(
//   "/api/report",
//   auth,
//   authorizedForAPIs(["user-group-maping"]),
//   reportRoutes
// );
// app.use("/api/run-reports", runReportsTrigger);

// /* ---------------------- Global error handler (last) ---------------------- */
// app.use((err, _req, res, _next) => {
//   if (err && err.code === "ECONNRESET") {
//     console.warn("Global Handler: Ignored harmless ECONNRESET");
//     return res.end();
//   }
//   console.error("Unhandled middleware error:", err);
//   return res.status(500).json({ error: "Internal Server Error" });
// });

// /* ----------------------- Process-level guards ----------------------- */
// process.on("uncaughtException", (err) => {
//   if (err && err.code === "ECONNRESET") {
//     console.warn("Global Handler: Ignored harmless ECONNRESET");
//   } else {
//     console.error("Unhandled Exception:", err);
//   }
// });

// process.on("unhandledRejection", (reason) => {
//   console.error("Unhandled Rejection:", reason);
// });

// /* ---------------------- Start background jobs ---------------------- */
// startReportScheduler();

// /* ------------------------------ Listen ------------------------------ */
// const PORT = process.env.PORT || 5000;

// dbConnect()
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`Server is running on port ${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error("Database connection failed:", err);
//   });

// module.exports = app;
// ----- Load .env correctly (works with Node and pkg binary) -----
const _path = require("path");
const _baseDir = process.pkg ? _path.dirname(process.execPath) : __dirname;
require("dotenv").config({ path: _path.join(_baseDir, ".env") });
// ---------------------------------------------------------------

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const https = require("https");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

/* -------------------------- Basic hardening -------------------------- */
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.removeHeader("Server");
  next();
});

/* ------------------------------ CORS ------------------------------- */
const corsOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
    credentials: true,
    maxAge: 86400,
  })
);

/* --------------------------- Security ----------------------------- */
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "*"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  })
);
app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));

/* ------------------------- Body parsing --------------------------- */
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));

/* ------------------------ Cache control --------------------------- */
const noStore = (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
};
app.use("/api", noStore);

/* ---------------------- Static & uploads -------------------------- */
const uploadsPath = path.join(process.cwd(), "uploads");

app.use(
  "/",
  express.static("public", {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.removeHeader("Server");
    },
  })
);

app.use(
  "/uploads",
  express.static(uploadsPath, {
    dotfiles: "ignore",
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store");
      res.removeHeader("Server");
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline';"
      );
    },
  })
);

/* --------------------- Rate-limit auth route ---------------------- */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);

/* --------------------------- App imports -------------------------- */
const dbConnect = require("./config/database");
const User = require("./models/User");
const License = require("./models/license.model");

const { auth, authorizedForAPIs, authorize } = require("./middleware/auth");

const sessionRoutes = require("./routes/sessions");
const userGroupRoutes = require("./routes/userGroups");
const targetGroupRoutes = require("./routes/targetGroup");
const deviceReportRoutes = require("./routes/deviceReport");
const applicationRoutes = require("./routes/application");
const scansRoutes = require("./routes/scans");
const scanJobsRoutes = require("./routes/scanjobs").router;
const accountsRoutes = require("./routes/accounts");
const approvalsRoutes = require("./routes/approvals");
const ipAddressRoutes = require("./routes/ipAddresses");
const fetchAllRoute = require("./routes/fetchAll");
const authRoutes = require("./routes/auth");
const authorizationRoutes = require("./routes/authorization");
const authenticationsRoutes = require("./routes/authentications");
const reportRoutes = require("./routes/reportRoutes");
const licenseRouter = require("./routes/license");
const configRouter = require("./routes/config");
const scheduledReportsRoute = require("./routes/scheduledReport");
const getUsersRoute = require("./routes/getUsers");
const reportLogs = require("./routes/reportLogs");
const reportApisRoute = require("./routes/reportApis");
const smtpConfigRoutes = require("./routes/smtpConfig");
const ldapConfigRoutes = require("./routes/ldapConfig.route");
const usergroupRestrictionRoute =
  require("./routes/usergroupRestrictions").router;
const targetgroupRestrictionRoute =
  require("./routes/targetgroupRestrictions").router;
const { fetchSplunkData } = require("./routes/splunkData");
const sendReport = require("./routes/sendReport");
const logoRoutes = require("./routes/logo");
const otpRoutes = require("./routes/otp.route");
const companyInfoRoutes = require("./routes/companyInfo");
const runReportsTrigger = require("./routes/runReportsTrigger");
const { startReportScheduler } = require("./jobs/reportScheduler");

/* ----------------------------- Health ping ----------------------------- */
app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));

/* --------------------------- Public routes --------------------------- */
/* Keep /api/license public so you can activate a license even when invalid/missing */
app.use("/api/logo", logoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/license", licenseRouter);

/* ----------------------------- Splunk proxy ----------------------------- */
app.get(
  "/api/credentials",
  auth,
  authorizedForAPIs(["credentials"]),
  async (_req, res) => {
    try {
      const data = await fetchSplunkData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching Splunk data:", error);
      res.status(500).json({ error: "Failed to fetch data from Splunk" });
    }
  }
);

/* -------------------------- License gate (/api) -------------------------- */
/* Everything mounted AFTER this requires a valid license */
// --- License Verification (applies to /api) ---
const PUBLIC_LICENSE_SAFE = [
  /^\/api\/auth(\/|$)/, // login/logout/refresh
  /^\/api\/license(\/|$)/, // status + activate (UI needs this)
  /^\/api\/role$/, // UI fetch after login
  /^\/api\/username$/, // UI header/name
  /^\/api\/allowedAPIs$/, // build nav
  /^\/api\/logo(\/|$)/, // branding assets
  /^\/api\/health(\/|$)/, // optional health endpoint
];

const licenseGate = async (req, res, next) => {
  // Always allow preflight and the public bootstrap endpoints
  if (req.method === "OPTIONS") return next();
  const url = req.originalUrl || req.url || "";
  if (PUBLIC_LICENSE_SAFE.some((re) => re.test(url))) return next();

  try {
    // Read license file
    const licensePath = path.resolve(process.cwd(), "license");
    const tokenStr = fs.readFileSync(licensePath, "utf8");

    // Fetch owner from DB
    const lic = await License.findOne({});
    if (!lic || !lic.name) {
      return res.status(402).json({ error: "LICENSE_REQUIRED" });
    }

    // Verify token with owner-bound secret
    jwt.verify(tokenStr, "wallixSecret" + lic.name);
    return next(); // ✅ licensed, proceed
  } catch (err) {
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ error: "LICENSE_EXPIRED" });
    }
    // File missing, invalid token, or any other issue -> lock app
    return res.status(402).json({ error: "LICENSE_REQUIRED" });
  }
};

app.use("/api", licenseGate);

/* -------------------------- Helper endpoints -------------------------- */
app.get("/api/allowedAPIs", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ allowedAPIs: user.allowedAPIs });
  } catch (error) {
    console.error("Error fetching allowedAPIs:", error);
    res.status(500).json({ message: "Failed to fetch allowedAPIs" });
  }
});

app.get("/api/role", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ role: user.role });
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(500).json({ message: "Failed to fetch role" });
  }
});

app.get("/api/username", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ username: user.username });
  } catch (error) {
    console.error("Error fetching username:", error);
    res.status(500).json({ message: "Failed to fetch username" });
  }
});

/* ---------------------------- Admin routes ---------------------------- */
app.use("/api/config", auth, authorize("admin"), configRouter);

/* ---------------------------- Protected API ---------------------------- */
app.use("/api/users", getUsersRoute);
app.use("/api/ipaddresses", ipAddressRoutes);
app.use("/api/scheduled-reports", scheduledReportsRoute);
app.use("/api/send-report", sendReport);
app.use("/api", fetchAllRoute);
app.use("/api/authorizations", authorizationRoutes.router);
app.use("/api/report-logs", reportLogs);
app.use("/api/reportApis", reportApisRoute);
app.use("/api/smtp-config", smtpConfigRoutes);
app.use("/api/ldap-config", ldapConfigRoutes);
app.use("/api/company-info", companyInfoRoutes);

app.use(
  "/api/sessions",
  auth,
  authorizedForAPIs(["sessions"]),
  sessionRoutes.router
);
app.use("/api/otp", auth, authorizedForAPIs(["otp"]), otpRoutes.router);
app.use(
  "/api/usergroups",
  auth,
  authorizedForAPIs(["user-group", "authorized-users"]),
  userGroupRoutes.router
);
app.use("/api/targetgroup", targetGroupRoutes.router);
app.use(
  "/api/devicereport",
  auth,
  authorizedForAPIs(["device-report", "DOCR"]),
  deviceReportRoutes.router
);
app.use(
  "/api/applications",
  auth,
  authorizedForAPIs(["applications"]),
  applicationRoutes.router
);
app.use("/api/scans", auth, authorizedForAPIs(["scans"]), scansRoutes.router);
app.use("/api/scanjobs", scanJobsRoutes);
app.use(
  "/api/accounts",
  auth,
  authorizedForAPIs(["accounts"]),
  accountsRoutes.router
);
app.use(
  "/api/approvals",
  auth,
  authorizedForAPIs(["approvals"]),
  approvalsRoutes.router
);
app.use("/api/authentications", authenticationsRoutes.router);
app.use("/api/usergrouprestrictions", usergroupRestrictionRoute);
app.use("/api/targetgrouprestrictions", targetgroupRestrictionRoute);
app.use(
  "/api/report",
  auth,
  authorizedForAPIs(["user-group-maping"]),
  reportRoutes
);
app.use("/api/run-reports", runReportsTrigger);

/* ---------------------- Global error handler (last) ---------------------- */
app.use((err, _req, res, _next) => {
  if (err && err.code === "ECONNRESET") {
    console.warn("Global Handler: Ignored harmless ECONNRESET");
    return res.end();
  }
  console.error("Unhandled middleware error:", err);
  return res.status(500).json({ error: "Internal Server Error" });
});

/* ----------------------- Process-level guards ----------------------- */
process.on("uncaughtException", (err) => {
  if (err && err.code === "ECONNRESET") {
    console.warn("Global Handler: Ignored harmless ECONNRESET");
  } else {
    console.error("Unhandled Exception:", err);
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

/* ---------------------- Start background jobs ---------------------- */
startReportScheduler();

/* ------------------------------ Listen ------------------------------ */
const PORT = process.env.PORT || 5000;

dbConnect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

module.exports = app;
