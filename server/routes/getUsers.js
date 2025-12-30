// routes/getUsers.js
const express = require("express");
const { auth, authorize } = require("../middleware/auth"); // Use the authentication and authorization middleware
const User = require("../models/User"); // Assuming your user model is in models/User.js
const router = express.Router();
const bcrypt = require("bcryptjs");

// Route to get all registered users - accessible to admins only
router.get("/all", auth, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching registered users:", error);
    res.status(500).json({ message: "Failed to fetch registered users" });
  }
});

// router.get("/allowedAPIs", auth, async (req, res) => {
//   try {
//     const users = await User.findById(req.user.id);
//     res.status(200).json({ allowedAPIs: users.allowedAPIs });
//   } catch (error) {
//     console.error("Error fetching allowedAPIs :", error);
//     res.status(500).json({ message: "Failed to fetch allowedAPIs" });
//   }
// });

router.get("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const users = await User.findById(req.params.id);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching registered users:", error);
    res.status(500).json({ message: "Failed to fetch registered users" });
  }
});

// Route to delete a user by ID - accessible to admins only
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// Route to update a user by ID - accessible to admins only
router.put("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    // If authMethod is local AND password is being updated
    if (
      updatedData.authMethod === "local" &&
      updatedData.password &&
      updatedData.password.trim() !== ""
    ) {
      updatedData.password = await bcrypt.hash(updatedData.password, 10);
    } else {
      // If no password was sent (empty field), delete it from update to avoid setting it as empty string
      delete updatedData.password;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

module.exports = router;
