# Chat App Deployment Guide

## 🚀 Production URLs
- **Frontend**: https://pbl4-one.vercel.app
- **Backend**: https://pbl4-jecm.onrender.com

## 📋 Deployment Status
✅ **Frontend**: Deployed on Vercel
- Main domain: `pbl4-one.vercel.app`
- Git branch: `pbl4-git-master-minhs-projects-0e5f2d90.vercel.app`
- Preview: `pbl4-8oarlfzrf-minhs-projects-0e5f2d90.vercel.app`

✅ **Backend**: Deployed on Render
- API endpoint: `https://pbl4-jecm.onrender.com`

## 📋 Deployment Steps

### 1. Backend (Render)
✅ **Already deployed at**: https://pbl4-jecm.onrender.com

**Build Settings on Render:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: `18.x` or higher
- **Auto-Deploy**: ✅ Enabled

**Environment Variables needed on Render:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_super_secret_jwt_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://pbl4-one.vercel.app
VERCEL_DOMAIN=pbl4-one.vercel.app
VERCEL_GIT_DOMAIN=pbl4-git-master-minhs-projects-0e5f2d90.vercel.app
VERCEL_PREVIEW_DOMAIN=pbl4-8oarlfzrf-minhs-projects-0e5f2d90.vercel.app
```

**Required for backend:**
- MongoDB Atlas connection string
- Cloudinary account (for image/video upload)
- Strong JWT secret (min 32 characters)

### 2. Frontend (Vercel)

**Build Settings on Vercel:**
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build` 
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node Version**: `18.x`

**Option A: Deploy via Vercel CLI**
```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

**Option B: Deploy via GitHub**
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import GitHub repository
4. Configure environment variables
5. Deploy

**Environment Variables on Vercel:**
```
VITE_BACKEND_URL=https://pbl4-jecm.onrender.com/api
VITE_SOCKET_URL=https://pbl4-jecm.onrender.com
VERCEL_DOMAIN=pbl4-one.vercel.app
VERCEL_GIT_DOMAIN=pbl4-git-master-minhs-projects-0e5f2d90.vercel.app
VERCEL_PREVIEW_DOMAIN=pbl4-8oarlfzrf-minhs-projects-0e5f2d90.vercel.app
```

**Root Directory:** Set to `frontend` if deploying from monorepo

## 🔧 Local Development

**Prerequisites:**
- Node.js 18.x or higher
- npm or yarn package manager
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account

**Backend:**
```bash
cd backend
npm install
cp .env.example .env  # Create and configure .env file
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Required .env files:**

**Backend (.env):**
```
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_local_jwt_secret_32_chars_min
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
PORT=5002
```

**Frontend (.env):**
```
VITE_BACKEND_URL=http://localhost:5002/api
VITE_SOCKET_URL=http://localhost:5002
```

## 📝 Notes

- Frontend automatically connects to production backend
- CORS configured for Vercel domains
- WebSocket connections work with HTTPS
- Environment variables are pre-configured

## 🧪 Testing

After deployment, test:
- ✅ User registration/login
- ✅ Real-time messaging
- ✅ Image/video upload
- ✅ Group chat functionality

## 🛠️ Troubleshooting

**Common Issues:**

### 1. Build Failures
**Render Backend:**
```bash
# Check logs in Render dashboard
# Common fixes:
- Ensure Node.js version >= 18.x
- Check package.json "start" script exists
- Verify all environment variables are set
```

**Vercel Frontend:**
```bash
# Common fixes:
- Set correct build command: npm run build
- Set output directory: dist
- Check Vite environment variables (VITE_ prefix)
- Ensure frontend folder is set as root directory
```

### 2. Runtime Errors
**CORS errors:**
- Check domain in backend CORS config
- Verify frontend URL matches CORS allowedOrigins

**WebSocket connection fails:**
- Ensure HTTPS is used for production
- Check VITE_SOCKET_URL points to backend

**Database connection:**
- Verify MongoDB URI format and credentials
- Check IP whitelist in MongoDB Atlas

**File upload fails:**
- Check Cloudinary credentials and quotas
- Verify API keys are correctly set

### 3. Environment Variables Missing
**Backend required:**
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Authentication (min 32 chars)
- `CLOUDINARY_*` - File upload service
- `NODE_ENV` - Set to "production"
- `PORT` - Server port (default: 10000 on Render)

**Frontend required:**
- `VITE_BACKEND_URL` - API endpoint
- `VITE_SOCKET_URL` - WebSocket endpoint

### 4. Performance Issues
**Render Free Tier:**
- Server sleeps after 15 mins of inactivity
- First request may take 30+ seconds
- Consider upgrading for production use

**Vercel Free Tier:**
- 100GB bandwidth/month
- Fast global CDN
- No cold starts for static sites

## 📦 Dependencies & Services

**Required External Services:**
1. **MongoDB Atlas** (Database)
   - Free tier: 512MB storage
   - Required for user data and messages

2. **Cloudinary** (Media Storage)
   - Free tier: 25 credits/month
   - Required for image/video uploads

3. **Render** (Backend Hosting)
   - Free tier: 750 hours/month
   - Automatic SSL certificates

4. **Vercel** (Frontend Hosting)
   - Free tier: Unlimited static sites
   - Global CDN and automatic deployments