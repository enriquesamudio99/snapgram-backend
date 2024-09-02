import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const MONGO_URI = process.env.MONGO_URI;
export const SECRET_WORD = process.env.SECRET_WORD;
export const BASE_API_URL = process.env.BASE_API_URL;
export const FRONTEND_URL = process.env.FRONTEND_URL;
export const FRONTEND_PORT = process.env.FRONTEND_PORT;
export const BACKEND_URL = process.env.BACKEND_URL;