#!/usr/bin/env node

/**
 * Test Send Message API - LOCAL
 * Debug lỗi 500 khi gửi tin nhắn local
 */

const BACKEND_URL = 'http://localhost:5002';

async function testSendMessageLocal() {
  console.log('🧪 Testing Send Message API (LOCAL)');
  console.log('===================================\n');

  try {
    // 1. Create test user
    console.log('1️⃣ Creating test user...');
    const testEmail = `test_${Date.now()}@example.com`;
    
    const signupResponse = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fullName: 'Test Sender Local',
        email: testEmail,
        password: 'test123'
      })
    });

    if (!signupResponse.ok) {
      throw new Error(`Signup failed: ${signupResponse.status} - ${await signupResponse.text()}`);
    }

    const senderUser = await signupResponse.json();
    const cookies = signupResponse.headers.get('set-cookie');
    
    console.log(`✅ Created sender: ${senderUser.fullName} (${senderUser._id})`);

    // 2. Create receiver user  
    console.log('\n2️⃣ Creating receiver user...');
    const receiverEmail = `receiver_${Date.now()}@example.com`;
    
    const receiverSignupResponse = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fullName: 'Test Receiver Local',
        email: receiverEmail,
        password: 'test123'
      })
    });

    if (!receiverSignupResponse.ok) {
      throw new Error(`Receiver signup failed: ${receiverSignupResponse.status}`);
    }

    const receiverUser = await receiverSignupResponse.json();
    console.log(`✅ Created receiver: ${receiverUser.fullName} (${receiverUser._id})`);

    // 3. Test send message
    console.log('\n3️⃣ Testing send message...');
    
    const messageData = {
      text: 'Hello! This is a LOCAL test message.',
    };

    console.log('Request details:', {
      url: `${BACKEND_URL}/api/messages/send/${receiverUser._id}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies?.split(';')[0] // Just the jwt part
      },
      body: messageData
    });

    const sendResponse = await fetch(`${BACKEND_URL}/api/messages/send/${receiverUser._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      credentials: 'include',
      body: JSON.stringify(messageData)
    });

    console.log('\nResponse status:', sendResponse.status);
    
    const responseText = await sendResponse.text();
    console.log('Response body:', responseText);

    if (sendResponse.ok) {
      console.log('\n✅ Message sent successfully!');
      const message = JSON.parse(responseText);
      console.log('Message details:', {
        id: message._id,
        text: message.text,
        senderId: message.senderId,
        receiverId: message.receiverId,
        createdAt: message.createdAt
      });
    } else {
      console.log('\n❌ Message send failed!');
      console.log('Error details:', responseText);
    }

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  }
}

testSendMessageLocal().catch(console.error);