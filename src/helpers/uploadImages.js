import { uploadImage } from '../config/cloudinary.js';
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

export default uploadImages;