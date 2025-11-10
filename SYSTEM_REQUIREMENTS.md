# 📚 LearnMate - Hệ thống Nền tảng Kết nối Gia sư

## 🎯 Tổng quan dự án

**LearnMate** là một nền tảng web marketplace kết nối học viên (learners) với gia sư (tutors), cho phép đặt lịch học, thanh toán trực tuyến, học trực tuyến qua WebRTC, đánh giá và quản lý hợp đồng. Hệ thống được xây dựng với kiến trúc MERN stack (MongoDB, Express.js, React, Node.js).

---

## 🏗️ Kiến trúc hệ thống

### Stack công nghệ

#### Backend (Node.js + Express)
- **Runtime**: Node.js v16+
- **Framework**: Express v5.1.0
- **Database**: MongoDB (Mongoose v8.18.3)
- **Authentication**: JWT (jsonwebtoken v9.0.2) + Google OAuth 2.0
- **Payment Gateway**: PayOS v2.0.3 (VN Payment)
- **File Upload**: Cloudinary + Multer
- **Real-time Communication**: 
  - Socket.IO v4.8.1 (chat, notifications)
  - WebRTC (video calls for online tutoring)
- **Email Service**: Nodemailer v7.0.10
- **AI Integration**: OpenAI API v6.4.0 (chatbot hỗ trợ)

#### Frontend (React)
- **Framework**: React v18.2.0
- **Routing**: React Router DOM v6.20.0
- **State Management**: Redux Toolkit v2.2.0
- **UI Framework**: Bootstrap v5.3.3 + React Bootstrap v2.10.4
- **Styling**: SASS v1.69.5 + TailwindCSS + Framer Motion v12.23.24
- **HTTP Client**: Axios v1.6.2
- **Auth**: @react-oauth/google v0.12.2
- **Real-time**: Socket.IO Client v4.8.1
- **Animations**: AOS v2.3.4 + Animate.css v4.1.1

### Cấu trúc thư mục

```
WDP-LM/
├── backend/
│   ├── server.js                    # Entry point
│   ├── package.json
│   ├── .env
│   ├── scripts/                     # Utility scripts
│   │   ├── checkPayOS.js
│   │   ├── checkUsers.js
│   │   ├── fixTutorData.js
│   │   ├── seedTestData.js
│   │   └── ...
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js         # MongoDB connection
│   │   │   ├── payos.js            # PayOS SDK config
│   │   │   └── cloudinary.js       # Cloudinary config
│   │   ├── models/                 # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── TutorProfile.js
│   │   │   ├── Booking.js
│   │   │   ├── Review.js
│   │   │   ├── Payment.js
│   │   │   ├── Notification.js
│   │   │   ├── Message.js
│   │   │   ├── Conversation.js
│   │   │   ├── TeachingSession.js
│   │   │   └── TeachingSlot.js
│   │   ├── routes/                 # API routes
│   │   │   ├── auth.js             # Đăng nhập/đăng ký
│   │   │   ├── user.js             # Profile user
│   │   │   ├── tutor.js            # Quản lý gia sư
│   │   │   ├── booking.js          # Đặt lịch & sessions
│   │   │   ├── payment.js          # Thanh toán PayOS
│   │   │   ├── review.js           # Đánh giá
│   │   │   ├── chat.js             # Tin nhắn
│   │   │   ├── notification.js     # Thông báo
│   │   │   ├── admin.js            # Admin panel
│   │   │   ├── admin-contracts.js  # Quản lý hợp đồng
│   │   │   ├── admin-verification.js # Duyệt gia sư
│   │   │   ├── tutor-verification.js # Upload CV
│   │   │   ├── profile-completion.js # Hoàn thiện profile
│   │   │   ├── dashboard.js        # Dashboard stats
│   │   │   └── ai.js               # AI chatbot
│   │   ├── controllers/            # Business logic
│   │   │   ├── authController.js
│   │   │   ├── paymentController.js
│   │   │   ├── dashboardController.js
│   │   │   └── ...
│   │   ├── middlewares/
│   │   │   ├── auth.js             # JWT verification
│   │   │   ├── upload.js           # Multer config
│   │   │   └── errorHandler.js
│   │   ├── services/
│   │   │   ├── NotificationService.js
│   │   │   ├── EscrowService.js    # (legacy - removed)
│   │   │   ├── WebRTCService.js    # Video call rooms
│   │   │   └── EmailService.js
│   │   ├── socket/
│   │   │   ├── chatSocket.js       # Chat real-time
│   │   │   └── webrtcSocket.js     # WebRTC signaling
│   │   ├── utils/
│   │   │   ├── tokenUtils.js
│   │   │   └── validators.js
│   │   └── cron/                   # Background jobs (optional)
│   └── uploads/                    # Local file uploads (temp)
│
├── frontend/
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   │   ├── demo_payment.html       # Demo thanh toán
│   │   └── manifest.json
│   ├── src/
│   │   ├── App.js                  # Main component
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── pages/                  # Page components
│   │   │   ├── Home.js             # Landing page
│   │   │   ├── LandingPage/        # Marketing pages
│   │   │   ├── About/              # Giới thiệu
│   │   │   ├── Profile/            # User profile
│   │   │   ├── Tutor/              # Tutor pages
│   │   │   │   ├── TutorSearch.js  # Tìm gia sư
│   │   │   │   ├── TutorProfile.js # Chi tiết gia sư
│   │   │   │   ├── TutorBookings.js # Dashboard gia sư
│   │   │   │   ├── StudentBookings.js # Dashboard học viên
│   │   │   │   └── TutorDashboard.js
│   │   │   ├── Payment/            # Thanh toán
│   │   │   │   ├── OrderSummary.js
│   │   │   │   ├── PaymentSuccess.js
│   │   │   │   └── PaymentCancel.js
│   │   │   ├── Messages/           # Chat
│   │   │   ├── Admin/              # Admin panel
│   │   │   │   ├── AdminTutors.js  # Quản lý gia sư
│   │   │   │   ├── AdminUsers.js   # Quản lý users
│   │   │   │   ├── AdminContracts.js
│   │   │   │   └── AdminDashboard.js
│   │   │   ├── Contract/           # Hợp đồng điện tử
│   │   │   └── DashBoard/          # User dashboard
│   │   ├── components/             # Reusable components
│   │   │   ├── Navbar.js
│   │   │   ├── Footer.js
│   │   │   ├── Review/
│   │   │   │   ├── ReviewModal.js  # Modal đánh giá
│   │   │   │   └── ReviewList.js
│   │   │   ├── Booking/
│   │   │   ├── Chat/
│   │   │   └── Common/
│   │   ├── services/               # API clients
│   │   │   ├── api.js              # Axios config
│   │   │   ├── AuthService.js
│   │   │   ├── TutorService.js
│   │   │   ├── BookingService.js
│   │   │   ├── PaymentService.js
│   │   │   ├── ReviewService.js
│   │   │   ├── ChatService.js
│   │   │   └── NotificationService.js
│   │   ├── redux/                  # Redux store
│   │   │   ├── store.js
│   │   │   └── slices/
│   │   │       ├── authSlice.js
│   │   │       ├── tutorSlice.js
│   │   │       └── notificationSlice.js
│   │   └── styles/                 # Global styles
│   │       ├── variables.scss
│   │       └── components.scss
│   └── build/                      # Production build
│
└── Documentation/                  # Docs (markdown files)
    ├── ADMIN_CONTRACT_MANAGEMENT_SYSTEM.md
    ├── BOOKING_SYSTEM_DOCUMENTATION.md
    ├── PAYMENT_FLOW_DETAILED.md
    ├── COMPLETE_NOTIFICATION_FLOW.md
    └── ...
```

