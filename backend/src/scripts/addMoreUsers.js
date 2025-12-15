/**
 * Script thêm thêm users vào database (không xóa dữ liệu cũ)
 * 
 * Cách chạy:
 * cd backend
 * node src/scripts/addMoreUsers.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { connectDB } from "../lib/db.js";

dotenv.config();

const newUsers = [
  { email: "nguyenvanu@gmail.com", fullName: "Nguyễn Văn Út" },
  { email: "tranthiv@gmail.com", fullName: "Trần Thị Vân" },
  { email: "levanx@gmail.com", fullName: "Lê Văn Xuân" },
  { email: "phamthiy@gmail.com", fullName: "Phạm Thị Yến" },
  { email: "hoangvanz@gmail.com", fullName: "Hoàng Văn Zũng" },
  { email: "vuthiaa@gmail.com", fullName: "Vũ Thị An" },
  { email: "dangvanbb@gmail.com", fullName: "Đặng Văn Bình" },
  { email: "buithicc@gmail.com", fullName: "Bùi Thị Cúc" },
  { email: "dovandd@gmail.com", fullName: "Đỗ Văn Dũng" },
  { email: "ngothiee@gmail.com", fullName: "Ngô Thị Em" },
];

const addMoreUsers = async () => {
  try {
    console.log("\n🌱 BẮT ĐẦU THÊM USERS MỚI\n");
    console.log("=".repeat(50));

    await connectDB();

    const hashedPassword = await bcrypt.hash("123456", 10);
    const createdUsers = [];

    for (const userData of newUsers) {
      // Kiểm tra xem user đã tồn tại chưa
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`   ⚠️  ${userData.fullName} đã tồn tại, bỏ qua`);
        continue;
      }

      const user = await User.create({
        ...userData,
        password: hashedPassword,
        profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.fullName)}`,
      });
      createdUsers.push(user);
      console.log(`   ✅ ${user.fullName} (${user.email})`);
    }

    console.log(`\n📊 Đã thêm ${createdUsers.length} users mới\n`);
    console.log("=".repeat(50));
    console.log("\n🎉 HOÀN TẤT!\n");
    console.log("📋 Thông tin đăng nhập:");
    console.log("   - Mật khẩu: 123456");
    console.log("   - Email: xem danh sách trên\n");

  } catch (error) {
    console.error("\n❌ Lỗi:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

addMoreUsers();

