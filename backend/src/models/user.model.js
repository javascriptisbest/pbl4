import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// ===== DATABASE INDEXES FOR PERFORMANCE =====

// 1. Index cho email lookup (login, signup)
// MongoDB tự tạo index cho unique fields, nhưng explicit is better
userSchema.index({ email: 1 });

// 2. Index cho search by name (nếu có search feature)
userSchema.index({ fullName: "text" });

// 3. Index cho updatedAt (sort users by last activity)
userSchema.index({ updatedAt: -1 });

const User = mongoose.model("User", userSchema);

export default User;
