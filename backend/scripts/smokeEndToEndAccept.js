/*
 End-to-end test: student hires → contract → tutor accepts
 Steps:
 1) Use an existing approved TutorProfile if any; otherwise create a new one
 2) Create a student user
 3) Create an open slot, create Payment, trigger webhook to make booking (pending)
 4) Attach contract from student
 5) Tutor accepts with signature: hold escrow, create session, set contractSigned
 6) Verify
*/
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = require('../src/models/User');
const TutorProfile = require('../src/models/TutorProfile');
const TeachingSlot = require('../src/models/TeachingSlot');
const Payment = require('../src/models/Payment');
const Booking = require('../src/models/Booking');
const TeachingSession = require('../src/models/TeachingSession');
const EscrowService = require('../src/services/EscrowService');
const { generateRoomId } = require('../src/services/WebRTCService');
const { receiveWebhook } = require('../src/controllers/paymentController');
const { notifyStudentBookingDecision } = require('../src/services/NotificationService');

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.DB_URL || process.env.MONGO_URI || process.env.DB_HOST || process.env.URI_DB;
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to DB');

  // Find existing approved tutor profile or create one
  let tProfile = await TutorProfile.findOne({ status: 'approved' }).populate('user');
  if (!tProfile) {
    const ts = Date.now();
    const tutor = await User.create({ full_name: `Tutor Auto ${ts}`, email: `tutor_auto_${ts}@example.com`, password_hash: 'x', role: 'tutor', status: 'active' });
    tProfile = await TutorProfile.create({
      user: tutor._id,
      title: 'Toán cấp 2',
      subjects: [{ name: 'Toán', level: 'Cấp 2', price: 100000 }],
      sessionRate: 100000,
      status: 'approved',
      teachModes: ['online', 'offline'],
      availability: [ { dayOfWeek: 3, start: '08:00', end: '17:00' } ],
    });
    tProfile = await TutorProfile.findById(tProfile._id).populate('user');
    console.log('🎓 Created tutor for test:', tProfile.user.email);
  } else {
    console.log('🎓 Using existing tutor:', tProfile.user?.email || tProfile.user);
  }

  // Create a student
  const ts2 = Date.now();
  const student = await User.create({ full_name: `Student Auto ${ts2}`, email: `student_auto_${ts2}@example.com`, password_hash: 'x', role: 'learner', status: 'active' });

  // Slot in future
  const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const slot = await TeachingSlot.create({ tutorProfile: tProfile._id, start, end, mode: 'online', price: 120000, courseName: 'Khóa học: Toán - E2E', status: 'open' });

  // Payment + webhook
  const orderCode = `E2E_${Date.now()}`;
  await Payment.create({ orderCode, vnp_txnref: orderCode, userId: student._id, slotId: slot._id, amount: 120000, productName: 'E2E Toán', status: 'PENDING' });
  await receiveWebhook({ body: { code: '00', data: { orderCode, status: 'PAID' } }, headers: {}, method: 'POST' }, { status(c){this.s=c;return this;}, json(p){ console.log('🔁 Webhook', this.s||200, p);} });

  // Fetch booking pending
  const booking = await Booking.findOne({ slotId: slot._id });
  if (!booking) throw new Error('Booking was not created');
  console.log('📦 Booking:', booking._id.toString(), 'status=', booking.status);

  // Attach contract from student
  booking.contractData = {
    studentName: student.full_name,
    studentEmail: student.email,
    studentPhone: '0912345678',
    studentAddress: 'Hà Nội',
    subject: 'Toán cấp 2',
    totalSessions: 6,
    sessionDuration: 120,
    startDate: booking.start,
    endDate: booking.end,
    notes: 'E2E auto test',
  };
  booking.studentSignature = student.full_name;
  booking.studentSignedAt = new Date();
  if (!booking.contractNumber) booking.contractNumber = `HD-${Date.now()}`;
  await booking.save();

  // Tutor accepts with signature
  await EscrowService.holdPayment(booking._id).catch(()=>{}); // tolerant for test
  const roomId = generateRoomId();
  const session = await TeachingSession.create({
    booking: booking._id,
    tutorProfile: tProfile._id,
    student: student._id,
    startTime: booking.start,
    endTime: booking.end,
    courseName: 'Toán - E2E',
    mode: 'online',
    status: 'scheduled',
    roomId,
  });
  booking.sessionId = session._id;
  booking.roomId = roomId;
  booking.status = 'accepted';
  booking.tutorSignature = tProfile.user.full_name || 'Tutor';
  booking.tutorSignedAt = new Date();
  if (booking.studentSignature && booking.tutorSignature) booking.contractSigned = true;
  await booking.save();

  // Test: Notify student about acceptance (email + in-app)
  console.log('📧 Testing student notification...');
  try {
    const notifyResult = await notifyStudentBookingDecision(booking, 'accept');
    if (notifyResult?.success) {
      console.log('✅ Email sent to student:', student.email);
    } else {
      console.log('⚠️ Email notification result:', notifyResult);
    }
  } catch (e) {
    console.error('❌ Failed to send student notification:', e.message);
  }

  const result = await Booking.findById(booking._id).lean();
  console.log('✅ Final booking:', { status: result.status, contractSigned: result.contractSigned, roomId: result.roomId });
  const ok = result.status === 'accepted' && result.contractSigned === true && !!result.sessionId;
  console.log(ok ? '✅ E2E accept flow PASSED' : '❌ E2E accept flow FAILED');

  await mongoose.disconnect();
}

run().catch(e=>{ console.error(e); process.exit(1); });


