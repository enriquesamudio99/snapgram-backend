import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
}

const generateRandomToken = () => {
  return Math.random().toString(32).substring(2) + Date.now().toString();
}

const generateRandomId = () => {
  return Math.random().toString(32).substring(2, 10);
}

const generateToken = (data) => {
  return jwt.sign(
    data, 
    process.env.SECRET_WORD,
    {
      expiresIn: '6h'
    }
  );
}

export {
  validateObjectId,
  generateRandomToken,
  generateRandomId,
  generateToken
}