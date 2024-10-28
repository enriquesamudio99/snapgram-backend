import { uploadImage, deleteImage } from '../config/cloudinary.js';

const uploadImages = async (files) => {
  const urls = [];
  for (const file of files){
    const { buffer } = file;
    const result = await uploadImage(buffer, 'snapgram');
    urls.push({
      public_id: result.public_id,
      secure_url: result.secure_url
    });
  } 
  return urls; 
}

const uploadOneImage = async (file) => {
  const { buffer } = file;
  const result = await uploadImage(buffer, 'snapgram');
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