---

## 📊 Database Schema (MongoDB)

### Collections & Relationships

```javascript
// 1. Users Collection
{
  _id: ObjectId,
  full_name: String,
  email: String (unique),
  phone_number: String (unique, sparse),
  password_hash: String,
  role: ["learner", "tutor", "admin"],
  status: ["pending", "active", "blocked"],
  date_of_birth: Date,
  gender: ["male", "female", "other"],
  address: String,
  city: String,
  image: String (Cloudinary URL),
  
  // Authentication
  refresh_tokens: [String],
  verify_token: String,
  verify_token_expires: Date,
  email_verified_at: Date,
  reset_password_token: String,
  reset_password_expires: Date,
  otp_code: String,
  otp_expires: Date,
  
  // Profile tracking
  profile_completed: Boolean,
  profile_completion_step: ["basic_info", "contact_info", "preferences", "completed"],
  first_login: Boolean,
  
  // Tutor verification (legacy - moved to TutorProfile)
  tutor_verification: {
    identity_documents: [{
      type: ["cccd", "cmnd", "passport", "driver_license"],
      front_image: String,
      back_image: String,
      status: ["pending", "approved", "rejected"],
      uploaded_at: Date,
      admin_notes: String
    }],
    education_documents: [{...}],
    certificates: [{...}],
    commitment: {...}
  },
  
  created_at: Date,
  updated_at: Date
}

// 2. TutorProfiles Collection
{
  _id: ObjectId,
  user: ObjectId -> Users._id (unique),
  
  // Profile info
  avatarUrl: String,
  gender: ["male", "female", "other"],
  dateOfBirth: Date,
  city: String,
  district: String,
  bio: String (max 2000 chars),
  
  // Documents
  idDocumentUrls: [String],
  degreeDocumentUrls: [String],
  
  // Expertise
  subjects: [{
    name: String,          // "Toán", "Lý", "IELTS"
    level: String,         // "THCS", "THPT", "Beginner"
    price: Number,         // Giá riêng cho môn này
    description: String
  }],
  experienceYears: Number,
  experiencePlaces: String,
  
  // Teaching preferences
  teachModes: ["online", "offline"],
  languages: [String],
  paymentType: ["per_session", "per_month"],
  sessionRate: Number,    // Giá mặc định
  
  // Availability
  availability: [{
    dayOfWeek: Number (0-6),
    start: String ("18:00"),
    end: String ("20:00")
  }],
  hasAvailability: Boolean,
  
  // Verification
  verification: {
    idStatus: ["none", "pending", "approved", "rejected"],
    degreeStatus: ["none", "pending", "approved", "rejected"],
    certificatesStatus: ["none", "pending", "approved", "rejected"],
    adminNotes: String,
    isVerified: Boolean
  },
  status: ["draft", "pending", "approved", "rejected"],
  
  // Ratings
  rating: Number (0-5),
  totalReviews: Number,
  ratingCategories: {
    teaching: Number (0-5),
    punctuality: Number (0-5),
    communication: Number (0-5),
    preparation: Number (0-5),
    friendliness: Number (0-5)
  },
  
  // Earnings (legacy - removed)
  earnings: {...},
  bankAccount: {...},
  
  created_at: Date,
  updated_at: Date
}

// 3. Bookings Collection
{
  _id: ObjectId,
  tutorProfile: ObjectId -> TutorProfiles._id,
  student: ObjectId -> Users._id,
  
  // Session details
  start: Date,
  end: Date,
  mode: ["online", "offline"],
  price: Number,
  notes: String,
  location: String,
  
  // Status
  status: ["pending", "accepted", "rejected", "cancelled", "completed", "in_progress", "disputed"],
  paymentStatus: ["none", "paid"],
  paymentId: String,
  
  // Cancellation
  cancellationReason: String,
  cancelledBy: ["student", "tutor", "admin"],
  cancelledAt: Date,
  
  // Completion
  completedAt: Date,
  
  // Dispute
  disputeReason: String,
  disputeOpenedAt: Date,
  disputeResolvedAt: Date,
  
  // Session management
  sessionId: ObjectId -> TeachingSessions._id,
  roomId: String (WebRTC room ID),
  slotId: ObjectId -> TeachingSlots._id,
  reminderSent: Boolean,
  
  // Contract (electronic signature)
  contractSigned: Boolean,
  contractNumber: String,
  studentSignature: String (base64),
  studentSignedAt: Date,
  tutorSignature: String (base64),
  tutorSignedAt: Date,
  contractData: {
    studentName: String,
    studentPhone: String,
    studentEmail: String,
    studentAddress: String,
    subject: String,
    totalSessions: Number,
    pricePerSession: Number,
    totalAmount: Number,
    startDate: Date,
    endDate: Date,
    terms: String
  },
  
  created_at: Date,
  updated_at: Date
}

// 4. Reviews Collection
{
  _id: ObjectId,
  booking: ObjectId -> Bookings._id (unique),
  tutorProfile: ObjectId -> TutorProfiles._id,
  student: ObjectId -> Users._id,
  
  rating: Number (1-5, required),
  comment: String (max 1000 chars),
  
  categories: {
    teaching: Number (1-5),
    punctuality: Number (1-5),
    communication: Number (1-5),
    preparation: Number (1-5),
    friendliness: Number (1-5)
  },
  
  isAnonymous: Boolean,
  isVerified: Boolean,
  
  // Engagement
  helpful: Number,        // Số lượt "hữu ích"
  reported: Number,       // Số lượt báo cáo
  isHidden: Boolean,      // Ẩn nếu bị report nhiều
  
  // Tutor response
  response: {
    comment: String,
    respondedAt: Date
  },
  
  created_at: Date,
  updated_at: Date
}

// 5. Payments Collection
{
  _id: ObjectId,
  orderCode: String (unique),
  vnp_txnref: String,
  userId: ObjectId -> Users._id,
  slotId: ObjectId -> TeachingSlots._id,
  
  amount: Number,
  productName: String,
  
  status: ["PENDING", "PAID", "CANCELLED"],
  paidAt: Date,
  
  // PayOS data
  checkoutUrl: String,
  qrUrl: String,
  paymentData: Object,    // Webhook data from PayOS
  
  metadata: {
    slotId: ObjectId,
    contractData: Object,
    studentSignature: String
  },
  
  createdAt: Date,
  updatedAt: Date
}

// 6. TeachingSlots Collection (public slots for booking)
{
  _id: ObjectId,
  tutorProfile: ObjectId -> TutorProfiles._id,
  
  start: Date,
  end: Date,
  mode: ["online", "offline"],
  price: Number,
  courseName: String,
  courseDescription: String,
  maxStudents: Number,
  
  status: ["open", "booked", "closed", "cancelled"],
  bookedBy: [ObjectId -> Users._id],
  
  created_at: Date,
  updated_at: Date
}

// 7. TeachingSessions Collection (actual teaching sessions)
{
  _id: ObjectId,
  booking: ObjectId -> Bookings._id,
  tutor: ObjectId -> Users._id,
  student: ObjectId -> Users._id,
  
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  
  status: ["scheduled", "in_progress", "completed", "cancelled"],
  
  roomId: String,         // WebRTC room
  recordingUrl: String,
  
  notes: String,
  studentNotes: String,
  tutorNotes: String,
  
  created_at: Date,
  updated_at: Date
}

// 8. Notifications Collection
{
  _id: ObjectId,
  recipient: ObjectId -> Users._id,
  type: ["info", "warning", "success", "error"],
  category: ["booking", "payment", "review", "message", "system"],
  
  title: String,
  message: String,
  
  read: Boolean,
  readAt: Date,
  
  metadata: {
    bookingId: ObjectId,
    paymentId: ObjectId,
    reviewId: ObjectId,
    url: String
  },
  
  created_at: Date
}

// 9. Conversations Collection
{
  _id: ObjectId,
  participants: [ObjectId -> Users._id],
  lastMessage: String,
  lastMessageAt: Date,
  unreadCount: {
    [userId]: Number
  },
  created_at: Date,
  updated_at: Date
}

// 10. Messages Collection
{
  _id: ObjectId,
  conversation: ObjectId -> Conversations._id,
  sender: ObjectId -> Users._id,
  content: String,
  type: ["text", "image", "file"],
  fileUrl: String,
  read: Boolean,
  readAt: Date,
  created_at: Date
}
```

