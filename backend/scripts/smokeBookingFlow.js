/*
  Smoke test: booking flow (pending → tutor notified) via webhook
  - Creates test users, tutor profile, open slot
  - Creates Payment and triggers receiveWebhook to create pending booking
  - Verifies in-app notification for tutor
  How to run:
    node backend/scripts/smokeBookingFlow.js
*/
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = require('../src/models/User');
const TutorProfile = require('../src/models/TutorProfile');
const TeachingSlot = require('../src/models/TeachingSlot');
const Payment = require('../src/models/Payment');
const Notification = require('../src/models/Notification');
const Booking = require('../src/models/Booking');

const { receiveWebhook } = require('../src/controllers/paymentController');

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.DB_URL || process.env.MONGO_URI || process.env.DB_HOST || process.env.URI_DB;
  if (!mongoUri) {
    console.error('❌ DB URI not found in env (tried MONGODB_URI/DB_URL/MONGO_URI/DB_HOST/URI_DB)');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to DB');

  // Create test users
  const ts = Date.now();
  const student = await User.create({
    full_name: `Student Test ${ts}`,
    email: `student_${ts}@example.com`,
    password_hash: 'x',
    role: 'learner',
    status: 'active',
  });
  const tutor = await User.create({
    full_name: `Tutor Test ${ts}`,
    email: `tutor_${ts}@example.com`,
    password_hash: 'x',
    role: 'tutor',
    status: 'active',
  });
  console.log('👥 Users:', { student: student._id, tutor: tutor._id });

  // Create tutor profile (approved)
  const tProfile = await TutorProfile.create({
    user: tutor._id,
    title: 'Toán cấp 2',
    subjects: [{ name: 'Toán', level: 'Cấp 2', price: 100000 }],
    sessionRate: 100000,
    status: 'approved',
    teachModes: ['online', 'offline'],
    availability: [
      { dayOfWeek: 1, start: '08:00', end: '17:00' }, // Monday
      { dayOfWeek: 2, start: '08:00', end: '17:00' }, // Tuesday
    ],
  });
  console.log('🎓 TutorProfile:', tProfile._id.toString());

  // Create an open slot in the future
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const slot = await TeachingSlot.create({
    tutorProfile: tProfile._id,
    start,
    end,
    mode: 'online',
    price: 100000,
    courseName: 'Khóa học: Toán - smoke',
    status: 'open',
  });
  console.log('🗓️ Slot:', slot._id.toString());

  // Create payment record for the student & slot
  const orderCode = `FLOWTEST_${Date.now()}`;
  await Payment.create({
    orderCode,
    vnp_txnref: orderCode,
    userId: student._id,
    slotId: slot._id,
    amount: 100000,
    productName: 'Khóa học: Toán - smoke',
    status: 'PENDING',
  });
  console.log('💳 Payment created with orderCode:', orderCode);

  // Trigger webhook to simulate PayOS success → should create pending booking + tutor notification
  const req = {
    body: {
      code: '00',
      data: {
        orderCode,
        status: 'PAID',
      },
    },
    headers: {},
    method: 'POST',
  };
  const res = {
    status(code) {
      this.statusCode = code; return this;
    },
    json(payload) {
      console.log('🔁 Webhook response:', this.statusCode || 200, payload);
    },
  };
  await receiveWebhook(req, res);

  // Validate booking
  const booking = await Booking.findOne({ slotId: slot._id });
  console.log('📦 Booking created:', booking ? booking._id.toString() : null, 'status=', booking?.status);

  // Validate tutor notification
  const notifCount = await Notification.countDocuments({ recipient: tutor._id, type: 'booking_created' });
  console.log('🔔 Tutor notifications booking_created:', notifCount);

  // Basic assertions
  const ok = booking && booking.status === 'pending' && notifCount > 0;
  console.log(ok ? '✅ Smoke test PASSED' : '❌ Smoke test FAILED');

  // Cleanup hint (we keep data for manual inspection)
  console.log('ℹ️ Test data left in DB for inspection. You can delete later.');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});


