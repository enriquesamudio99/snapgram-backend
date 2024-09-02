import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
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
  generateToken
}