---

## �️ Mongoose Models Implementation

### 1. User Model (User.js)

```javascript
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
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    phone_number: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password_hash: {
      type: String,
      default: null,
      select: false,
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
    
    // Authentication
    refresh_tokens: [{ type: String }],
    verify_token: { type: String, default: null, index: true },
    verify_token_expires: { type: Date, default: null },
    email_verified_at: { type: Date, default: null },
    reset_password_token: { type: String, default: null, index: true },
    reset_password_expires: { type: Date, default: null },
    otp_code: { type: String, default: null },
    otp_expires: { type: Date, default: null },
    
    // Profile tracking
    profile_completed: { type: Boolean, default: false, index: true },
    profile_completion_step: {
      type: String,
      enum: ["basic_info", "contact_info", "preferences", "completed"],
      default: "basic_info",
    },
    first_login: { type: Boolean, default: true },
    profile_completed_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ verify_token: 1 });
userSchema.index({ reset_password_token: 1 });

// Virtual for checking if email is verified
userSchema.virtual("isEmailVerified").get(function () {
  return this.email_verified_at !== null;
});

// Methods
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.refresh_tokens;
  delete obj.verify_token;
  delete obj.reset_password_token;
  delete obj.otp_code;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
```

### 2. TutorProfile Model (TutorProfile.js)

```javascript
const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: String, default: null, trim: true },
    price: { type: Number, default: 0, min: 0 },
    description: { type: String, default: null },
  },
  { _id: false }
);

const AvailabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const VerificationSchema = new mongoose.Schema(
  {
    idStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    degreeStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    certificatesStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    adminNotes: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
  },
  { _id: false }
);

const TutorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },
    avatarUrl: { type: String, default: null },
    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },
    dateOfBirth: { type: Date, default: null },
    city: { type: String, default: null },
    district: { type: String, default: null },
    bio: { type: String, default: null, maxlength: 2000 },
    
    idDocumentUrls: { type: [String], default: [] },
    degreeDocumentUrls: { type: [String], default: [] },
    
    subjects: { type: [SubjectSchema], default: [] },
    experienceYears: { type: Number, default: 0, min: 0 },
    experiencePlaces: { type: String, default: null },
    
    teachModes: { type: [String], enum: ["online", "offline"], default: [] },
    languages: { type: [String], default: [] },
    paymentType: {
      type: String,
      enum: ["per_session", "per_month", null],
      default: "per_session",
    },
    sessionRate: { type: Number, default: 0, min: 0 },
    
    availability: { type: [AvailabilitySlotSchema], default: [] },
    hasAvailability: { type: Boolean, default: false, index: true },
    
    verification: { type: VerificationSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
      index: true,
    },
    
    // Ratings
    rating: { type: Number, default: 0, min: 0, max: 5, index: true },
    totalReviews: { type: Number, default: 0, min: 0 },
    ratingCategories: {
      teaching: { type: Number, default: 0, min: 0, max: 5 },
      punctuality: { type: Number, default: 0, min: 0, max: 5 },
      communication: { type: Number, default: 0, min: 0, max: 5 },
      preparation: { type: Number, default: 0, min: 0, max: 5 },
      friendliness: { type: Number, default: 0, min: 0, max: 5 },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// Indexes
TutorProfileSchema.index({ user: 1 }, { unique: true });
TutorProfileSchema.index({ status: 1, rating: -1 });
TutorProfileSchema.index({ "subjects.name": 1 });
TutorProfileSchema.index({ city: 1, status: 1 });
TutorProfileSchema.index({ sessionRate: 1 });

module.exports = mongoose.model("TutorProfile", TutorProfileSchema);
```

### 3. Booking Model (Booking.js)

```javascript
const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    tutorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TutorProfile",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    mode: { type: String, enum: ["online", "offline"], required: true },
    price: { type: Number, default: 0 },
    location: { type: String, default: null },
    
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "cancelled",
        "completed",
        "in_progress",
        "disputed",
      ],
      default: "pending",
      index: true,
    },
    
    notes: { type: String, default: null },
    
    paymentStatus: {
      type: String,
      enum: ["none", "paid"],
      default: "none",
    },
    paymentId: { type: String, default: null },
    
    // Cancellation
    cancellationReason: { type: String, default: null },
    cancelledBy: {
      type: String,
      enum: ["student", "tutor", "admin"],
      default: null,
    },
    cancelledAt: { type: Date, default: null },
    
    // Completion
    completedAt: { type: Date, default: null },
    
    // Dispute
    disputeReason: { type: String, default: null },
    disputeOpenedAt: { type: Date, default: null },
    disputeResolvedAt: { type: Date, default: null },
    
    // Session management
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeachingSession",
      default: null,
    },
    roomId: { type: String, default: null, index: true },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeachingSlot",
      default: null,
      index: true,
    },
    reminderSent: { type: Boolean, default: false },
    
    // Contract
    contractSigned: { type: Boolean, default: false },
    contractNumber: { type: String, default: null },
    studentSignature: { type: String, default: null },
    studentSignedAt: { type: Date, default: null },
    tutorSignature: { type: String, default: null },
    tutorSignedAt: { type: Date, default: null },
    contractData: {
      studentName: { type: String, default: null },
      studentPhone: { type: String, default: null },
      studentEmail: { type: String, default: null },
      studentAddress: { type: String, default: null },
      subject: { type: String, default: null },
      totalSessions: { type: Number, default: 1 },
      pricePerSession: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      terms: { type: String, default: null },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// Indexes
BookingSchema.index({ student: 1, status: 1 });
BookingSchema.index({ tutorProfile: 1, status: 1 });
BookingSchema.index({ slotId: 1 });
BookingSchema.index({ start: 1 });
BookingSchema.index({ roomId: 1 });

module.exports = mongoose.model("Booking", BookingSchema);
```

### 4. Review Model (Review.js)

