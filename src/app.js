import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';

// Import Routes 
import { 
  authRoutes, 
  usersRoutes,
  postsRoutes,
  communitiesRoutes
} from './routes/index.js';
import { BASE_API_URL } from './config/env.js';

// Configure app
const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// Routes
app.use(`${BASE_API_URL}/auth`, authRoutes);
app.use(`${BASE_API_URL}/users`, usersRoutes);
app.use(`${BASE_API_URL}/posts`, postsRoutes);
app.use(`${BASE_API_URL}/communities`, communitiesRoutes);

export default app;