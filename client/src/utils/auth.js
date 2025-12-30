// src/utils/auth.js

import axios from "axios";

export const fetchUserRole = async () => {
  const token = localStorage.getItem("token"); // Get the token from localStorage

  if (!token) return null; // Return null if token doesn't exist

  try {
    const response = await axios.get("/api/role", {
      headers: {
        "x-auth-token": token, // Include the token in the header
      },
    });
    return response.data.role; // Return the role if successful
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null; // Return null if there's an error
  }
};
