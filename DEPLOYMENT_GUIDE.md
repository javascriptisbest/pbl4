# 🚀 Deployment Guide - Vercel + Render + Voice Calls

## 📱 Quick Access URLs

### Production (Cloud)
- **Frontend**: https://pbl4-one.vercel.app
- **Backend**: https://pbl4-jecm.onrender.com
- **Voice Calls**: ✅ Fully functional

### Development (Local)
- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:5002
- **Voice Calls**: ✅ Fully functional

---

## ☁️ Cloud Deployment

### Backend (Render)
- **Auto-deploy**: Committed to GitHub → Auto-deployed
- **URL**: https://pbl4-jecm.onrender.com
- **Voice Call Support**: ✅ WebRTC + Socket.IO
- **Environment**: Production-ready

### Frontend (Vercel)
- **Auto-deploy**: Committed to GitHub → Auto-deployed  
- **URL**: https://pbl4-one.vercel.app
- **Voice Call Support**: ✅ Auto-detects backend
- **Environment**: Edge deployment globally

---

## 🧪 Testing Voice Calls

### Option 1: Cloud Testing (Recommended)
```bash
# Just open browsers and test!
https://pbl4-one.vercel.app
```

1. **Browser 1**: Login as User A
2. **Browser 2**: Login as User B (same or different device)
3. **Call each other**: Click phone icon
4. **Global access**: Works from anywhere with internet

### Option 2: Local Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev
```

1. **Access**: http://localhost:5174
2. **Multiple browsers**: Test voice calls locally
3. **Hot reload**: Perfect for development

### Option 3: Hybrid (Local Frontend + Cloud Backend)
```bash
# Frontend only
cd frontend && npm run dev

# Set environment variable
echo "VITE_BACKEND_URL=https://pbl4-jecm.onrender.com" > .env.local
```

1. **Fast development**: Hot reload frontend
2. **Production data**: Use cloud backend
3. **Best of both worlds**: Speed + Real data

---

## 🌐 Environment Auto-Detection

### Smart Backend Selection
```javascript
// Automatic environment detection in HomePage.jsx
const getBackendUrl = () => {
  // Development: localhost:5002
  if (import.meta.env.DEV && localhost) return "http://localhost:5002";
  
  // Production: Render backend  
  if (production || vercel) return "https://pbl4-jecm.onrender.com";
  
  // Network: Auto-detect IP
  if (network) return `http://${hostname}:5002`;
};
```

### Environment Variables
```bash
# .env.local (for development)
VITE_BACKEND_URL=http://localhost:5002

# .env.production (for cloud)  
VITE_BACKEND_URL=https://pbl4-jecm.onrender.com
```

---

## ✅ Voice Call Features

### ✨ What Works
- 📞 **Voice calling** between any users
- 🌍 **Global access** (internet-based)
- 🔄 **Auto-reconnection** if connection drops  
- 📱 **Multi-device** support (phone, laptop, etc.)
- ⚡ **Real-time** WebRTC audio streaming
- 🔒 **Secure** peer-to-peer connections

### 🚀 Cloud Advantages
- **No setup required**: Just open browser
- **Works anywhere**: Home, office, different countries
- **Always available**: 24/7 uptime
- **Auto-scaling**: Handles multiple users
- **Global CDN**: Fast loading worldwide

---

## 🏃‍♂️ Quick Start

### For Users (Testing)
1. Open: https://pbl4-one.vercel.app
2. Register/Login with 2 different accounts
3. Chat with each other
4. Click phone icon to start voice call
5. Enjoy real-time voice chat! 🎉

### For Developers  
1. Clone repository
2. `npm run dev` in both backend and frontend
3. Access http://localhost:5174
4. Code with hot reload
5. Test voice calls locally

Both cloud and local setups support full voice calling functionality! 🚀📞