#!/usr/bin/env node

/**
 * Comprehensive Production Test Suite
 * Tests all aspects of the deployed application
 */

const FRONTEND_URL = 'https://pbl4-one.vercel.app';
const BACKEND_URL = 'https://pbl4-jecm.onrender.com';

async function runComprehensiveTest() {
  console.log('🔍 COMPREHENSIVE PRODUCTION TEST');
  console.log('================================');
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend: ${BACKEND_URL}\n`);

  const results = {
    cors: { passed: 0, total: 0 },
    api: { passed: 0, total: 0 },
    auth: { passed: 0, total: 0 },
    websocket: { passed: 0, total: 0 }
  };

  // 1. Test CORS Headers
  console.log('📡 Testing CORS Configuration...');
  await testCORS(results);

  // 2. Test API Endpoints
  console.log('\n🌐 Testing API Endpoints...');
  await testAPIEndpoints(results);

  // 3. Test Authentication Flow
  console.log('\n🔐 Testing Authentication...');
  await testAuthentication(results);

  // 4. Test WebSocket
  console.log('\n🔌 Testing WebSocket Connection...');
  await testWebSocket(results);

  // Final Report
  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL RESULTS:');
  console.log('='.repeat(50));
  
  for (const [category, stats] of Object.entries(results)) {
    const percentage = stats.total > 0 ? (stats.passed / stats.total * 100).toFixed(1) : 0;
    const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
    console.log(`${status} ${category.toUpperCase()}: ${stats.passed}/${stats.total} (${percentage}%)`);
  }

  const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
  const totalTests = Object.values(results).reduce((sum, r) => sum + r.total, 0);
  const overallPercentage = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : 0;
  
  console.log(`\n🎯 OVERALL: ${totalPassed}/${totalTests} (${overallPercentage}%)`);
  
  if (overallPercentage >= 90) {
    console.log('🚀 Production ready!');
  } else if (overallPercentage >= 70) {
    console.log('⚠️ Some issues need attention');
  } else {
    console.log('❌ Major issues found - needs fixing');
  }
}

async function testCORS(results) {
  const tests = [
    { name: 'Health endpoint CORS', url: `${BACKEND_URL}/api/health` },
    { name: 'Auth endpoint CORS', url: `${BACKEND_URL}/api/auth/check` },
    { name: 'Messages endpoint CORS', url: `${BACKEND_URL}/api/messages/users` }
  ];

  for (const test of tests) {
    results.cors.total++;
    try {
      const response = await fetch(test.url, {
        method: 'OPTIONS',
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      const allowOrigin = response.headers.get('access-control-allow-origin');
      const allowCredentials = response.headers.get('access-control-allow-credentials');
      
      if (allowOrigin && allowCredentials === 'true') {
        console.log(`   ✅ ${test.name}`);
        results.cors.passed++;
      } else {
        console.log(`   ❌ ${test.name} - Missing CORS headers`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name} - ${error.message}`);
    }
  }
}

async function testAPIEndpoints(results) {
  const tests = [
    { name: 'Health Check', url: `${BACKEND_URL}/api/health`, expectStatus: 200 },
    { name: 'Auth Check (no token)', url: `${BACKEND_URL}/api/auth/check`, expectStatus: 401 },
    { name: 'Get Users (no token)', url: `${BACKEND_URL}/api/messages/users`, expectStatus: 401 },
    { name: 'Get Groups (no token)', url: `${BACKEND_URL}/api/groups`, expectStatus: 401 }
  ];

  for (const test of tests) {
    results.api.total++;
    try {
      const response = await fetch(test.url, {
        headers: { 'Origin': FRONTEND_URL },
        credentials: 'include'
      });

      if (response.status === test.expectStatus) {
        console.log(`   ✅ ${test.name} (${response.status})`);
        results.api.passed++;
      } else {
        console.log(`   ❌ ${test.name} - Expected ${test.expectStatus}, got ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name} - ${error.message}`);
    }
  }
}

async function testAuthentication(results) {
  const testEmail = `test_${Date.now()}@example.com`;
  let authCookie = null;

  // Test Signup
  results.auth.total++;
  try {
    const signupResponse = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      },
      credentials: 'include',
      body: JSON.stringify({
        fullName: 'Test User',
        email: testEmail,
        password: 'password123'
      })
    });

    if (signupResponse.status === 201) {
      const cookies = signupResponse.headers.get('set-cookie');
      authCookie = cookies;
      console.log(`   ✅ Signup successful`);
      results.auth.passed++;
    } else {
      console.log(`   ❌ Signup failed (${signupResponse.status})`);
    }
  } catch (error) {
    console.log(`   ❌ Signup error - ${error.message}`);
  }

  // Test Auth Check with token
  if (authCookie) {
    results.auth.total++;
    try {
      const authResponse = await fetch(`${BACKEND_URL}/api/auth/check`, {
        headers: {
          'Origin': FRONTEND_URL,
          'Cookie': authCookie
        },
        credentials: 'include'
      });

      if (authResponse.status === 200) {
        console.log(`   ✅ Auth check with token`);
        results.auth.passed++;
      } else {
        console.log(`   ❌ Auth check failed (${authResponse.status})`);
      }
    } catch (error) {
      console.log(`   ❌ Auth check error - ${error.message}`);
    }
  }

  // Test Protected Route Access
  if (authCookie) {
    results.auth.total++;
    try {
      const usersResponse = await fetch(`${BACKEND_URL}/api/messages/users`, {
        headers: {
          'Origin': FRONTEND_URL,
          'Cookie': authCookie
        },
        credentials: 'include'
      });

      if (usersResponse.status === 200) {
        console.log(`   ✅ Protected route access`);
        results.auth.passed++;
      } else {
        console.log(`   ❌ Protected route failed (${usersResponse.status})`);
      }
    } catch (error) {
      console.log(`   ❌ Protected route error - ${error.message}`);
    }
  }
}

async function testWebSocket(results) {
  return new Promise((resolve) => {
    results.websocket.total++;

    try {
      // Use socket.io-client if available, otherwise skip
      import('socket.io-client').then(({ io }) => {
        const socket = io(BACKEND_URL, {
          withCredentials: true,
          timeout: 5000
        });

        socket.on('connect', () => {
          console.log(`   ✅ WebSocket connection established`);
          results.websocket.passed++;
          socket.disconnect();
          resolve();
        });

        socket.on('connect_error', (error) => {
          console.log(`   ❌ WebSocket connection failed - ${error.message}`);
          resolve();
        });

        setTimeout(() => {
          console.log(`   ❌ WebSocket connection timeout`);
          socket.disconnect();
          resolve();
        }, 5000);

      }).catch(() => {
        console.log(`   ⚠️ WebSocket test skipped (socket.io-client not available)`);
        resolve();
      });

    } catch (error) {
      console.log(`   ❌ WebSocket test error - ${error.message}`);
      resolve();
    }
  });
}

runComprehensiveTest().catch(console.error);