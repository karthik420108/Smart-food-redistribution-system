import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://smart-food-redistribution-system.onrender.com';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

// Helper for debugging
socket.on('connect', () => {
  console.log('Real-time: Connected to server');
});

socket.on('disconnect', () => {
  console.log('Real-time: Disconnected from server');
});
