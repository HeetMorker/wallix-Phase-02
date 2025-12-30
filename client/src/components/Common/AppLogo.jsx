import React, { useEffect, useState } from "react";

const AppLogo = () => {
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    fetch("/api/logo")
      .then((res) => res.json())
      .then((data) => {
        if (data.base64) setLogo(data.base64);
      })
      .catch((err) => console.error("Error fetching logo:", err));
  }, []);

  return (
    <div>
      {logo ? (
        <img src={logo} alt="Logo" style={{ height: 50 }} />
      ) : (
        <span>Loading Logo...</span>
      )}
    </div>
  );
};

export default AppLogo;
