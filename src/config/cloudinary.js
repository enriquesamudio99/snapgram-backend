import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '../config/env.js';

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true
});

const uploadImage = async (path, folder) => {
  return await cloudinary.uploader.upload(path, {
    folder
  })
}

const deleteImage = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
}

export {
  uploadImage,
  deleteImage
};