```javascript
const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },
    tutorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TutorProfile",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    comment: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    categories: {
      teaching: { type: Number, min: 1, max: 5, default: 5 },
      punctuality: { type: Number, min: 1, max: 5, default: 5 },
      communication: { type: Number, min: 1, max: 5, default: 5 },
      preparation: { type: Number, min: 1, max: 5, default: 5 },
      friendliness: { type: Number, min: 1, max: 5, default: 5 },
    },
    isAnonymous: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: true },
    helpful: { type: Number, default: 0 },
    reported: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
    response: {
      comment: { type: String, maxlength: 1000 },
      respondedAt: { type: Date },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// Indexes
ReviewSchema.index({ booking: 1 }, { unique: true });
ReviewSchema.index({ tutorProfile: 1, created_at: -1 });
ReviewSchema.index({ student: 1 });
ReviewSchema.index({ rating: -1 });

// Auto-update TutorProfile rating when review is created
ReviewSchema.post("save", async function () {
  try {
    const TutorProfile = mongoose.model("TutorProfile");
    const Review = mongoose.model("Review");

    const reviews = await Review.find({ tutorProfile: this.tutorProfile });
    const totalReviews = reviews.length;

    if (totalReviews === 0) return;

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    const avgCategories = {
      teaching:
        reviews.reduce((sum, r) => sum + r.categories.teaching, 0) /
        totalReviews,
      punctuality:
        reviews.reduce((sum, r) => sum + r.categories.punctuality, 0) /
        totalReviews,
      communication:
        reviews.reduce((sum, r) => sum + r.categories.communication, 0) /
        totalReviews,
      preparation:
        reviews.reduce((sum, r) => sum + r.categories.preparation, 0) /
        totalReviews,
      friendliness:
        reviews.reduce((sum, r) => sum + r.categories.friendliness, 0) /
        totalReviews,
    };

    await TutorProfile.updateOne(
      { _id: this.tutorProfile },
      {
        rating: Math.round(avgRating * 10) / 10,
        totalReviews: totalReviews,
        ratingCategories: avgCategories,
      }
    );
  } catch (error) {
    console.error("Error updating tutor rating:", error);
  }
});

// Auto-update TutorProfile rating when review is deleted
ReviewSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  try {
    const TutorProfile = mongoose.model("TutorProfile");
    const Review = mongoose.model("Review");

    const reviews = await Review.find({ tutorProfile: doc.tutorProfile });
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      await TutorProfile.updateOne(
        { _id: doc.tutorProfile },
        {
          rating: 0,
          totalReviews: 0,
          ratingCategories: {
            teaching: 0,
            punctuality: 0,
            communication: 0,
            preparation: 0,
            friendliness: 0,
          },
        }
      );
      return;
    }

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    const avgCategories = {
      teaching:
        reviews.reduce((sum, r) => sum + r.categories.teaching, 0) /
        totalReviews,
      punctuality:
        reviews.reduce((sum, r) => sum + r.categories.punctuality, 0) /
        totalReviews,
      communication:
        reviews.reduce((sum, r) => sum + r.categories.communication, 0) /
        totalReviews,
      preparation:
        reviews.reduce((sum, r) => sum + r.categories.preparation, 0) /
        totalReviews,
      friendliness:
        reviews.reduce((sum, r) => sum + r.categories.friendliness, 0) /
        totalReviews,
    };

    await TutorProfile.updateOne(
      { _id: doc.tutorProfile },
      {
        rating: Math.round(avgRating * 10) / 10,
        totalReviews: totalReviews,
        ratingCategories: avgCategories,
      }
    );
  } catch (error) {
    console.error("Error updating tutor rating after delete:", error);
  }
});

// Auto-update TutorProfile rating when review is updated
ReviewSchema.post("findOneAndUpdate", async function (doc) {
  if (!doc) return;

  try {
    const TutorProfile = mongoose.model("TutorProfile");
    const Review = mongoose.model("Review");

    const reviews = await Review.find({ tutorProfile: doc.tutorProfile });
    const totalReviews = reviews.length;

    if (totalReviews === 0) return;

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    const avgCategories = {
      teaching:
        reviews.reduce((sum, r) => sum + r.categories.teaching, 0) /
        totalReviews,
      punctuality:
        reviews.reduce((sum, r) => sum + r.categories.punctuality, 0) /
        totalReviews,
      communication:
        reviews.reduce((sum, r) => sum + r.categories.communication, 0) /
        totalReviews,
      preparation:
        reviews.reduce((sum, r) => sum + r.categories.preparation, 0) /
        totalReviews,
      friendliness:
        reviews.reduce((sum, r) => sum + r.categories.friendliness, 0) /
        totalReviews,
    };

    await TutorProfile.updateOne(
      { _id: doc.tutorProfile },
      {
        rating: Math.round(avgRating * 10) / 10,
        totalReviews: totalReviews,
        ratingCategories: avgCategories,
      }
    );
  } catch (error) {
    console.error("Error updating tutor rating after update:", error);
  }
});

module.exports = mongoose.model("Review", ReviewSchema);
```

### 5. Payment Model (Payment.js)

```javascript
const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    vnp_txnref: { type: String, default: null },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeachingSlot",
      default: null,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    productName: { type: String, default: null },
    checkoutUrl: { type: String, default: null },
    qrUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    paidAt: { type: Date, default: null },
    paymentData: { type: Object, default: {} },
    metadata: { type: Object, default: {} },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

// Indexes
PaymentSchema.index({ orderCode: 1 }, { unique: true });
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ slotId: 1 });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payment", PaymentSchema);
```

### 6. TeachingSlot Model (TeachingSlot.js)

```javascript
const mongoose = require("mongoose");

const TeachingSlotSchema = new mongoose.Schema(
  {
    tutorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TutorProfile",
      required: true,
      index: true,
    },
    start: { type: Date, required: true, index: true },
    end: { type: Date, required: true },
    mode: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },
    price: { type: Number, default: 0, min: 0 },
    courseName: { type: String, required: true },
    courseDescription: { type: String, default: null },
    maxStudents: { type: Number, default: 1, min: 1 },
    status: {
      type: String,
      enum: ["open", "booked", "closed", "cancelled"],
      default: "open",
      index: true,
    },
    bookedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// Indexes
TeachingSlotSchema.index({ tutorProfile: 1, status: 1 });
TeachingSlotSchema.index({ start: 1, status: 1 });
TeachingSlotSchema.index({ mode: 1, status: 1 });

module.exports = mongoose.model("TeachingSlot", TeachingSlotSchema);
```

### 7. TeachingSession Model (TeachingSession.js)

```javascript
const mongoose = require("mongoose");

const TeachingSessionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scheduledAt: { type: Date, required: true, index: true },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    roomId: { type: String, default: null, index: true },
    recordingUrl: { type: String, default: null },
    notes: { type: String, default: null },
    studentNotes: { type: String, default: null },
    tutorNotes: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// Indexes
TeachingSessionSchema.index({ booking: 1 });
TeachingSessionSchema.index({ tutor: 1, scheduledAt: -1 });
TeachingSessionSchema.index({ student: 1, scheduledAt: -1 });
TeachingSessionSchema.index({ roomId: 1 });
TeachingSessionSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model("TeachingSession", TeachingSessionSchema);
```

### 8. Notification Model (Notification.js)

```javascript
const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error"],
      default: "info",
    },
    category: {
      type: String,
      enum: ["booking", "payment", "review", "message", "system"],
      default: "system",
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    metadata: {
      bookingId: { type: mongoose.Schema.Types.ObjectId, default: null },
      paymentId: { type: mongoose.Schema.Types.ObjectId, default: null },
      reviewId: { type: mongoose.Schema.Types.ObjectId, default: null },
      url: { type: String, default: null },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// Indexes
NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ recipient: 1, created_at: -1 });
NotificationSchema.index({ category: 1 });

module.exports = mongoose.model("Notification", NotificationSchema);
```

### 9. Conversation Model (Conversation.js)

