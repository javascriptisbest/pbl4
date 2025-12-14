/**
 * Reset Database Script
 * ⚠️ CẢNH BÁO: Script này sẽ XÓA TẤT CẢ dữ liệu trong database!
 * 
 * Cách chạy:
 * cd backend
 * node src/scripts/resetDatabase.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askConfirmation = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
};

const resetDatabase = async () => {
  console.log("\n⚠️  DATABASE RESET SCRIPT ⚠️\n");
  console.log("Kết nối đến:", process.env.MONGODB_URI?.substring(0, 50) + "...\n");

  const confirmed = await askConfirmation(
    "🚨 BẠN CÓ CHẮC MUỐN XÓA TẤT CẢ DỮ LIỆU? (y/n): "
  );

  if (!confirmed) {
    console.log("\n❌ Đã hủy. Không có gì bị xóa.\n");
    rl.close();
    process.exit(0);
  }

  try {
    // Kết nối MongoDB
    console.log("\n🔌 Đang kết nối MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Đã kết nối MongoDB\n");

    const db = mongoose.connection.db;

    // Lấy danh sách collections
    const collections = await db.listCollections().toArray();
    console.log(`📦 Tìm thấy ${collections.length} collections:\n`);
    
    collections.forEach((col, i) => {
      console.log(`   ${i + 1}. ${col.name}`);
    });

    console.log("\n");

    // Xác nhận lần 2
    const confirmed2 = await askConfirmation(
      "🚨 XÁC NHẬN LẦN CUỐI - Xóa tất cả collections trên? (y/n): "
    );

    if (!confirmed2) {
      console.log("\n❌ Đã hủy. Không có gì bị xóa.\n");
      await mongoose.disconnect();
      rl.close();
      process.exit(0);
    }

    // Xóa từng collection
    console.log("\n🗑️  Đang xóa dữ liệu...\n");
    
    for (const collection of collections) {
      try {
        await db.dropCollection(collection.name);
        console.log(`   ✅ Đã xóa: ${collection.name}`);
      } catch (err) {
        console.log(`   ⚠️  Không thể xóa ${collection.name}: ${err.message}`);
      }
    }

    console.log("\n🎉 HOÀN TẤT! Database đã được reset.\n");
    console.log("📝 Các collections sẽ được tạo lại tự động khi có dữ liệu mới.\n");

  } catch (error) {
    console.error("\n❌ Lỗi:", error.message);
  } finally {
    await mongoose.disconnect();
    rl.close();
    process.exit(0);
  }
};

resetDatabase();
