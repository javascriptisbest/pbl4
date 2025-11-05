#!/usr/bin/env node

/**
 * Quick API connectivity test
 * Tests CORS and basic API endpoints
 */

import fetch from "node-fetch";

const API_BASE = "https://pbl4-jecm.onrender.com/api";
const FRONTEND_ORIGIN = "https://pbl4-one.vercel.app";

async function testAPI() {
  console.log("🧪 Testing API connectivity...\n");

  // Test 1: Health check
  try {
    console.log("1️⃣ Testing health endpoint...");
    const response = await fetch(`${API_BASE}/health`, {
      method: "GET",
      headers: {
        Origin: FRONTEND_ORIGIN,
        "User-Agent": "API-Test-Script",
      },
    });

    console.log(`   Status: ${response.status}`);
    console.log(
      `   CORS Headers: ${response.headers.get("access-control-allow-origin")}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Health check OK - uptime: ${data.uptime}s`);
    } else {
      console.log(`   ❌ Health check failed`);
    }
  } catch (error) {
    console.log(`   ❌ Health check error: ${error.message}`);
  }

  console.log("");

  // Test 2: Auth check (expect 401 without auth)
  try {
    console.log("2️⃣ Testing auth/check endpoint...");
    const response = await fetch(`${API_BASE}/auth/check`, {
      method: "GET",
      headers: {
        Origin: FRONTEND_ORIGIN,
        "User-Agent": "API-Test-Script",
      },
    });

    console.log(`   Status: ${response.status}`);
    console.log(
      `   CORS Headers: ${response.headers.get("access-control-allow-origin")}`
    );

    if (response.status === 401) {
      console.log(`   ✅ Expected 401 (not authenticated)`);
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Auth check error: ${error.message}`);
  }

  console.log("");

  // Test 3: CORS preflight
  try {
    console.log("3️⃣ Testing CORS preflight...");
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "OPTIONS",
      headers: {
        Origin: FRONTEND_ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });

    console.log(`   Status: ${response.status}`);
    console.log(
      `   Allow Origin: ${response.headers.get("access-control-allow-origin")}`
    );
    console.log(
      `   Allow Methods: ${response.headers.get(
        "access-control-allow-methods"
      )}`
    );
    console.log(
      `   Allow Credentials: ${response.headers.get(
        "access-control-allow-credentials"
      )}`
    );

    if (response.status === 200 || response.status === 204) {
      console.log(`   ✅ CORS preflight OK`);
    } else {
      console.log(`   ❌ CORS preflight failed`);
    }
  } catch (error) {
    console.log(`   ❌ CORS preflight error: ${error.message}`);
  }

  console.log("\n🏁 Test complete!");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPI().catch(console.error);
}

export { testAPI };
