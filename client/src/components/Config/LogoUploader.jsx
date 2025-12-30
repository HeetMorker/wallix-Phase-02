// import React, { useState } from "react";

// const LogoUploader = () => {
//   const [file, setFile] = useState(null);
//   const [status, setStatus] = useState(""); // 'success' | 'error' | ''
//   const [message, setMessage] = useState("");

//   const handleUpload = async () => {
//     if (!file) return;

//     const formData = new FormData();
//     formData.append("logo", file);

//     try {
//       const response = await fetch("/api/logo/upload", {
//         method: "POST",
//         body: formData,
//       });

//       const data = await response.json();
//       if (response.ok) {
//         setStatus("success");
//         setMessage(data.message || "Logo uploaded successfully");

//         // Refresh page after 2 seconds
//         setTimeout(() => {
//           window.location.reload();
//         }, 2000);
//       } else {
//         setStatus("error");
//         setMessage(data.message || "Upload failed");
//       }
//     } catch (error) {
//       console.error("Upload error:", error);
//       setStatus("error");
//       setMessage("Upload failed. Try again.");
//     }
//   };

//   return (
//     <div className="bg-white p-4 rounded-lg shadow-md max-w-md">
//       <h2 className="text-lg font-semibold mb-3">Upload Logo</h2>

//       <input
//         type="file"
//         accept="image/*"
//         className="mb-3"
//         onChange={(e) => {
//           setFile(e.target.files[0]);
//           setStatus("");
//           setMessage("");
//         }}
//       />

//       <button
//         onClick={handleUpload}
//         disabled={!file}
//         className="btn btn-secondary"
//       >
//         Upload Logo
//       </button>

//       {message && (
//         <div
//           className={`mt-4 px-4 py-2 rounded-md text-sm font-medium ${
//             status === "success"
//               ? "bg-green-100 text-green-800"
//               : "bg-red-100 text-red-700"
//           }`}
//         >
//           {message}
//         </div>
//       )}
//     </div>
//   );
// };

// export default LogoUploader;

import React, { useState } from "react";

const LogoUploader = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await fetch("/api/logo/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Logo uploaded successfully");
        setError("");

        // Refresh after short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage("");
        setError(data.message || "Upload failed. Please try again.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("");
      setError("Upload failed. Please try again.");
    }
  };

  return (
    <div className="p-4 border rounded bg-light shadow-sm">
      <h4 className=" font-semibold mb-3">Company Logo</h4>

      <input
        type="file"
        accept="image/*"
        className="mb-3"
        onChange={(e) => {
          setFile(e.target.files[0]);
          setMessage("");
          setError("");
        }}
      />

      <button
        onClick={handleUpload}
        disabled={!file}
        className="btn btn-secondary"
      >
        Upload Logo
      </button>

      {/* Final messages */}
      {message && <div className="alert alert-success mt-4">{message}</div>}
      {error && <div className="alert alert-danger mt-4">{error}</div>}
    </div>
  );
};

export default LogoUploader;
