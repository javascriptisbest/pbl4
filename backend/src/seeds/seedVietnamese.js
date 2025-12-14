/**
 * Seed Database Script - Vietnamese Data
 * Tạo dữ liệu mẫu với tên người Việt, tin nhắn tiếng Việt và groups
 * 
 * Cách chạy:
 * cd backend
 * node src/seeds/seedVietnamese.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

// ===== MODELS =====
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  password: { type: String, required: true, minlength: 6 },
  profilePic: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Message schema phải khớp với backend/src/models/message.model.js
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional for group chat
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" }, // For group chat
  messageType: { type: String, enum: ["direct", "group"], default: "direct" },
  text: { type: String },
  image: { type: String },
  video: { type: String },
  audio: { type: String },
  file: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Group schema phải khớp với backend/src/models/group.model.js
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  avatar: { type: String, default: "" },
  members: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      role: { type: String, enum: ["admin", "member"], default: "member" },
      joinedAt: { type: Date, default: Date.now },
    },
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

const friendSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "blocked"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);
const Group = mongoose.model("Group", groupSchema);
const Friend = mongoose.model("Friend", friendSchema);

// ===== DỮ LIỆU MẪU =====

const vietnameseUsers = [
  { email: "nguyenvana@gmail.com", fullName: "Nguyễn Văn An" },
  { email: "tranthib@gmail.com", fullName: "Trần Thị Bình" },
  { email: "levanc@gmail.com", fullName: "Lê Văn Cường" },
  { email: "phamthid@gmail.com", fullName: "Phạm Thị Dung" },
  { email: "hoange@gmail.com", fullName: "Hoàng Văn Em" },
  { email: "vuthif@gmail.com", fullName: "Vũ Thị Phương" },
  { email: "dangvang@gmail.com", fullName: "Đặng Văn Giang" },
  { email: "buithih@gmail.com", fullName: "Bùi Thị Hương" },
  { email: "dovani@gmail.com", fullName: "Đỗ Văn Hùng" },
  { email: "ngothij@gmail.com", fullName: "Ngô Thị Kim" },
  { email: "trinhvank@gmail.com", fullName: "Trịnh Văn Khoa" },
  { email: "lyvanl@gmail.com", fullName: "Lý Văn Long" },
  { email: "maithim@gmail.com", fullName: "Mai Thị Minh" },
  { email: "dinhn@gmail.com", fullName: "Đinh Văn Nam" },
  { email: "lamthio@gmail.com", fullName: "Lâm Thị Oanh" },
  { email: "truongvanp@gmail.com", fullName: "Trương Văn Phúc" },
  { email: "caothiq@gmail.com", fullName: "Cao Thị Quỳnh" },
  { email: "hovanr@gmail.com", fullName: "Hồ Văn Rồng" },
  { email: "sonthis@gmail.com", fullName: "Sơn Thị Sen" },
  { email: "tavan@gmail.com", fullName: "Tạ Văn Tùng" },
];

const sampleConversations = [
  // Cuộc trò chuyện 1: An và Bình
  [
    { from: 0, to: 1, text: "Chào Bình, bạn khỏe không?" },
    { from: 1, to: 0, text: "Chào An! Mình khỏe, cảm ơn bạn. Còn bạn thì sao?" },
    { from: 0, to: 1, text: "Mình cũng ổn. Cuối tuần này có rảnh không?" },
    { from: 1, to: 0, text: "Có chứ! Bạn định đi đâu vậy?" },
    { from: 0, to: 1, text: "Mình định đi cafe, bạn có muốn đi cùng không?" },
    { from: 1, to: 0, text: "Hay quá! Mấy giờ vậy bạn?" },
    { from: 0, to: 1, text: "9 giờ sáng được không? Ở quán Highland nhé" },
    { from: 1, to: 0, text: "Ok bạn, hẹn gặp nhé! 👋" },
  ],
  // Cuộc trò chuyện 2: Cường và Dung  
  [
    { from: 2, to: 3, text: "Dung ơi, bài tập hôm nay làm xong chưa?" },
    { from: 3, to: 2, text: "Xong rồi anh, còn anh thì sao?" },
    { from: 2, to: 3, text: "Anh đang làm dở, có chỗ không hiểu" },
    { from: 3, to: 2, text: "Để em giúp anh nhé, chỗ nào vậy?" },
    { from: 2, to: 3, text: "Bài số 5 đó, khó quá 😅" },
    { from: 3, to: 2, text: "À bài đó dễ mà, anh làm theo công thức này..." },
    { from: 2, to: 3, text: "Cảm ơn em nhiều nha! 🙏" },
  ],
  // Cuộc trò chuyện 3: Em và Phương
  [
    { from: 4, to: 5, text: "Phương ơi, tối nay có muốn đi ăn không?" },
    { from: 5, to: 4, text: "Đi chứ! Ăn gì vậy anh?" },
    { from: 4, to: 5, text: "Lẩu nhé, trời lạnh ăn lẩu là nhất" },
    { from: 5, to: 4, text: "Oke anh, 7 giờ được không?" },
    { from: 4, to: 5, text: "Được, anh qua đón em nha" },
    { from: 5, to: 4, text: "Dạ, em chuẩn bị xong rồi đợi anh ❤️" },
  ],
  // Cuộc trò chuyện 4: Giang và Hương
  [
    { from: 6, to: 7, text: "Hương ơi, dự án đến đâu rồi?" },
    { from: 7, to: 6, text: "Em làm được 70% rồi anh" },
    { from: 6, to: 7, text: "Tốt lắm! Deadline còn 3 ngày nữa thôi" },
    { from: 7, to: 6, text: "Dạ em biết, sẽ cố gắng hoàn thành sớm ạ" },
    { from: 6, to: 7, text: "Nếu cần gì cứ hỏi anh nhé" },
    { from: 7, to: 6, text: "Dạ cảm ơn anh! 💪" },
  ],
  // Cuộc trò chuyện 5: Hùng và Kim
  [
    { from: 8, to: 9, text: "Kim ơi, sáng mai họp lúc mấy giờ vậy?" },
    { from: 9, to: 8, text: "8 giờ anh ơi, ở phòng họp A" },
    { from: 8, to: 9, text: "Ok, cảm ơn em. Chuẩn bị slide chưa?" },
    { from: 9, to: 8, text: "Xong rồi anh, em gửi anh review trước nha" },
    { from: 8, to: 9, text: "Ừ, gửi qua email cho anh nhé" },
    { from: 9, to: 8, text: "Dạ em gửi rồi ạ 📧" },
  ],
  // Thêm vài cuộc chat ngắn
  [
    { from: 10, to: 11, text: "Long ơi, cho mình mượn sách được không?" },
    { from: 11, to: 10, text: "Được chứ, quyển nào vậy?" },
    { from: 10, to: 11, text: "Quyển Clean Code đó" },
    { from: 11, to: 10, text: "Ok, mai mình mang đi cho" },
  ],
  [
    { from: 12, to: 13, text: "Anh Nam ơi, cuối tuần này có tiệc ở nhà anh phải không?" },
    { from: 13, to: 12, text: "Ừ đúng rồi, em đến nhé!" },
    { from: 12, to: 13, text: "Dạ, em mang gì đến ạ?" },
    { from: 13, to: 12, text: "Không cần mang gì đâu, có mặt là vui rồi 😄" },
  ],
  [
    { from: 14, to: 15, text: "Phúc ơi, code review giúp mình với" },
    { from: 15, to: 14, text: "Gửi link PR đi" },
    { from: 14, to: 15, text: "https://github.com/... đây nè" },
    { from: 15, to: 14, text: "Ok, để mình xem" },
    { from: 15, to: 14, text: "LGTM! Merge được rồi 👍" },
  ],
];

const sampleGroups = [
  {
    name: "Lớp CNTT K20",
    description: "Group lớp Công nghệ Thông tin K20",
    memberIndices: [0, 1, 2, 3, 4, 5, 6, 7],
    creatorIndex: 0,
    messages: [
      { senderIndex: 0, text: "Chào mọi người, mình là An - lớp trưởng" },
      { senderIndex: 1, text: "Chào An! Mình là Bình 👋" },
      { senderIndex: 2, text: "Hello cả nhóm!" },
      { senderIndex: 3, text: "Có ai biết deadline bài tập không?" },
      { senderIndex: 0, text: "Deadline là thứ 6 tuần này nhé mọi người" },
      { senderIndex: 4, text: "Cảm ơn lớp trưởng!" },
      { senderIndex: 5, text: "Có ai làm xong chưa, cho mình tham khảo với 😅" },
      { senderIndex: 6, text: "Mình làm được một nửa rồi" },
      { senderIndex: 7, text: "Tối nay mình họp online review bài nhé" },
      { senderIndex: 0, text: "Ok, 8 giờ tối nhé mọi người!" },
    ],
  },
  {
    name: "Team Dự Án ABC",
    description: "Nhóm làm việc dự án ABC",
    memberIndices: [8, 9, 10, 11, 12],
    creatorIndex: 8,
    messages: [
      { senderIndex: 8, text: "Chào team, meeting sáng mai lúc 9h" },
      { senderIndex: 9, text: "Nhận, em sẽ có mặt" },
      { senderIndex: 10, text: "Mình cũng sẽ đến" },
      { senderIndex: 11, text: "Anh ơi, có cần chuẩn bị gì không?" },
      { senderIndex: 8, text: "Mọi người chuẩn bị báo cáo tiến độ nhé" },
      { senderIndex: 12, text: "Ok anh, em chuẩn bị slide luôn" },
      { senderIndex: 8, text: "Tốt lắm! 💪" },
    ],
  },
  {
    name: "Hội Yêu Bếp 🍳",
    description: "Chia sẻ công thức nấu ăn ngon",
    memberIndices: [1, 3, 5, 7, 9, 12, 14, 16],
    creatorIndex: 1,
    messages: [
      { senderIndex: 1, text: "Hôm nay mình nấu phở bò, ngon lắm!" },
      { senderIndex: 3, text: "Chia sẻ công thức đi bạn ơi 🤤" },
      { senderIndex: 5, text: "Mình cũng muốn học nấu phở" },
      { senderIndex: 7, text: "Phở nhà làm bao giờ cũng ngon nhất!" },
      { senderIndex: 1, text: "Bí quyết là nước dùng phải ninh xương lâu nha" },
      { senderIndex: 9, text: "Cảm ơn bạn! Cuối tuần mình thử làm" },
      { senderIndex: 12, text: "Post hình lên xem nào 📸" },
    ],
  },
  {
    name: "Gym & Fitness 💪",
    description: "Cùng nhau tập luyện và chia sẻ kinh nghiệm",
    memberIndices: [0, 2, 4, 6, 8, 10, 13, 15, 17, 19],
    creatorIndex: 2,
    messages: [
      { senderIndex: 2, text: "Sáng mai ai đi gym không?" },
      { senderIndex: 4, text: "Mình đi, 6h sáng nhé" },
      { senderIndex: 6, text: "6h sớm quá, 7h được không?" },
      { senderIndex: 2, text: "Ok 7h cũng được" },
      { senderIndex: 8, text: "Mình cũng muốn tham gia" },
      { senderIndex: 10, text: "Hôm nay tập chân hay tay vậy?" },
      { senderIndex: 2, text: "Tập ngực + vai nhé anh em" },
      { senderIndex: 13, text: "Let's go! 🔥" },
    ],
  },
  {
    name: "Du Lịch Việt Nam 🌴",
    description: "Chia sẻ địa điểm du lịch đẹp",
    memberIndices: [0, 1, 2, 3, 4, 5, 11, 13, 16, 18],
    creatorIndex: 0,
    messages: [
      { senderIndex: 0, text: "Tháng tới ai muốn đi Đà Lạt không?" },
      { senderIndex: 1, text: "Mình muốn đi! Đi mấy ngày vậy?" },
      { senderIndex: 3, text: "Đà Lạt đẹp lắm, mình cũng muốn đi" },
      { senderIndex: 5, text: "3 ngày 2 đêm được không mọi người?" },
      { senderIndex: 0, text: "Ừ, mình book xe và khách sạn nhé" },
      { senderIndex: 11, text: "Nhớ đi cafe Mê Linh nha, view đẹp lắm!" },
      { senderIndex: 13, text: "Với lại thác Datanla nữa 💦" },
      { senderIndex: 16, text: "Mình làm list địa điểm cần đến nha" },
      { senderIndex: 0, text: "Ok, ai có gợi ý gì thì comment vào đây nhé!" },
    ],
  },
];

// ===== MAIN FUNCTION =====

const seedDatabase = async () => {
  try {
    console.log("\n🌱 BẮT ĐẦU SEED DATABASE\n");
    console.log("=" .repeat(50));

    // Kết nối MongoDB
    console.log("\n🔌 Đang kết nối MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Đã kết nối MongoDB\n");

    // Xóa dữ liệu cũ
    console.log("🗑️  Xóa dữ liệu cũ...");
    await User.deleteMany({});
    await Message.deleteMany({});
    await Group.deleteMany({});
    await Friend.deleteMany({});
    console.log("✅ Đã xóa dữ liệu cũ\n");

    // Hash password
    const hashedPassword = await bcrypt.hash("123456", 10);

    // Tạo users
    console.log("👥 Tạo users...");
    const createdUsers = [];
    for (const userData of vietnameseUsers) {
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.fullName}`,
      });
      createdUsers.push(user);
      console.log(`   ✅ ${user.fullName} (${user.email})`);
    }
    console.log(`\n📊 Đã tạo ${createdUsers.length} users\n`);

    // Tạo tin nhắn
    console.log("💬 Tạo tin nhắn...");
    let messageCount = 0;
    const baseTime = new Date();
    baseTime.setDate(baseTime.getDate() - 7); // Bắt đầu từ 7 ngày trước

    for (const conversation of sampleConversations) {
      let msgTime = new Date(baseTime);
      for (const msg of conversation) {
        msgTime = new Date(msgTime.getTime() + Math.random() * 3600000); // Random 0-1 giờ
        await Message.create({
          senderId: createdUsers[msg.from]._id,
          receiverId: createdUsers[msg.to]._id,
          messageType: "direct",
          text: msg.text,
          createdAt: msgTime,
          updatedAt: msgTime,
        });
        messageCount++;
      }
    }
    console.log(`✅ Đã tạo ${messageCount} tin nhắn\n`);

    // Tạo friend relationships từ messages (những người đã có tin nhắn sẽ tự động là bạn bè)
    console.log("👫 Tạo bạn bè từ tin nhắn...");
    const friendPairs = new Set(); // Dùng Set để tránh duplicate
    // Chỉ lấy direct messages (có receiverId)
    const allMessages = await Message.find({ messageType: "direct", receiverId: { $exists: true } }).lean();
    
    for (const msg of allMessages) {
      const senderId = msg.senderId.toString();
      const receiverId = msg.receiverId.toString();
      // Tạo key để đảm bảo unique (luôn sắp xếp ID nhỏ hơn trước)
      const pairKey = senderId < receiverId 
        ? `${senderId}-${receiverId}` 
        : `${receiverId}-${senderId}`;
      
      if (!friendPairs.has(pairKey)) {
        friendPairs.add(pairKey);
        // Tạo friendship với status accepted
        await Friend.create({
          requester: msg.senderId,
          recipient: msg.receiverId,
          status: "accepted",
        });
      }
    }
    console.log(`✅ Đã tạo ${friendPairs.size} friendships từ tin nhắn\n`);

    // ============ NGUYỄN VĂN AN - SUPER USER ============
    // An (index 0) sẽ có TẤT CẢ users khác làm bạn bè
    // và CỰC NHIỀU tin nhắn để test performance
    console.log("🌟 Tạo super user Nguyễn Văn An với nhiều bạn bè và tin nhắn...");
    
    const anUser = createdUsers[0];
    let anFriendsCount = 0;
    let anMessagesCount = 0;
    
    // Tin nhắn mẫu cho An
    const anMessages = [
      "Chào bạn! Mình là An 👋",
      "Hôm nay bạn thế nào?",
      "Cuối tuần này có rảnh không?",
      "Mình vừa xem phim mới, hay lắm!",
      "Bạn đã ăn cơm chưa?",
      "Thời tiết hôm nay đẹp quá",
      "Mình đang học lập trình, khó quá 😅",
      "Có gì vui kể mình nghe đi",
      "Haha, vui ghê 😂",
      "Ok, hẹn gặp lại nhé!",
      "Cảm ơn bạn nhiều",
      "Mình sẽ cố gắng hơn",
      "Dạo này bận quá, ít online",
      "Nhớ giữ gìn sức khỏe nhé",
      "Chúc bạn ngủ ngon 🌙",
      "Sáng rồi, dậy đi bạn ơi ☀️",
      "Có tin gì hot không?",
      "Mình vừa đi cafe về",
      "Ăn gì chưa, đói bụng quá",
      "Weekend rồi, đi chơi thôi!",
    ];
    
    const replyMessages = [
      "Chào An! Mình khỏe, còn bạn?",
      "Mình cũng đang học, khó thiệt",
      "Ok, cuối tuần gặp nhé!",
      "Phim gì vậy, hay không?",
      "Mình vừa ăn xong rồi",
      "Ừ, đẹp quá trời luôn",
      "Cố lên bạn, sẽ làm được thôi 💪",
      "Haha, mình cũng vui lắm",
      "Bye bye, hẹn gặp lại!",
      "Không có chi, bạn hiền ơi",
      "Mình tin bạn mà",
      "Mình cũng vậy, bận muốn xỉu",
      "Bạn cũng vậy nhé",
      "Good night! 🌟",
      "Dậy rồi nè, sáng quá!",
      "Không có gì đặc biệt",
      "Cafe ở đâu vậy?",
      "Đói thì ăn đi 😋",
      "Đi đâu chơi vậy?",
      "Mình cũng muốn đi!",
    ];
    
    // Tạo bạn bè và tin nhắn cho An với TẤT CẢ users khác
    for (let i = 1; i < createdUsers.length; i++) {
      const friend = createdUsers[i];
      const anId = anUser._id.toString();
      const friendId = friend._id.toString();
      const pairKey = anId < friendId ? `${anId}-${friendId}` : `${friendId}-${anId}`;
      
      // Tạo friendship nếu chưa có
      if (!friendPairs.has(pairKey)) {
        friendPairs.add(pairKey);
        await Friend.create({
          requester: anUser._id,
          recipient: friend._id,
          status: "accepted",
        });
        anFriendsCount++;
      }
      
      // Tạo NHIỀU tin nhắn với mỗi bạn bè (30-100 tin nhắn mỗi người)
      const numMessages = 30 + Math.floor(Math.random() * 70); // 30-100 messages
      let msgTime = new Date(baseTime);
      
      for (let j = 0; j < numMessages; j++) {
        msgTime = new Date(msgTime.getTime() + Math.random() * 1800000); // Random 0-30 phút
        
        // Xen kẽ tin nhắn từ An và bạn
        const isAnSending = j % 2 === 0;
        const msgText = isAnSending 
          ? anMessages[j % anMessages.length]
          : replyMessages[j % replyMessages.length];
        
        await Message.create({
          senderId: isAnSending ? anUser._id : friend._id,
          receiverId: isAnSending ? friend._id : anUser._id,
          messageType: "direct",
          text: msgText,
          isRead: j < numMessages - 5, // 5 tin cuối chưa đọc
          createdAt: msgTime,
          updatedAt: msgTime,
        });
        anMessagesCount++;
      }
    }
    
    console.log(`   ✅ Nguyễn Văn An: ${anFriendsCount} bạn bè mới`);
    console.log(`   ✅ Nguyễn Văn An: ${anMessagesCount} tin nhắn`);
    console.log("");

    // Tạo thêm bạn bè ngẫu nhiên cho các users khác
    console.log("👫 Tạo thêm bạn bè ngẫu nhiên cho users khác...");
    let randomFriendsCount = 0;
    const targetFriendsPerUser = 5;
    const maxAttempts = createdUsers.length * targetFriendsPerUser * 2;
    
    for (let attempt = 0; attempt < maxAttempts && randomFriendsCount < createdUsers.length * targetFriendsPerUser; attempt++) {
      const user1Index = Math.floor(Math.random() * createdUsers.length);
      const user2Index = Math.floor(Math.random() * createdUsers.length);
      
      if (user1Index !== user2Index) {
        const user1Id = createdUsers[user1Index]._id.toString();
        const user2Id = createdUsers[user2Index]._id.toString();
        const pairKey = user1Id < user2Id 
          ? `${user1Id}-${user2Id}` 
          : `${user2Id}-${user1Id}`;
        
        if (!friendPairs.has(pairKey)) {
          friendPairs.add(pairKey);
          await Friend.create({
            requester: createdUsers[user1Index]._id,
            recipient: createdUsers[user2Index]._id,
            status: "accepted",
          });
          randomFriendsCount++;
        }
      }
    }
    console.log(`✅ Đã tạo thêm ${randomFriendsCount} friendships ngẫu nhiên\n`);

    // Tạo groups
    console.log("👥 Tạo groups...");
    for (const groupData of sampleGroups) {
      const creator = createdUsers[groupData.creatorIndex];
      
      // Tạo members array với format đúng: [{ userId, role }]
      // Đảm bảo creator có trong members với role admin
      const members = [];
      for (const i of groupData.memberIndices) {
        members.push({
          userId: createdUsers[i]._id,
          role: i === groupData.creatorIndex ? "admin" : "member",
          joinedAt: new Date(),
        });
      }

      // Tạo group bằng new Group() và save() để tránh lỗi validation với nested objects
      const group = new Group({
        name: groupData.name,
        description: groupData.description || "",
        createdBy: creator._id,
        members: members,
        avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(groupData.name)}`,
      });
      
      await group.save();

      console.log(`   ✅ ${group.name} (${members.length} thành viên)`);

      // Tạo tin nhắn trong group (dùng Message model với groupId)
      let groupMsgTime = new Date(baseTime);
      let lastGroupMessage = null;
      for (const msg of groupData.messages) {
        groupMsgTime = new Date(groupMsgTime.getTime() + Math.random() * 1800000);
        const groupMessage = await Message.create({
          groupId: group._id,
          senderId: createdUsers[msg.senderIndex]._id,
          text: msg.text,
          messageType: "group",
          createdAt: groupMsgTime,
          updatedAt: groupMsgTime,
        });
        
        lastGroupMessage = groupMessage;
        // Cập nhật lastMessageAt của group
        group.lastMessageAt = groupMsgTime;
      }
      
      // Set lastMessage reference nếu có tin nhắn
      if (lastGroupMessage) {
        group.lastMessage = lastGroupMessage._id;
      }
      await group.save();
      
      console.log(`   ✅ ${group.name} - ${groupData.messages.length} tin nhắn`);
    }
    console.log(`\n📊 Đã tạo ${sampleGroups.length} groups\n`);

    // Đếm tổng số tin nhắn trong DB
    const totalMessages = await Message.countDocuments({});
    const totalFriendships = await Friend.countDocuments({});
    
    // Tổng kết
    console.log("=" .repeat(50));
    console.log("\n🎉 SEED DATABASE HOÀN TẤT!\n");
    console.log("📋 Thông tin đăng nhập:");
    console.log("   - Email: nguyenvana@gmail.com (hoặc email khác)");
    console.log("   - Mật khẩu: 123456");
    console.log("\n📊 Tổng kết:");
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Messages: ${totalMessages}`);
    console.log(`   - Friendships: ${totalFriendships}`);
    console.log(`   - Groups: ${sampleGroups.length}`);
    console.log("\n🌟 Nguyễn Văn An (Super User):");
    console.log(`   - Bạn bè: ${createdUsers.length - 1} (tất cả users)`);
    console.log(`   - Tin nhắn: ${anMessagesCount}`);
    console.log(`   - Tin chưa đọc: ~${(createdUsers.length - 1) * 5} tin`);
    console.log("\n");

  } catch (error) {
    console.error("\n❌ Lỗi:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedDatabase();
