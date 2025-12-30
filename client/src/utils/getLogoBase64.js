const getLogoBase64 = async () => {
  try {
    const res = await fetch("/api/logo");
    if (!res.ok) {
      console.warn("Failed to fetch logo metadata");
      return null;
    }

    const data = await res.json();

    // If base64 is already a full Data URI
    let base64 = data.logoBase64 || data.base64;

    if (!base64.startsWith("data:image")) {
      base64 = `data:image/png;base64,${base64}`;
    }

    // Ensure image loads correctly for dimension calculations
    const image = new Image();
    image.src = base64;

    // Wait until image loads to get dimensions
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    return {
      base64,
      width: 60, // adjust as needed
      height: (image.height / image.width) * 60, // maintain aspect ratio
    };
  } catch (err) {
    console.error("Error fetching Base64 logo:", err);
    return null;
  }
};

export default getLogoBase64;