```javascript
const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: { type: String, default: null },
    lastMessageAt: { type: Date, default: null, index: true },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// Indexes
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

// Compound index for finding conversation between two users
ConversationSchema.index({ "participants.0": 1, "participants.1": 1 });

module.exports = mongoose.model("Conversation", ConversationSchema);
```

### 10. Message Model (Message.js)

```javascript
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    fileUrl: { type: String, default: null },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// Indexes
MessageSchema.index({ conversation: 1, created_at: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ read: 1 });

// Update conversation's lastMessage after new message
MessageSchema.post("save", async function () {
  try {
    const Conversation = mongoose.model("Conversation");
    await Conversation.updateOne(
      { _id: this.conversation },
      {
        lastMessage: this.content.substring(0, 100),
        lastMessageAt: this.created_at,
      }
    );
  } catch (error) {
    console.error("Error updating conversation:", error);
  }
});

module.exports = mongoose.model("Message", MessageSchema);
```

---

## �🔐 Authentication & Authorization

### JWT-based Authentication
1. **Đăng ký**: POST `/api/v1/auth/register`
   - Email + Password hoặc Google OAuth
   - Gửi email xác thực (OTP)
   
2. **Đăng nhập**: POST `/api/v1/auth/login`
   - Returns: `accessToken` (cookie) + `refreshToken`
   - JWT expires: 1 day (access), 7 days (refresh)

3. **Google OAuth**: GET `/api/v1/auth/google`
   - Sử dụng Google Auth Library
   - Auto-create user nếu chưa tồn tại

4. **Middleware**: `auth()`
   - Kiểm tra JWT token từ cookie hoặc header
   - Attach `req.user = { id, role, email }`

5. **Role-based Access**:
   - `requireAdmin()` - Chỉ admin
   - `requireTutor()` - Chỉ tutor
   - Routes có `auth()` nhưng không có role check → all logged-in users

---

## 💳 Payment Flow (PayOS Integration)

### Luồng thanh toán

1. **Learner chọn slot** → `/tutors/:id` → Click "Đặt lịch"
2. **Tạo payment link**: POST `/api/v1/payment/create-payment-link`
   ```javascript
   {
     product: {
       name: "Khóa học Toán",
       unitPrice: 200000,
       id: slotId
     },
     metadata: {
       slotId: "...",
       contractData: {...},
       studentSignature: "base64..."
     }
   }
   ```
3. **PayOS trả về**:
   - `checkoutUrl` → Redirect user
   - `qrUrl` → Hiển thị QR code

4. **User thanh toán** qua app ngân hàng

5. **PayOS gọi webhook**: POST `/api/v1/payment/payos-webhook`
   ```javascript
   {
     code: "00",
     data: {
       orderCode: "...",
       status: "PAID"
     }
   }
   ```

6. **Backend xử lý webhook**:
   - Update Payment status → "PAID"
   - Tìm TeachingSlot theo `metadata.slotId`
   - Tạo Booking:
     ```javascript
     {
       tutorProfile: slot.tutorProfile,
       student: payment.userId,
       start: slot.start,
       end: slot.end,
       mode: slot.mode,
       price: slot.price,
       status: "pending",
       paymentStatus: "paid",
       slotId: slot._id,
       contractData: metadata.contractData,
       studentSignature: metadata.studentSignature
     }
     ```
   - Update TeachingSlot status → "booked"
   - Tạo Notification cho tutor: "Bạn có yêu cầu đặt lịch mới từ [Student Name]"
   - Tạo Notification cho student: "Thanh toán thành công"

7. **Tutor nhận notification** → Vào `/bookings/tutor` → Accept/Reject

8. **After completed** → Student có thể review

---

## 📅 Booking System

### Booking States Flow

```
[Student creates booking] → PENDING
   ↓ (Tutor accepts)
ACCEPTED
   ↓ (Session starts)
IN_PROGRESS
   ↓ (Session ends)
COMPLETED → [Student can review]

OR

PENDING → REJECTED (Tutor rejects)
PENDING/ACCEPTED → CANCELLED (Student/Tutor cancels)
COMPLETED → DISPUTED (Student opens dispute)
```

### API Endpoints

1. **POST /api/v1/bookings** - Tạo booking (legacy - thường dùng payment flow)
2. **GET /api/v1/bookings/me** - List bookings (tutor or student)
3. **POST /api/v1/bookings/:id/decision** - Tutor accept/reject
4. **POST /api/v1/bookings/:id/complete** - Mark completed
5. **POST /api/v1/bookings/:id/cancel** - Cancel booking
6. **POST /api/v1/bookings/:id/contract** - Sign contract
7. **GET /api/v1/bookings/slots/public** - Public teaching slots
8. **POST /api/v1/bookings/slots** - Tutor tạo slot
9. **POST /api/v1/bookings/slots/:slotId/book** - Book một slot

---

## ⭐ Review System

### Requirements
- Student có thể review **sau khi booking completed**
- **1 booking = 1 review** (unique constraint)
- Rating: 1-5 stars (overall + 5 categories)
- Review tự động cập nhật `TutorProfile.rating` và `ratingCategories`

### API Endpoints

1. **POST /api/v1/reviews**
   ```javascript
   {
     bookingId: ObjectId,
     rating: 5,
     comment: "Excellent tutor!",
     categories: {
       teaching: 5,
       punctuality: 5,
       communication: 5,
       preparation: 5,
       friendliness: 5
     },
     isAnonymous: false
   }
   ```

2. **GET /api/v1/reviews/tutor/:tutorId** - List reviews của tutor
3. **GET /api/v1/reviews/my-reviews** - Reviews của student
4. **PUT /api/v1/reviews/:reviewId** - Edit review
5. **DELETE /api/v1/reviews/:reviewId** - Delete review
6. **POST /api/v1/reviews/:reviewId/response** - Tutor trả lời review
7. **POST /api/v1/reviews/:reviewId/helpful** - Vote helpful
8. **POST /api/v1/reviews/:reviewId/report** - Report review

### Auto-update Rating Logic (Mongoose Hooks)

```javascript
// Review.js
reviewSchema.post('save', async function() {
  const reviews = await Review.find({ tutorProfile: this.tutorProfile });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  
  const avgCategories = {
    teaching: reviews.reduce((sum, r) => sum + r.categories.teaching, 0) / reviews.length,
    // ... tương tự cho 4 categories khác
  };
  
  await TutorProfile.updateOne(
    { _id: this.tutorProfile },
    { 
      rating: avgRating, 
      totalReviews: reviews.length,
      ratingCategories: avgCategories
    }
  );
});

// Tương tự cho post('findOneAndDelete') và post('findOneAndUpdate')
```

---

## 💬 Real-time Features

### Socket.IO Events

#### Chat System
- **Connection**: `io.on('connection')`
- **Join conversation**: `socket.emit('join-conversation', conversationId)`
- **Send message**: `socket.emit('send-message', { conversationId, content })`
- **Receive message**: `socket.on('new-message', callback)`
- **Typing indicator**: `socket.emit('typing', conversationId)`

#### WebRTC Video Calls
- **Join room**: `socket.emit('join-room', roomId)`
- **Offer**: `socket.emit('offer', { roomId, offer })`
- **Answer**: `socket.emit('answer', { roomId, answer })`
- **ICE candidates**: `socket.emit('ice-candidate', { roomId, candidate })`

#### Notifications
- **Real-time push**: Server emits `new-notification` to specific user
- Frontend listens: `socket.on('new-notification', updateUI)`

---

