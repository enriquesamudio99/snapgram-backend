import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import Routes 
import { 
  authRoutes, 
  usersRoutes,
  postsRoutes,
  communitiesRoutes,
  commentsRoutes
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
app.use(`/${BASE_API_URL}/auth`, authRoutes);
app.use(`/${BASE_API_URL}/users`, usersRoutes);
app.use(`/${BASE_API_URL}/posts`, postsRoutes);
app.use(`/${BASE_API_URL}/communities`, communitiesRoutes);
app.use(`/${BASE_API_URL}/comments`, commentsRoutes);

const server = createServer(app);
export const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected', socket.id);

  socket.on('joinRoom', (userId) => {
    socket.join(userId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

export default server;