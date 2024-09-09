import { uploadImage, deleteImage } from '../config/cloudinary.js';
import fs from 'fs-extra';

const uploadImages = async (files) => {
  const urls = [];
  for (const file of files){
    const { path } = file;
    const result = await uploadImage(path, 'snapgram');
    urls.push({
      public_id: result.public_id,
      secure_url: result.secure_url
    });
    await fs.unlink(path);
  } 
  return urls; 
}

const uploadOneImage = async (file) => {
  const { path } = file;
  const result = await uploadImage(path, 'snapgram');
  await fs.unlink(path);
  return {
    public_id: result.public_id,
    secure_url: result.secure_url
  }; 
}

const deleteImages = async (files) => {
  for (const file of files){
    await deleteImage(file);
  } 
}

const deleteOneImage = async (file) => {
  await deleteImage(file);
}

export {
  uploadImages,
  uploadOneImage,
  deleteImages,
  deleteOneImage
}