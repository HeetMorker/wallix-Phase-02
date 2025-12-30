// import React from "react";
// import { Navigate } from "react-router-dom";

// const ProtectedRoute = ({ children }) => {
//   const isAuthenticated = Boolean(localStorage.getItem("token"));

//   return isAuthenticated ? children : <Navigate to="/login" />;
// };

// export default ProtectedRoute;

// src/components/ProtectedRoute.js

// src/components/ProtectedRoute.js

import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { fetchUserRole } from "../../utils/auth"; // Helper function to fetch role

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const role = await fetchUserRole();
        if (role) {
          setUserRole(role);
        }
      } catch (error) {
        console.error("Error verifying user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    verifyUser();
  }, []);
  if (isLoading)
    return (
      <div className="loader-container ">
        <img src="./assets/img/1487.gif" alt="" />
      </div>
    );
  if (error) return <p>Error: {error.message}</p>;
  if (!userRole)
    return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Otherwise, render the protected route
  return children;
};

export default ProtectedRoute;
