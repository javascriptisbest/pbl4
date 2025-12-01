# Voice Call Testing Guide

## Setup for Multi-Environment Testing

### 🏠 Local Development

#### 1. Start Backend Server
```bash
cd backend
npm run dev
```
Backend running on: http://0.0.0.0:5002

#### 2. Start Frontend Server
```bash
cd frontend  
npm run dev
```
Frontend running on: http://0.0.0.0:5174

### ☁️ Cloud Deployment (Vercel + Render)

#### Backend on Render:
- Auto-deployed from GitHub
- URL: `https://pbl4-jecm.onrender.com`
- Port: Auto-assigned by Render

#### Frontend on Vercel:
- Auto-deployed from GitHub
- URL: `https://pbl4-one.vercel.app`
- Auto-detects backend URL

### 🔧 Environment Variables

Create `.env` file in frontend:
```bash
# For local development
VITE_BACKEND_URL=http://localhost:5002

# For Vercel production
# VITE_BACKEND_URL=https://pbl4-jecm.onrender.com
```

### 3. Find Your Network IP
```bash
# Run this to get your network IPs
node get-network-ip.js
```

**Example Output:**
```
📡 Wi-Fi: 192.168.1.100
   Frontend: http://192.168.1.100:5174
   Backend:  http://192.168.1.100:5002
```

### 🧪 Voice Call Testing Options

#### Option A: Local Development (Same Machine)
1. Open Chrome: http://localhost:5174 → Login as User A
2. Open Firefox: http://localhost:5174 → Login as User B  
3. Test voice calls between browsers

#### Option B: Local Network (Different Machines)
1. **Server Machine**: Run backend + frontend
2. **Client Machine**: Access via network IP
   - Find server IP: `node get-network-ip.js`
   - Access: `http://[SERVER_IP]:5174`
3. Test voice calls between different machines

#### Option C: Cloud Deployment (Internet)
1. **Vercel Frontend**: https://pbl4-one.vercel.app
2. **Render Backend**: https://pbl4-jecm.onrender.com
3. **Access from anywhere**: Any device with internet
4. **Test globally**: Friends/colleagues can test with you

#### Option D: Hybrid (Local + Cloud)
1. **Local development**: `npm run dev` 
2. **Connect to cloud backend**: Set VITE_BACKEND_URL
3. **Best of both worlds**: Fast development + production data

### ✨ Features Available
- ✅ Voice call initiation
- ✅ Incoming call notifications  
- ✅ Accept/Reject calls
- ✅ Real-time audio streaming
- ✅ Call end functionality
- ✅ Multiple frontend instances support
- ✅ Same machine testing
- ✅ Network testing between different machines
- ✅ **Cloud deployment (Vercel + Render)**
- ✅ **Auto-environment detection**
- ✅ **Global internet access**
- ✅ **Hybrid local/cloud testing**

### 5. Backend Features
- ✅ Multiple sessions per user
- ✅ Session-based socket management  
- ✅ WebRTC signaling server
- ✅ ICE candidate exchange
- ✅ Call state management

### 6. Troubleshooting
- **Microphone permission**: Allow microphone access when prompted
- **Connection issues**: Check browser console for WebSocket errors
- **Audio issues**: Test microphone in browser settings
- **Socket errors**: Restart backend server if needed

### 7. Network Setup for Multiple Machines

#### Find Your Server IP:
**Windows:**
```cmd
ipconfig
```
**Mac/Linux:**
```bash
ifconfig
```

#### Access from Other Machines:
- **Backend**: `http://[SERVER_IP]:5002`
- **Frontend**: `http://[SERVER_IP]:5174`
- **Example**: `http://192.168.1.100:5174`

#### Network Requirements:
- ✅ Same WiFi/LAN network
- ✅ Firewall allows ports 5002, 5174
- ✅ Router allows local network access
- ✅ Both machines can ping each other

### 8. Technical Details
- **Backend Port**: 5002
- **Frontend Port**: 5174  
- **Socket.IO**: Auto-detects network/localhost
- **WebRTC**: Peer-to-peer audio streaming
- **STUN Servers**: Google STUN for NAT traversal
- **Network Support**: LAN, WiFi, Same network