## 🎨 Frontend Architecture

### React Component Structure

```
App
├── Router
│   ├── Home (Landing Page)
│   ├── Auth
│   │   ├── Login
│   │   ├── Register
│   │   └── ForgotPassword
│   ├── Tutor
│   │   ├── TutorSearch (tìm gia sư)
│   │   ├── TutorProfile (chi tiết gia sư)
│   │   ├── TutorDashboard (dashboard gia sư)
│   │   └── TutorBookings (quản lý bookings)
│   ├── Student
│   │   ├── StudentBookings (lịch sử đặt lịch)
│   │   └── StudentDashboard
│   ├── Payment
│   │   ├── OrderSummary (review đơn hàng)
│   │   ├── PaymentSuccess
│   │   └── PaymentCancel
│   ├── Messages (chat)
│   ├── Profile (user profile)
│   ├── Admin
│   │   ├── AdminDashboard
│   │   ├── AdminTutors (duyệt gia sư)
│   │   ├── AdminUsers (quản lý users)
│   │   └── AdminContracts
│   └── Contract (hợp đồng điện tử)
└── Components
    ├── Navbar
    ├── Footer
    ├── ReviewModal
    ├── BookingCard
    └── NotificationDropdown
```

### State Management (Redux)

```javascript
// store.js
{
  auth: {
    user: { id, email, role, full_name, avatar },
    accessToken: "...",
    isAuthenticated: true
  },
  tutors: {
    list: [],
    selectedTutor: {},
    filters: { subject, city, priceRange }
  },
  notifications: {
    items: [],
    unreadCount: 5
  },
  bookings: {
    myBookings: [],
    loading: false
  }
}
```

### API Service Pattern

```javascript
// services/TutorService.js
import api from './api'; // Axios instance with interceptors

export const TutorService = {
  searchTutors: (filters) => api.get('/tutors/search', { params: filters }),
  getTutorById: (id) => api.get(`/tutors/${id}`),
  updateProfile: (data) => api.patch('/tutors/me', data),
  // ...
};
```

---

## 🔧 Core Features Implementation

### 1. Tutor Registration & Verification

**Flow**:
1. User registers with role="tutor"
2. Complete basic profile: POST `/api/v1/tutors/me`
3. Upload documents:
   - POST `/api/v1/tutor-verification/identity` (CCCD/CMND)
   - POST `/api/v1/tutor-verification/education` (Bằng cấp)
   - POST `/api/v1/tutor-verification/certificates` (Chứng chỉ)
4. Submit for approval: POST `/api/v1/tutors/me/submit`
5. Status changes: `draft` → `pending`
6. Admin reviews in `/admin/tutors` → Approve/Reject
7. Status becomes `approved` → Tutor can receive bookings

### 2. Tutor Search & Filtering

**Endpoint**: GET `/api/v1/tutors/search`

**Filters**:
```javascript
{
  subject: "Toán",
  city: "Hà Nội",
  mode: "online",
  minPrice: 100000,
  maxPrice: 500000,
  rating: 4,
  sortBy: "rating" // hoặc "price", "totalReviews"
}
```

**Query**:
```javascript
TutorProfile.find({
  status: "approved",
  "subjects.name": subject,
  city: city,
  teachModes: { $in: [mode] },
  sessionRate: { $gte: minPrice, $lte: maxPrice },
  rating: { $gte: rating }
})
.populate("user", "full_name avatar")
.sort({ [sortBy]: -1 })
```

### 3. Teaching Slot Management

**Tutor tạo slot**: POST `/api/v1/bookings/slots`
```javascript
{
  start: "2025-11-15T18:00:00Z",
  end: "2025-11-15T20:00:00Z",
  mode: "online",
  price: 200000,
  courseName: "Toán THPT - Ôn thi THPT QG",
  courseDescription: "...",
  maxStudents: 1
}
```

**Student book slot**: Payment flow → Webhook tạo Booking

### 4. Contract System (Electronic Signature)

**Flow**:
1. Student điền thông tin hợp đồng trước khi thanh toán
2. Student ký (canvas signature → base64)
3. Data gửi trong `metadata.contractData` và `metadata.studentSignature`
4. Webhook lưu vào `Booking.contractData` và `Booking.studentSignature`
5. Tutor có thể ký: POST `/api/v1/bookings/:id/contract`
   ```javascript
   {
     tutorSignature: "base64...",
     action: "sign"
   }
   ```
6. Sau khi cả 2 ký → `contractSigned: true`
7. Contract có số hợp đồng tự động: `contractNumber: "HD-YYYYMMDD-XXXX"`

### 5. Notification System

**Types**:
- `booking`: Thông báo về booking (created, accepted, rejected, cancelled, completed)
- `payment`: Thanh toán thành công/thất bại
- `review`: Review mới, tutor response
- `message`: Tin nhắn mới
- `system`: Thông báo hệ thống

**Creation**:
```javascript
// NotificationService.js
const notifyTutorBookingCreated = async (tutorUserId, bookingId, studentName) => {
  await Notification.create({
    recipient: tutorUserId,
    type: "info",
    category: "booking",
    title: "Yêu cầu đặt lịch mới",
    message: `Bạn có yêu cầu đặt lịch mới từ ${studentName}`,
    metadata: { bookingId, url: `/bookings/tutor` }
  });
  
  // Socket.IO push
  io.to(tutorUserId).emit('new-notification', {...});
};
```

**Frontend**:
- GET `/api/v1/notifications` - List notifications
- PATCH `/api/v1/notifications/:id/read` - Mark as read
- Real-time via Socket.IO

### 6. Dashboard & Statistics

**Learner Dashboard**: GET `/api/v1/dashboard/learner`
```javascript
{
  totalBookings: 15,
  completedBookings: 10,
  upcomingBookings: 2,
  totalSpent: 3000000,
  recentBookings: [...],
  favoriteТutors: [...]
}
```

**Tutor Dashboard**: GET `/api/v1/dashboard/tutor`
```javascript
{
  totalBookings: 50,
  completedBookings: 45,
  pendingBookings: 2,
  totalEarnings: 10000000, // Note: earnings tracking removed from escrow
  rating: 4.8,
  totalReviews: 30,
  upcomingSessions: [...]
}
```

**Admin Dashboard**: GET `/api/v1/dashboard/admin`
```javascript
{
  totalUsers: 500,
  totalTutors: 100,
  totalBookings: 1000,
  totalRevenue: 50000000,
  pendingVerifications: 5,
  activeUsers: 350,
  userGrowth: {...},
  bookingTrends: {...}
}
```

### 7. AI Chatbot (Optional)

**Endpoint**: POST `/api/v1/ai/chat`
```javascript
{
  message: "Tìm giúp tôi gia sư dạy Toán ở Hà Nội"
}
```

**Integration**: OpenAI API
```javascript
const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    { role: "system", content: "You are a tutor search assistant..." },
    { role: "user", content: message }
  ]
});
```

---

## 🚀 Deployment Guide

### Prerequisites

1. **MongoDB Atlas** (hoặc MongoDB self-hosted)
   - Tạo cluster
   - Whitelist IP
   - Lấy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/`

2. **Cloudinary Account**
   - Đăng ký tại cloudinary.com
   - Lấy: `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`

3. **PayOS Account** (Vietnam Payment Gateway)
   - Đăng ký tại payos.vn
   - Lấy: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`
   - Cấu hình webhook URL: `https://yourdomain.com/api/v1/payment/payos-webhook`

