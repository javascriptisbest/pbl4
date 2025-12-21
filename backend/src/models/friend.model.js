import mongoose from "mongoose";

/**
 * Friend Model
 * Quản lý mối quan hệ bạn bè giữa các users
 * 
 * Status:
 * - pending: Đang chờ chấp nhận
 * - accepted: Đã chấp nhận (bạn bè)
 * - blocked: Đã chặn
 */
const friendSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Validation: Prevent self-friendship
friendSchema.pre('validate', function(next) {
  if (this.requester.toString() === this.recipient.toString()) {
    return next(new Error('Cannot create friendship with yourself'));
  }
  next();
});

// Compound index để đảm bảo unique relationship
// Một cặp user chỉ có một friend relationship
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Index để query nhanh
friendSchema.index({ requester: 1, status: 1 });
friendSchema.index({ recipient: 1, status: 1 });

// Index để tìm bạn bè của một user
friendSchema.index({ 
  $or: [
    { requester: 1, status: 1 },
    { recipient: 1, status: 1 }
  ]
});

const Friend = mongoose.model("Friend", friendSchema);

export default Friend;



