# Voice Call Test Instructions

## Prerequisites

1. Backend running on port 5002
2. Frontend running on port 5174
3. Two users logged in (use different browsers/incognito)

## Test Steps

### Step 1: Start Backend

```powershell
cd e:\essential\fullstack-chat-app-master\backend
npm run dev
```

### Step 2: Start Frontend

```powershell
cd e:\essential\fullstack-chat-app-master\frontend
npm run dev
```

### Step 3: Open Two Browser Windows

1. Open Chrome normal window: http://localhost:5174
2. Open Chrome incognito window: http://localhost:5174

### Step 4: Login with Different Users

Use seed users from `backend/src/seeds/user.seed.js`:

- User 1: Check seed file for email/password
- User 2: Check seed file for email/password

### Step 5: Test Voice Call

1. In Browser 1: Select User 2 from sidebar
2. In Browser 1: Click the Phone icon in ChatHeader
3. In Browser 2: Accept the incoming call modal
4. Test: mute, unmute, end call

## What Should Happen

1. ✅ Phone button appears in ChatHeader (only when user is online)
2. ✅ Clicking phone button shows "Calling..." toast
3. ✅ Outgoing call modal opens in Browser 1
4. ✅ Incoming call modal opens in Browser 2
5. ✅ Audio connection established after accepting
6. ✅ Call controls work (mute, end)

## Troubleshooting

- Check browser DevTools Console for errors
- Check Network tab for Socket.IO connections
- Ensure microphone permissions are granted
- Verify both users are online (green status)
