import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log(response.url);
    // once the file is uploaded, we would like to delete it from the server
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log(error);
    fs.unlinkSync(localFilePath);
  }
};
const deleteFromCloudinary = async (publicID) => {
  try {
    const result = await cloudinary.uploader.destroy(publicID);
    console.log("successfully deleted from cloudinary", publicID);
  } catch (error) {
    console.log("Err deleting from cloudinary", error);
  }
};
export { uploadOnCloudinary, deleteFromCloudinary };
