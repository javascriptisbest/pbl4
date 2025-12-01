// URL Detection Test - call in browser console
window.testURLDetection = () => {
  console.clear();
  console.log("🧪 Testing URL Detection:");
  console.log("==========================");
  
  // Import URL functions (if available)
  try {
    const hostname = window.location.hostname;
    const href = window.location.href;
    const origin = window.location.origin;
    
    console.log("🌍 Current Environment:", {
      hostname,
      href, 
      origin,
      isLocalhost: hostname === 'localhost',
      is127: hostname === '127.0.0.1',
      isLAN: hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')
    });
    
    // Simulate URL detection logic
    const isLocal = (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.")
    );
    
    const backendURL = isLocal ? "http://localhost:5002" : "https://pbl4-jecm.onrender.com";
    const socketURL = isLocal ? "http://localhost:5002" : "https://pbl4-jecm.onrender.com";
    
    console.log("🎯 Detected URLs:", {
      isLocal,
      backendURL,
      socketURL
    });
    
    // Test if backend is reachable
    fetch(backendURL + '/api/health')
      .then(res => {
        console.log("✅ Backend reachable:", res.status);
        return res.json();
      })
      .then(data => console.log("📊 Backend health:", data))
      .catch(err => console.error("❌ Backend unreachable:", err.message));
      
    return { isLocal, backendURL, socketURL };
    
  } catch (error) {
    console.error("❌ Error testing URL detection:", error);
  }
};

// Auto-run on load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    console.log("🚀 URL Detection Test loaded. Run: testURLDetection()");
  }, 1000);
}

export default window.testURLDetection;