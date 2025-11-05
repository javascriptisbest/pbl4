#!/usr/bin/env node

/**
 * Test login flow and cookie handling
 */

async function testLogin() {
  console.log('🔐 Testing login flow...\n');

  try {
    // Test signup
    console.log('1️⃣ Testing signup...');
    const signupResponse = await fetch('https://pbl4-jecm.onrender.com/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://pbl4-one.vercel.app'
      },
      credentials: 'include',
      body: JSON.stringify({
        fullName: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123'
      })
    });

    console.log(`   Signup Status: ${signupResponse.status}`);
    console.log(`   Set-Cookie Headers: ${signupResponse.headers.get('set-cookie')}`);
    
    if (signupResponse.ok) {
      const signupData = await signupResponse.json();
      console.log(`   ✅ Signup successful for: ${signupData.fullName}`);
      
      // Extract cookies for next request
      const cookies = signupResponse.headers.get('set-cookie');
      
      console.log('\n2️⃣ Testing auth check with cookies...');
      const authResponse = await fetch('https://pbl4-jecm.onrender.com/api/auth/check', {
        method: 'GET',
        headers: {
          'Origin': 'https://pbl4-one.vercel.app',
          'Cookie': cookies || ''
        },
        credentials: 'include'
      });
      
      console.log(`   Auth Check Status: ${authResponse.status}`);
      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log(`   ✅ Auth check successful for: ${authData.fullName}`);
      } else {
        console.log(`   ❌ Auth check failed`);
      }
      
    } else {
      const error = await signupResponse.text();
      console.log(`   ❌ Signup failed: ${error}`);
    }

  } catch (error) {
    console.log(`❌ Test error: ${error.message}`);
  }
}

testLogin();