4. **Google OAuth Credentials**
   - Vào Google Cloud Console
   - Tạo OAuth 2.0 Client ID
   - Lấy: `GOOGLE_APP_CLIENT_ID`, `GOOGLE_APP_CLIENT_SECRET`
   - Redirect URI: `http://localhost:5000/google/redirect` (dev)

5. **Email Service (Nodemailer)**
   - Gmail account
   - Bật "Less secure app access" hoặc dùng App Password
   - Lấy: `MAIL_USERNAME`, `MAIL_PASSWORD`

6. **OpenAI API Key** (optional - for AI chat)
   - Đăng ký tại platform.openai.com
   - Lấy: `OPENAI_API_KEY`

### Environment Variables

**Backend (.env)**:
```properties
# Database
URI_DB=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority

# Server
PORT=5000
NODE_ENV=production

# JWT
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_KEY=your_api_key
CLOUDINARY_SECRET=your_api_secret

# PayOS
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key

# Google OAuth
GOOGLE_APP_CLIENT_ID=your_google_client_id
GOOGLE_APP_CLIENT_SECRET=your_google_client_secret
GOOGLE_APP_CLIENT_REDIRECT_LOGIN=http://localhost:5000/google/redirect

# Email
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_email@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# AI (Optional)
GEMINI_KEY=your_gemini_key
CHATAI_PROVIDER=gemini
```

**Frontend (.env)**:
```properties
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Installation Steps

#### Backend Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd WDP-LM/backend

# 2. Install dependencies
npm install

# 3. Create .env file (see above)
cp .env.example .env
# Edit .env với các credentials của bạn

# 4. Test MongoDB connection
node scripts/checkDatabase.js

# 5. Test PayOS integration
node scripts/checkPayOS.js

# 6. (Optional) Seed test data
node scripts/seedTestData.js

# 7. Start server
npm start           # Production
npm run dev         # Development (nodemon)
```

#### Frontend Setup

```bash
cd WDP-LM/frontend

# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Edit REACT_APP_API_URL

# 3. Start development server
npm start

# 4. Build for production
npm run build
# Files in /build folder
```

### Production Deployment

#### Option 1: VPS (Ubuntu)

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 (Process Manager)
sudo npm install -g pm2

# 3. Clone & setup backend
git clone <repo-url>
cd WDP-LM/backend
npm install --production
# Setup .env

# 4. Start with PM2
pm2 start server.js --name learnmate-api
pm2 save
pm2 startup

# 5. Nginx reverse proxy
sudo apt install nginx

# /etc/nginx/sites-available/learnmate
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        root /var/www/learnmate/frontend/build;
        try_files $uri /index.html;
    }
}

sudo ln -s /etc/nginx/sites-available/learnmate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 6. SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### Option 2: Vercel (Frontend) + Railway (Backend)

**Frontend**:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

**Backend**:
1. Tạo account tại railway.app
2. Connect GitHub repo
3. Set environment variables
4. Deploy

#### Option 3: Docker

**Dockerfile (Backend)**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    env_file:
      - ./backend/.env
    depends_on:
      - mongo
  
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api/v1
  
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

```bash
docker-compose up -d
```

---

## 🧪 Testing

### Backend Tests

```bash
# Unit tests (với Jest)
npm test

# API tests (với Postman/Newman)
newman run tests/LearnMate.postman_collection.json

# Smoke tests
node scripts/smokeBookingFlow.js
node scripts/smokeEndToEndAccept.js
```

### Test Cases Coverage

1. **Authentication**:
   - Register với email/password ✅
   - Login với email/password ✅
   - Google OAuth ✅
   - Refresh token ✅
   - Password reset ✅

2. **Tutor Management**:
   - Create tutor profile ✅
   - Upload verification documents ✅
   - Submit for approval ✅
   - Admin approve/reject ✅
   - Update profile ✅
   - Create teaching slots ✅

3. **Booking Flow**:
   - Student book slot → Payment ✅
   - PayOS webhook → Create booking ✅
   - Tutor receive notification ✅
   - Tutor accept/reject booking ✅
   - Complete booking ✅
   - Cancel booking ✅

4. **Payment**:
   - Create payment link ✅
   - Handle webhook success ✅
   - Handle webhook failure ✅
   - Verify payment status ✅

5. **Review System**:
   - Create review after completed booking ✅
   - Update tutor rating automatically ✅
   - Edit/delete review ✅
   - Tutor response to review ✅

6. **Real-time**:
   - Socket.IO chat ✅
   - Notifications ✅
   - WebRTC video call ✅

---

## 📱 API Documentation

### Base URL
```
Development: http://localhost:5000/api/v1
Production: https://yourdomain.com/api/v1
```

### Authentication Headers
```
Authorization: Bearer <accessToken>
```

### Complete API Endpoints

#### Auth (`/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Đăng ký | No |
| POST | `/login` | Đăng nhập | No |
| POST | `/logout` | Đăng xuất | Yes |
| POST | `/refresh-token` | Làm mới token | No |
| POST | `/forgot-password` | Quên mật khẩu | No |
| POST | `/reset-password` | Reset mật khẩu | No |
| GET | `/google` | Google OAuth | No |
| GET | `/google/redirect` | Google callback | No |
| POST | `/verify-email` | Xác thực email | No |

#### Users (`/users`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/me` | Thông tin user | Yes |
| PATCH | `/me` | Cập nhật profile | Yes |
| POST | `/me/avatar` | Upload avatar | Yes |

#### Tutors (`/tutors`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/search` | Tìm gia sư | No |
| GET | `/:id` | Chi tiết gia sư | No |
| GET | `/me` | Profile gia sư hiện tại | Yes (Tutor) |
| PATCH | `/me` | Cập nhật profile | Yes (Tutor) |
| PATCH | `/me/basic` | Cập nhật thông tin cơ bản | Yes (Tutor) |
| PATCH | `/me/expertise` | Cập nhật chuyên môn | Yes (Tutor) |
| PUT | `/me/availability` | Cập nhật lịch rảnh | Yes (Tutor) |
| POST | `/me/submit` | Gửi duyệt hồ sơ | Yes (Tutor) |
| GET | `/:id/availability` | Xem lịch rảnh | No |
| GET | `/:id/courses` | Khóa học của tutor | No |

#### Bookings (`/bookings`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Tạo booking | Yes |
| GET | `/me` | List bookings | Yes |
| GET | `/date-range` | Bookings theo ngày | Yes |
| GET | `/stats` | Thống kê | Yes |
| POST | `/:id/decision` | Accept/Reject | Yes (Tutor) |
| POST | `/:id/complete` | Hoàn thành | Yes |
| POST | `/:id/cancel` | Hủy booking | Yes |
| POST | `/:id/contract` | Ký hợp đồng | Yes |
| POST | `/:id/payment-success` | Xác nhận thanh toán | Yes |

#### Teaching Slots (`/bookings/slots`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/slots` | Tạo slot | Yes (Tutor) |
| GET | `/slots/me` | Slots của tutor | Yes (Tutor) |
| GET | `/slots/public` | Slots công khai | No |
| GET | `/slots/:id` | Chi tiết slot | No |
| DELETE | `/slots/:id` | Xóa slot | Yes (Tutor) |
| POST | `/slots/:slotId/book` | Book slot | Yes |

#### Payments (`/payment`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/create-payment-link` | Tạo link thanh toán | Yes |
| POST | `/payos-webhook` | PayOS webhook | No |
| GET | `/` | List payments | Yes |
| GET | `/verify/:orderCode` | Verify payment | No |
| GET | `/:id` | Chi tiết payment | Yes |
| POST | `/:id/cancel` | Hủy payment | Yes |

