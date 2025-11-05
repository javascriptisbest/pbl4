#!/usr/bin/env node

/**
 * Performance Test Suite
 * Đo thời gian loading của các endpoints quan trọng
 */

const FRONTEND_URL = "https://pbl4-one.vercel.app";
const BACKEND_URL = "https://pbl4-jecm.onrender.com";

async function testPerformance() {
  console.log("🚀 PERFORMANCE TEST SUITE");
  console.log("=========================\n");

  const tests = [
    { name: "Health Check", url: `${BACKEND_URL}/api/health`, expected: 200 },
    {
      name: "Auth Check (cold)",
      url: `${BACKEND_URL}/api/auth/check`,
      expected: 401,
    },
    {
      name: "Users List (no auth)",
      url: `${BACKEND_URL}/api/messages/users`,
      expected: 401,
    },
    {
      name: "Groups List (no auth)",
      url: `${BACKEND_URL}/api/groups`,
      expected: 401,
    },
  ];

  console.log("⏱️  Testing API Response Times:");
  console.log("--------------------------------");

  const results = [];

  for (const test of tests) {
    const times = [];

    // Chạy 3 lần để lấy average
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();

      try {
        const response = await fetch(test.url, {
          headers: { Origin: FRONTEND_URL },
          credentials: "include",
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        times.push(responseTime);

        if (response.status === test.expected) {
          process.stdout.write(`✅`);
        } else {
          process.stdout.write(`❌`);
        }
      } catch (error) {
        process.stdout.write(`❌`);
        times.push(10000); // 10s penalty for timeout
      }
    }

    const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    let status = "🟢"; // Fast
    if (avgTime > 2000) status = "🔴"; // Slow
    else if (avgTime > 1000) status = "🟡"; // Medium

    console.log(
      ` ${status} ${test.name}: ${avgTime}ms (${minTime}-${maxTime}ms)`
    );

    results.push({
      name: test.name,
      avgTime,
      minTime,
      maxTime,
      status: status === "🟢" ? "GOOD" : status === "🟡" ? "OK" : "SLOW",
    });
  }

  // Test Frontend Loading
  console.log("\n📱 Testing Frontend Loading:");
  console.log("-----------------------------");

  await testFrontendLoad();

  // Summary
  console.log("\n📊 PERFORMANCE SUMMARY:");
  console.log("========================");

  const fastCount = results.filter((r) => r.status === "GOOD").length;
  const slowCount = results.filter((r) => r.status === "SLOW").length;

  console.log(`🟢 Fast responses: ${fastCount}/${results.length}`);
  console.log(`🔴 Slow responses: ${slowCount}/${results.length}`);

  if (slowCount === 0) {
    console.log("🎉 All APIs performing well!");
  } else if (slowCount <= 1) {
    console.log("⚠️  Some performance issues detected");
  } else {
    console.log("❌ Multiple performance issues - needs optimization");
  }

  // Recommendations
  console.log("\n💡 OPTIMIZATION RECOMMENDATIONS:");
  console.log("=================================");

  const slowApis = results.filter((r) => r.status === "SLOW");
  if (slowApis.length > 0) {
    console.log("🔴 Slow APIs detected:");
    slowApis.forEach((api) => {
      console.log(`   - ${api.name}: ${api.avgTime}ms`);
    });
    console.log("\n   Suggestions:");
    console.log("   • Add caching on backend");
    console.log("   • Reduce payload size");
    console.log("   • Database query optimization");
    console.log("   • CDN for static assets");
  }

  const mediumApis = results.filter((r) => r.status === "OK");
  if (mediumApis.length > 0) {
    console.log("\n🟡 Medium speed APIs:");
    mediumApis.forEach((api) => {
      console.log(`   - ${api.name}: ${api.avgTime}ms`);
    });
    console.log("\n   Suggestions:");
    console.log("   • Frontend caching implemented ✅");
    console.log("   • Consider request batching");
    console.log("   • Optimize data serialization");
  }
}

async function testFrontendLoad() {
  const startTime = Date.now();

  try {
    const response = await fetch(FRONTEND_URL);
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    let status = "🟢"; // Fast
    if (loadTime > 3000) status = "🔴"; // Slow
    else if (loadTime > 1500) status = "🟡"; // Medium

    console.log(`${status} Frontend HTML: ${loadTime}ms`);

    if (loadTime > 3000) {
      console.log("   💡 Consider:");
      console.log("   • Static asset optimization");
      console.log("   • Code splitting");
      console.log("   • Preloading critical resources");
    }
  } catch (error) {
    console.log("❌ Frontend load failed:", error.message);
  }
}

testPerformance().catch(console.error);
