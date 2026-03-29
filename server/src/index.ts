import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Socket.io setup
export const io = new SocketServer(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  },
});

// Socket.io room handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join NGO-specific room
  socket.on('join_ngo', (ngo_id: string) => {
    socket.join(`ngo_${ngo_id}`);
    console.log(`Socket ${socket.id} joined room ngo_${ngo_id}`);
  });

  // Join volunteer-specific room
  socket.on('join_volunteer', (volunteer_id: string) => {
    socket.join(`volunteer_${volunteer_id}`);
    console.log(`Socket ${socket.id} joined room volunteer_${volunteer_id}`);
  });

  // Join task chat room
  socket.on('join_task', (task_id: string) => {
    socket.join(`task_${task_id}`);
    console.log(`Socket ${socket.id} joined room task_${task_id}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Basic health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

import authRoutes from './routes/auth.routes';
import donorRoutes from './routes/donors.routes';
import listingRoutes from './routes/listings.routes';
import claimRoutes from './routes/claims.routes';
import analyticsRoutes from './routes/analytics.routes';
import ngoRoutes from './routes/ngo.routes';
import volunteerRoutes from './routes/volunteer.routes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ngo', ngoRoutes);
app.use('/api/volunteer', volunteerRoutes);

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
