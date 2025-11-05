import { io } from 'socket.io-client';

console.log('Testing WebSocket connection to production backend...');

const socket = io('https://pbl4-jecm.onrender.com', {
  query: {
    userId: 'test-user-123'
  },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Socket connected successfully!');
  console.log('Socket ID:', socket.id);
  console.log('Connected to:', socket.io.uri);
  
  // Listen for online users
  socket.on('getOnlineUsers', (users) => {
    console.log('📱 Online users received:', users);
  });
  
  // Test after 3 seconds
  setTimeout(() => {
    console.log('🔌 Disconnecting...');
    socket.disconnect();
  }, 3000);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
  console.log('Error details:', error);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Connection timeout - exiting');
  process.exit(1);
}, 10000);