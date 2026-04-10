import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

    // Configuration
cloudinary.config(
{ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) return null;

    const response = await cloudinary.uploader.upload(
      filePath.replace(/\\/g, "/"), // 🔥 FIX
      {
        resource_type: "auto",
      }
    );

    console.log("Uploaded:", response.secure_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return response;

  } catch (error) {
    console.log("Cloudinary Error:", error.message);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return null;
  }
};

    export { uploadOnCloudinary };

 






