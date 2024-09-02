import mongoose from 'mongoose';
import { MONGO_URI } from './env.js';

const dbConnection = async () => {
  try { 
    mongoose.connect(MONGO_URI);
    console.log('Database online'); 
  } catch (error) {
    console.log(error);
    throw new Error('Error initializing the database');
  }
}

export default dbConnection;