import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadFileCloudinary = async function (filePath) {
  try {
    if (!filePath) return null;

    // uploading file on cloudinary

    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    // uploaded successfully
    // console.log("file successfully uploaded", response.url);
    fs.unlinkSync(filePath);
    return response;
  } catch (error) {
    fs.unlinkSync(filePath);
    // remove the locally saved temperoray file as server operation failed
    return null;
  }
};

export { uploadFileCloudinary };
