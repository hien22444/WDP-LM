// models/user.model.js
const mongoose = require("mongoose");

const UserRole = ["learner", "tutor", "admin"];
const UserStatus = ["pending", "active", "blocked"];
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
<<<<<<< HEAD
=======
    // Profile completion tracking
    profile_completed: { type: Boolean, default: false, index: true },
    profile_completion_step: { 
      type: String, 
      enum: ["basic_info", "contact_info", "preferences", "completed"], 
      default: "basic_info" 
    },
    first_login: { type: Boolean, default: true },
    profile_completed_at: { type: Date, default: null },
    
    // Tutor verification fields
    tutor_verification: {
      // Identity verification
      identity_documents: [{
        type: { type: String, enum: ["cccd", "cmnd", "passport", "driver_license"], required: true },
        front_image: { type: String, required: true },
        back_image: { type: String, required: true },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        uploaded_at: { type: Date, default: Date.now },
        admin_notes: { type: String, default: "" }
      }],
      
      // Education verification
      education_documents: [{
        type: { type: String, enum: ["student_card", "diploma", "degree", "teacher_card"], required: true },
        document_image: { type: String, required: true },
        institution_name: { type: String, required: true },
        major: { type: String, required: true },
        graduation_year: { type: Number },
        gpa: { type: String },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        uploaded_at: { type: Date, default: Date.now },
        admin_notes: { type: String, default: "" }
      }],
      
      // Certificates and achievements
      certificates: [{
        name: { type: String, required: true },
        type: { type: String, enum: ["language", "academic", "professional", "achievement"], required: true },
        document_image: { type: String, required: true },
        issuing_organization: { type: String, required: true },
        issue_date: { type: Date },
        expiry_date: { type: Date },
        score: { type: String },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        uploaded_at: { type: Date, default: Date.now },
        admin_notes: { type: String, default: "" }
      }],
      
      // Overall verification status
      identity_verified: { type: Boolean, default: false },
      education_verified: { type: Boolean, default: false },
      certificates_verified: { type: Boolean, default: false },
      overall_status: { 
        type: String, 
        enum: ["not_started", "in_progress", "pending_review", "approved", "rejected"], 
        default: "not_started" 
      },
      verification_score: { type: Number, default: 0, min: 0, max: 100 },
      verified_at: { type: Date, default: null },
      admin_notes: { type: String, default: "" },
      
      
      // Commitment signature
      commitment_signed: { type: Boolean, default: false },
      commitment_signed_at: { type: Date, default: null },
      commitment_text: { 
        type: String, 
        default: "Tôi cam kết các thông tin và giấy tờ cung cấp là trung thực. Nếu phát hiện gian lận, tôi chịu trách nhiệm và chấp nhận khóa tài khoản vĩnh viễn."
      }
    },
>>>>>>> Quan3
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
