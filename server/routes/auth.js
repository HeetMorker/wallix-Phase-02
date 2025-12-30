// const express = require("express");
// const router = express.Router();
// const User = require("../models/User");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const { authenticate, authenticateUser } = require("../utils/ldapAuth");

// router.post("/register", async (req, res) => {
//   const { username, dn, role, allowedAPIs, authMethod, password, email } =
//     req.body;

//   try {
//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       console.log("Registration failed: Username already exists");
//       return res.status(400).json({ message: "Username already exists" });
//     }

//     const newUser = new User({
//       username,
//       dn,
//       role,
//       allowedAPIs,
//       authMethod,
//       email,
//       password,
//     });
//     await newUser.save();

//     console.log("User registered successfully:", username);
//     res.status(201).json({ message: "User registered successfully" });
//   } catch (error) {
//     console.error("Server error during registration:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// router.post("/login", async (req, res) => {
//   const { username, password } = req.body;

//   console.log("Login attempt for username:", username);

//   try {
//     const user = await User.findOne({ username });
//     if (!user) {
//       console.log("Login failed: User not found");
//       return res.status(400).json({ message: "Invalid username or password" });
//     }

//     // Attempt to authenticate via LDAP
//     if (user.authMethod === "ldap") {
//       await authenticateUser(user.dn, password, (err) => {
//         if (err) {
//           console.log(
//             "LDAP authentication failed for:",
//             username,
//             "with DN:",
//             user.dn
//           );
//           return res
//             .status(400)
//             .json({ message: "Invalid username or password" });
//         }

//         console.log("LDAP authentication successful for:", username);

//         const token = jwt.sign(
//           { id: user._id, role: user.role },
//           process.env.JWT_SECRET,
//           { expiresIn: "1h" }
//         );

//         console.log("Token generated for user:", username);
//         res.json({ token, role: user.role, allowedAPIs: user.allowedAPIs });
//       });
//     } else if (user.authMethod === "local") {
//       if (await user.comparePassword(password)) {
//         console.log("Local authentication successful for:", username);

//         const token = jwt.sign(
//           { id: user._id, role: user.role },
//           process.env.JWT_SECRET,
//           { expiresIn: "1h" }
//         );

//         console.log("Token generated for user:", username);
//         return res.json({
//           token,
//           role: user.role,
//           allowedAPIs: user.allowedAPIs,
//         });
//       } else {
//         return res
//           .status(400)
//           .json({ message: "Invalid username or password" });
//       }
//     }
//   } catch (error) {
//     console.error("Server error during login:", error);
//     res.status(500).json({ message: "Server error during login" });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateUser } = require("../utils/ldapAuth");

// 🔐 Register a new user
router.post("/register", async (req, res) => {
  const { username, dn, role, allowedAPIs, authMethod, password, email } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log("🚫 Registration failed: Username already exists");
      return res.status(400).json({ message: "Username already exists" });
    }

    const newUser = new User({
      username,
      dn,
      role,
      allowedAPIs,
      authMethod,
      email,
      password,
    });

    await newUser.save();

    console.log("✅ User registered successfully:", username);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Server error during registration:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔐 Login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("🔑 Login attempt for username:", username);

  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log("🚫 Login failed: User not found");
      return res.status(400).json({ message: "Invalid username or password" });
    }

    if (user.authMethod === "ldap") {
      // Ensure DN is present
      if (!user.dn) {
        console.error("🚫 Login failed: Missing DN for LDAP user", username);
        return res.status(400).json({ message: "LDAP DN missing for user" });
      }

      // Attempt LDAP authentication
      await authenticateUser(user.dn, password, (err) => {
        if (err) {
          console.log("❌ LDAP authentication failed for:", username, "with DN:", user.dn);
          return res.status(400).json({ message: "Invalid username or password" });
        }

        console.log("✅ LDAP authentication successful for:", username);

        const token = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        console.log("🔐 Token generated for user:", username);
        res.json({ token, role: user.role, allowedAPIs: user.allowedAPIs });
      });
    } else if (user.authMethod === "local") {
      // Local authentication
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log("🚫 Invalid local password for:", username);
        return res.status(400).json({ message: "Invalid username or password" });
      }

      console.log("✅ Local authentication successful for:", username);

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      console.log("🔐 Token generated for user:", username);
      return res.json({ token, role: user.role, allowedAPIs: user.allowedAPIs });
    } else {
      console.log("🚫 Unsupported authentication method for:", username);
      return res.status(400).json({ message: "Unsupported authentication method" });
    }
  } catch (error) {
    console.error("❌ Server error during login:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;
