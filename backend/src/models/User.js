// models/user.model.js
const mongoose = require("mongoose");

const UserRole = ["learner", "tutor", "admin"];
const UserStatus = ["pending", "active", "blocked", "banned"];
const Gender = ["male", "female", "other"];

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    email: {
      type: String,
      required: true,
      unique: true, // unique index
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    phone_number: {
      type: String,
      unique: true, // unique index
      sparse: true, // cho phép null/undefined không vi phạm unique
      trim: true,
    },
    password_hash: {
      type: String,
      default: null,
      select: false, // mặc định không trả password_hash
    },
    role: {
      type: String,
      enum: UserRole,
      default: "learner",
      index: true,
    },
    status: {
      type: String,
      enum: UserStatus,
      default: "pending",
      index: true,
    },
    date_of_birth: { type: Date, default: null },
    gender: { type: String, enum: Gender, default: null },
    address: { type: String, default: null, trim: true },
    city: { type: String, default: null, trim: true },
    image: { type: String, default: null, trim: true },
    is_default_address: { type: Boolean, default: true },
    // Auth / security fields
    refresh_tokens: [{ type: String }],
    verify_token: { type: String, default: null, index: true },
    verify_token_expires: { type: Date, default: null },
    email_verified_at: { type: Date, default: null },
    reset_password_token: { type: String, default: null, index: true },
    reset_password_expires: { type: Date, default: null },
    otp_code: { type: String, default: null },
    otp_expires: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    collection: "users",
    toJSON: {
      transform(doc, ret) {
        delete ret.password_hash; // đảm bảo không lộ pass hash
        return ret;
      },
    },
  }
);

// Index phụ (tùy chọn nhưng hữu ích)
// Tránh trùng lặp với unique đã khai báo ở field
userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model("User", userSchema);
