#!/usr/bin/env node

/**
 * Simple Real-time Test
 * Test if new messages appear without refresh
 */

import { io } from 'socket.io-client';

const BACKEND_URL = 'https://pbl4-jecm.onrender.com';

async function testSimpleMessage() {
  console.log('🔄 Testing Real-time Message Reception');
  console.log('======================================');

  const socket = io(BACKEND_URL, {
    withCredentials: true,
    query: { userId: 'test-user-123' },
    timeout: 10000
  });

  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket server');
    console.log('Socket ID:', socket.id);
    
    // Listen for new messages
    socket.on('newMessage', (message) => {
      console.log('📨 Received new message:', message);
    });

    socket.on('getOnlineUsers', (users) => {
      console.log('👥 Online users updated:', users);
    });

    console.log('\n🎯 Socket is now listening for newMessage events...');
    console.log('💡 Go to your app and send a message to see if it appears here.');
    
    // Keep connection alive
    setTimeout(() => {
      console.log('\n⏰ Test completed. Disconnecting...');
      socket.disconnect();
    }, 30000);
  });

  socket.on('connect_error', (error) => {
    console.log('❌ Connection failed:', error.message);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Disconnected from server');
  });
}

testSimpleMessage().catch(console.error);