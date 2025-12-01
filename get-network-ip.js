const os = require('os');

function getNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Skip internal (127.x.x.x) and non-IPv4 addresses
      if (!net.internal && net.family === 'IPv4') {
        ips.push({
          interface: name,
          ip: net.address
        });
      }
    }
  }
  
  return ips;
}

console.log('🌐 Available Network IPs:');
const networkIPs = getNetworkIPs();

if (networkIPs.length === 0) {
  console.log('❌ No network interfaces found');
} else {
  networkIPs.forEach(({ interface, ip }) => {
    console.log(`📡 ${interface}: ${ip}`);
    console.log(`   Frontend: http://${ip}:5174`);
    console.log(`   Backend:  http://${ip}:5002`);
    console.log('');
  });
}

console.log('💡 Share these URLs with other machines on your network!');
console.log('📱 Make sure both machines are on the same WiFi/LAN network');
console.log('🔥 Don\'t forget to allow ports 5002 and 5174 in firewall if needed');