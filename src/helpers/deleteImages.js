import { deleteImage } from '../config/cloudinary.js';

const deleteImages = async (files) => {
  for (const file of files){
    await deleteImage(file);
  } 
}

export default deleteImages;