# 🚀 TalkSpace - Realtime Chat Application

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18+-blue.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-v4+-black.svg)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4+-orange.svg)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v5+-green.svg)](https://mongodb.com/)

Modern, responsive realtime chat application built with React, Express.js, Socket.IO, and MongoDB. Features include real-time messaging, group chats, voice calling, file sharing, and more.

## ✨ Features

### 🔐 **Authentication & Security**
- JWT-based secure authentication
- Password encryption with bcrypt
- Session management
- Protected routes

### 💬 **Real-time Messaging**
- Instant messaging with Socket.IO
- Online/offline status indicators
- Typing indicators
- Message reactions
- Message deletion and editing

### 👥 **Group Chat**
- Create and manage groups
- Add/remove members
- Group avatars and settings
- Real-time group messaging

### 📞 **Voice Calling**
- WebRTC-based voice calls
- Call notifications
- Call controls (answer, reject, end)
- Audio management

### 📁 **File Sharing**
- Image uploads and sharing
- Video file support
- File preview and download
- Cloudinary integration

### 🎨 **User Interface**
- Clean, modern design
- Dark/light theme support
- Responsive design for all devices
- Smooth animations and transitions
- Mobile-optimized

### ⚡ **Performance**
- Optimized bundle sizes
- Lazy loading
- Efficient state management
- Cache strategies

## 🛠️ Tech Stack

### **Frontend**
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library for Tailwind
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **Lucide React** - Beautiful icon library

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Cloudinary** - Media management
- **Multer** - File upload handling

### **Development & Deployment**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vercel** - Frontend deployment
- **Render** - Backend deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Cloudinary account (for file uploads)

### 1. Clone Repository
```bash
git clone https://github.com/javascriptisbest/pbl4.git
cd pbl4
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
# CLOUDINARY_CLOUD_NAME=your_cloudinary_name
# CLOUDINARY_API_KEY=your_cloudinary_key
# CLOUDINARY_API_SECRET=your_cloudinary_secret

npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:5002

## 📁 Project Structure

```
pbl4/
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── lib/            # Utilities and configs
│   │   └── index.js        # Server entry point
│   └── package.json
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   ├── lib/           # Utilities and configs
│   │   ├── constants/     # App constants
│   │   └── main.jsx       # App entry point
│   ├── public/            # Static assets
│   ├── dist/              # Production build
│   └── package.json
│
├── .gitignore
├── LICENSE
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5002
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Frontend
The frontend automatically detects the environment and configures URLs accordingly:
- **Development**: `http://localhost:5002`
- **Production**: `https://your-backend-url.com`

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy automatically on push

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables
5. Deploy automatically on push

### Manual Deployment
```bash
# Build frontend
cd frontend
npm run build

# The dist/ folder contains production files
# Upload dist/ contents to your hosting provider

# Deploy backend
cd ../backend
npm install --production
npm start
```

## 📊 Performance Features

- **Optimized Bundles**: Code splitting and tree shaking
- **Efficient State**: Zustand for minimal re-renders
- **Smart Caching**: User and message caching strategies
- **Lazy Loading**: Components and routes loaded on demand
- **WebSocket Optimization**: Efficient real-time communication

## 🎯 Key Features Implementation

### Real-time Messaging
- Socket.IO for instant message delivery
- Online status tracking
- Message persistence in MongoDB
- Optimistic UI updates

### Group Chat System
- Dynamic group creation and management
- Member addition/removal
- Group-specific message channels
- Permission-based actions

### Voice Calling
- WebRTC peer-to-peer connections
- Socket.IO signaling server
- Call state management
- Audio stream handling

### File Upload System
- Drag-and-drop interface
- Multiple file type support
- Progress indicators
- Cloud storage integration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Socket.IO](https://socket.io/) for real-time communication
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for beautiful icons
- [MongoDB](https://mongodb.com/) for database
- [Cloudinary](https://cloudinary.com/) for media management

## 📞 Support

For support, email your-email@example.com or join our [Discord server](https://discord.gg/your-server).

---

**Made with ❤️ by [Your Name](https://github.com/javascriptisbest)**