#### Reviews (`/reviews`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Tạo review | Yes |
| GET | `/tutor/:tutorId` | Reviews của tutor | No |
| GET | `/my-reviews` | Reviews của tôi | Yes |
| PUT | `/:reviewId` | Sửa review | Yes |
| DELETE | `/:reviewId` | Xóa review | Yes |
| POST | `/:reviewId/response` | Tutor trả lời | Yes (Tutor) |
| POST | `/:reviewId/helpful` | Vote helpful | Yes |
| POST | `/:reviewId/report` | Báo cáo review | Yes |

#### Notifications (`/notifications`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List notifications | Yes |
| PATCH | `/:id/read` | Đánh dấu đã đọc | Yes |
| DELETE | `/:id` | Xóa notification | Yes |

#### Chat (`/chat`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/conversations` | List conversations | Yes |
| POST | `/conversations` | Tạo conversation | Yes |
| GET | `/conversations/:id/messages` | Tin nhắn | Yes |
| POST | `/conversations/:id/messages` | Gửi tin nhắn | Yes |

#### Admin (`/admin`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users` | List users | Yes (Admin) |
| PATCH | `/users/:id/ban` | Ban user | Yes (Admin) |
| GET | `/tutors` | List tutors | Yes (Admin) |
| PATCH | `/tutors/:id/approve` | Duyệt tutor | Yes (Admin) |
| PATCH | `/tutors/:id/reject` | Từ chối tutor | Yes (Admin) |
| GET | `/bookings` | All bookings | Yes (Admin) |
| GET | `/payments` | All payments | Yes (Admin) |
| GET | `/stats` | Admin stats | Yes (Admin) |

#### Admin Contracts (`/admin-contracts`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List contracts | Yes (Admin) |
| GET | `/:id` | Chi tiết contract | Yes (Admin) |
| GET | `/user/:userId` | Contracts của user | Yes (Admin) |
| GET | `/stats/overview` | Thống kê contracts | Yes (Admin) |
| GET | `/export/csv` | Export CSV | Yes (Admin) |
| PATCH | `/:id/status` | Cập nhật status | Yes (Admin) |
| DELETE | `/:id` | Xóa contract | Yes (Admin) |

#### Dashboard (`/dashboard`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/learner` | Dashboard học viên | Yes |
| GET | `/tutor` | Dashboard gia sư | Yes (Tutor) |
| GET | `/admin` | Dashboard admin | Yes (Admin) |
| GET | `/stats` | Thống kê chung | No |

#### AI (`/ai`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/chat` | Chat với AI | Yes |

---

## 🛠️ Development Guidelines

### Code Style
- **Backend**: Node.js best practices, async/await, error handling
- **Frontend**: React Hooks, functional components
- **Naming**: camelCase (JS), kebab-case (files)

### Error Handling Pattern

```javascript
// Backend
try {
  const result = await someAsyncOperation();
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Error in someOperation:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Lỗi xử lý',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

// Frontend
try {
  const data = await TutorService.searchTutors(filters);
  setTutors(data.tutors);
} catch (error) {
  toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
}
```

### Database Indexing

```javascript
// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, status: 1 });

TutorProfileSchema.index({ user: 1 }, { unique: true });
TutorProfileSchema.index({ status: 1, rating: -1 });
TutorProfileSchema.index({ 'subjects.name': 1 });

BookingSchema.index({ student: 1, status: 1 });
BookingSchema.index({ tutorProfile: 1, status: 1 });
BookingSchema.index({ slotId: 1 });

ReviewSchema.index({ booking: 1 }, { unique: true });
ReviewSchema.index({ tutorProfile: 1 });

PaymentSchema.index({ orderCode: 1 }, { unique: true });
PaymentSchema.index({ userId: 1 });
```

### Security Best Practices

1. **Helmet.js**: Protect HTTP headers
2. **Rate Limiting**: Prevent DDoS
3. **Input Validation**: Sanitize user input
4. **CORS**: Whitelist frontend domain
5. **Environment Variables**: Never commit .env
6. **Password Hashing**: bcryptjs (10 rounds)
7. **JWT Expiry**: Short-lived access tokens
8. **HTTPS**: Always use SSL in production

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot connect to MongoDB"
- Check URI_DB in .env
- Whitelist IP in MongoDB Atlas
- Check network/firewall

#### 2. "PayOS webhook not working"
- Check webhook URL in PayOS Dashboard
- Ensure server is publicly accessible (use ngrok for local)
- Check `POST /api/v1/payment/payos-webhook` logs

#### 3. "Tutor không thấy booking sau khi thanh toán"
- Check Payment status → phải là "PAID"
- Check Booking được tạo chưa → query `db.bookings.find({ slotId })`
- Check TutorProfile status → phải là "approved"
- Check populate trong GET `/bookings/me`

#### 4. "Review không update rating"
- Check Mongoose hooks trong Review.js
- Ensure `post('save')`, `post('findOneAndDelete')`, `post('findOneAndUpdate')` có chạy
- Check TutorProfile.rating sau khi create review

#### 5. "Socket.IO không kết nối"
- Check CORS settings trong server.js
- Check client URL: `const socket = io('http://localhost:5000')`
- Check firewall/proxy

#### 6. "Cloudinary upload failed"
- Check credentials in .env
- Check file size limit (10MB default)
- Check file type (images only)

---

## 📈 Future Enhancements

### Planned Features
1. **Mobile App**: React Native version
2. **Advanced Search**: Elasticsearch integration
3. **Group Classes**: Multiple students per session
4. **Subscription Plans**: Monthly packages
5. **Referral Program**: Earn credits
6. **Advanced Analytics**: Charts & reports
7. **Multi-language**: i18n support
8. **Push Notifications**: Firebase Cloud Messaging
9. **Video Recording**: Save & playback sessions
10. **Gamification**: Badges, achievements

---

## 📝 License & Credits

- **License**: MIT (or your choice)
- **Authors**: [Your Team]
- **Contact**: support@learnmate.vn

---

## 🎓 Summary for Developers

**To rebuild this system from scratch**, you need:

### Must-Have Skills
1. **Backend**: Node.js, Express, MongoDB, Mongoose
2. **Frontend**: React, Redux, React Router
3. **Real-time**: Socket.IO, WebRTC
4. **Payment**: Integration với payment gateway
5. **Authentication**: JWT, OAuth 2.0
6. **File Upload**: Cloudinary/S3
7. **Deployment**: Linux, Nginx, PM2

### Core Technologies
- **MERN Stack**: MongoDB + Express + React + Node.js
- **Socket.IO**: Real-time chat & notifications
- **PayOS**: Vietnam payment gateway
- **Cloudinary**: Image/file hosting
- **JWT**: Stateless authentication
- **Mongoose**: ODM for MongoDB

### Database Design Principles
- **Normalization**: Separate collections cho Users, TutorProfiles, Bookings
- **Referencing**: Use ObjectId references, populate when needed
- **Indexing**: Index frequently queried fields
- **Aggregation**: Use for complex stats/reports

### Key Implementation Details
1. **Payment webhook** tạo Booking tự động
2. **Review hooks** tự động update TutorProfile rating
3. **Socket.IO** push notifications real-time
4. **Populate chains** để lấy nested data
5. **Middleware** để protect routes (auth, role-based)

---

**Good luck building LearnMate! 🚀**
