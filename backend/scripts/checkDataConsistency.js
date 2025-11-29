const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Load models
require('../src/models/User');
require('../src/models/TutorProfile');
require('../src/models/TeachingSlot');
require('../src/models/Booking');
require('../src/models/Payment');

async function checkDataConsistency() {
  try {
    await mongoose.connect(process.env.URI_DB);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User');
    const TutorProfile = mongoose.model('TutorProfile');
    const TeachingSlot = mongoose.model('TeachingSlot');
    const Booking = mongoose.model('Booking');
    const Payment = mongoose.model('Payment');

    console.log('═'.repeat(100));
    console.log('🔍 KIỂM TRA TÍNH NHẤT QUÁN DỮ LIỆU GIỮA CÁC BẢNG');
    console.log('═'.repeat(100));

    // ==================== LUỒNG 1: LEARNER → TUTOR ====================
    console.log('\n📚 LUỒNG 1: LEARNER → TUTOR');
    console.log('─'.repeat(100));

    const allUsers = await User.find({}).lean();
    const allProfiles = await TutorProfile.find({}).lean();
    const allSlots = await TeachingSlot.find({}).lean();

    console.log(`\n📊 Thống kê tổng quan:`);
    console.log(`   Users: ${allUsers.length}`);
    console.log(`   TutorProfiles: ${allProfiles.length}`);
    console.log(`   TeachingSlots: ${allSlots.length}`);

    // Check 1: Users vs TutorProfiles
    console.log(`\n✓ KIỂM TRA 1: Liên kết users ↔ tutor_profiles`);
    console.log('─'.repeat(100));

    const userMap = new Map(allUsers.map(u => [u._id.toString(), u]));
    const profileMap = new Map(allProfiles.map(p => [p.user.toString(), p]));

    // Tutors không có profile
    const tutorsWithoutProfile = allUsers.filter(u => 
      u.role === 'tutor' && !profileMap.has(u._id.toString())
    );

    // Learners có profile
    const learnersWithProfile = allUsers.filter(u => 
      u.role === 'learner' && profileMap.has(u._id.toString())
    );

    // Profiles không có user
    const orphanedProfiles = allProfiles.filter(p => 
      !userMap.has(p.user.toString())
    );

    // Profiles có user nhưng role không khớp với status
    const inconsistentRoleStatus = allProfiles.filter(p => {
      const user = userMap.get(p.user.toString());
      if (!user) return false;
      // Nếu profile approved thì user phải là tutor
      if (p.status === 'approved' && user.role !== 'tutor') return true;
      // Nếu profile pending/draft thì user có thể là learner hoặc tutor
      return false;
    });

    console.log(`   ✅ Tutors có profile: ${allUsers.filter(u => u.role === 'tutor' && profileMap.has(u._id.toString())).length}`);
    console.log(`   ⚠️  Tutors KHÔNG CÓ profile: ${tutorsWithoutProfile.length}`);
    if (tutorsWithoutProfile.length > 0) {
      tutorsWithoutProfile.forEach(u => {
        console.log(`      - ${u.email} (ID: ${u._id})`);
      });
    }

    console.log(`   ℹ️  Learners có profile (đã nộp đơn): ${learnersWithProfile.length}`);
    if (learnersWithProfile.length > 0) {
      learnersWithProfile.forEach(u => {
        const profile = profileMap.get(u._id.toString());
        console.log(`      - ${u.email} - Status: ${profile.status}`);
      });
    }

    console.log(`   ❌ Profiles ORPHANED (user đã bị xóa): ${orphanedProfiles.length}`);
    if (orphanedProfiles.length > 0) {
      orphanedProfiles.forEach(p => {
        console.log(`      - Profile ID: ${p._id}, User ID: ${p.user}`);
      });
    }

    console.log(`   ⚠️  Profile approved NHƯNG user role ≠ tutor: ${inconsistentRoleStatus.length}`);
    if (inconsistentRoleStatus.length > 0) {
      inconsistentRoleStatus.forEach(p => {
        const user = userMap.get(p.user.toString());
        console.log(`      - ${user.email} - Profile: ${p.status}, User role: ${user.role}`);
      });
    }

    // Check 2: TutorProfiles vs TeachingSlots
    console.log(`\n✓ KIỂM TRA 2: Liên kết tutor_profiles ↔ teaching_slots`);
    console.log('─'.repeat(100));

    const profileIdMap = new Map(allProfiles.map(p => [p._id.toString(), p]));
    const slotsByProfile = new Map();
    
    allSlots.forEach(slot => {
      const profileId = slot.tutorProfile.toString();
      if (!slotsByProfile.has(profileId)) {
        slotsByProfile.set(profileId, []);
      }
      slotsByProfile.get(profileId).push(slot);
    });

    // Profiles không có slot
    const profilesWithoutSlots = allProfiles.filter(p => 
      !slotsByProfile.has(p._id.toString()) && p.status === 'approved'
    );

    // Slots không có profile
    const slotsWithoutProfile = allSlots.filter(s => 
      !profileIdMap.has(s.tutorProfile.toString())
    );

    console.log(`   ✅ Profiles có teaching slots: ${allProfiles.filter(p => slotsByProfile.has(p._id.toString())).length}`);
    console.log(`   ⚠️  Profiles APPROVED nhưng chưa có slot: ${profilesWithoutSlots.length}`);
    if (profilesWithoutSlots.length > 0) {
      profilesWithoutSlots.slice(0, 5).forEach(p => {
        const user = userMap.get(p.user.toString());
        console.log(`      - ${user?.email || 'N/A'} (Profile ID: ${p._id})`);
      });
      if (profilesWithoutSlots.length > 5) {
        console.log(`      ... và ${profilesWithoutSlots.length - 5} profiles khác`);
      }
    }

    console.log(`   ❌ Slots ORPHANED (profile không tồn tại): ${slotsWithoutProfile.length}`);
    if (slotsWithoutProfile.length > 0) {
      slotsWithoutProfile.forEach(s => {
        console.log(`      - Slot ID: ${s._id}, Profile ID: ${s.tutorProfile}`);
      });
    }

    // ==================== LUỒNG 2: BOOKING & PAYMENT ====================
    console.log('\n\n📚 LUỒNG 2: BOOKING & PAYMENT');
    console.log('─'.repeat(100));

    const allBookings = await Booking.find({}).lean();
    const allPayments = await Payment.find({}).lean();

    console.log(`\n📊 Thống kê tổng quan:`);
    console.log(`   Bookings: ${allBookings.length}`);
    console.log(`   Payments: ${allPayments.length}`);

    // Check 3: Payments vs Bookings
    console.log(`\n✓ KIỂM TRA 3: Liên kết payments ↔ bookings`);
    console.log('─'.repeat(100));

    const bookingMap = new Map(allBookings.map(b => [b._id.toString(), b]));
    const paymentsBySlot = new Map();
    
    allPayments.forEach(payment => {
      if (payment.slotId) {
        const slotId = payment.slotId.toString();
        if (!paymentsBySlot.has(slotId)) {
          paymentsBySlot.set(slotId, []);
        }
        paymentsBySlot.get(slotId).push(payment);
      }
    });

    // Payments không có slotId
    const paymentsWithoutSlot = allPayments.filter(p => !p.slotId);

    // Payments có slotId nhưng không có booking tương ứng
    const paymentsWithoutBooking = allPayments.filter(p => {
      if (!p.slotId) return false;
      const slotId = p.slotId.toString();
      return !allBookings.some(b => b.slot?.toString() === slotId);
    });

    // Bookings không có payment
    const bookingsWithoutPayment = allBookings.filter(b => {
      if (!b.slot) return false;
      const slotId = b.slot.toString();
      return !allPayments.some(p => p.slotId?.toString() === slotId);
    });

    console.log(`   ✅ Payments CÓ slotId: ${allPayments.filter(p => p.slotId).length}`);
    console.log(`   ⚠️  Payments KHÔNG CÓ slotId: ${paymentsWithoutSlot.length}`);
    if (paymentsWithoutSlot.length > 0) {
      console.log(`      → Đây là lỗi NGHIÊM TRỌNG - Payment không thể tạo booking!`);
      paymentsWithoutSlot.slice(0, 3).forEach(p => {
        console.log(`      - Payment ID: ${p._id}, OrderCode: ${p.orderCode}, Status: ${p.status}`);
      });
    }

    console.log(`   ⚠️  Payments PAID nhưng chưa có booking: ${paymentsWithoutBooking.filter(p => p.status === 'PAID').length}`);
    if (paymentsWithoutBooking.filter(p => p.status === 'PAID').length > 0) {
      console.log(`      → Webhook có thể đã lỗi khi tạo booking!`);
      paymentsWithoutBooking.filter(p => p.status === 'PAID').slice(0, 3).forEach(p => {
        console.log(`      - Payment ID: ${p._id}, SlotID: ${p.slotId}, Status: ${p.status}`);
      });
    }

    console.log(`   ℹ️  Bookings chưa có payment: ${bookingsWithoutPayment.length}`);
    if (bookingsWithoutPayment.length > 0) {
      console.log(`      → Có thể là booking thủ công hoặc test data`);
    }

    // Check 4: TeachingSlots vs Bookings
    console.log(`\n✓ KIỂM TRA 4: Liên kết teaching_slots ↔ bookings`);
    console.log('─'.repeat(100));

    const slotMap = new Map(allSlots.map(s => [s._id.toString(), s]));
    const bookingsBySlot = new Map();
    
    allBookings.forEach(booking => {
      if (booking.slot) {
        const slotId = booking.slot.toString();
        if (!bookingsBySlot.has(slotId)) {
          bookingsBySlot.set(slotId, []);
        }
        bookingsBySlot.get(slotId).push(booking);
      }
    });

    // Slots đã booked nhưng không có booking record
    const bookedSlotsWithoutBooking = allSlots.filter(s => 
      s.status === 'booked' && !bookingsBySlot.has(s._id.toString())
    );

    // Slots status='open' nhưng có booking
    const openSlotsWithBooking = allSlots.filter(s => 
      s.status === 'open' && bookingsBySlot.has(s._id.toString())
    );

    // Bookings không có slot
    const bookingsWithoutSlot = allBookings.filter(b => 
      !b.slot || !slotMap.has(b.slot.toString())
    );

    console.log(`   ✅ Slots status=booked CÓ booking: ${allSlots.filter(s => s.status === 'booked' && bookingsBySlot.has(s._id.toString())).length}`);
    console.log(`   ⚠️  Slots status=booked NHƯNG không có booking record: ${bookedSlotsWithoutBooking.length}`);
    if (bookedSlotsWithoutBooking.length > 0) {
      console.log(`      → Trạng thái slot không đồng bộ!`);
      bookedSlotsWithoutBooking.forEach(s => {
        console.log(`      - Slot ID: ${s._id}, Course: ${s.courseName}, Status: ${s.status}`);
      });
    }

    console.log(`   ⚠️  Slots status=open NHƯNG có booking: ${openSlotsWithBooking.length}`);
    if (openSlotsWithBooking.length > 0) {
      console.log(`      → Slot nên được đổi thành 'booked'!`);
      openSlotsWithBooking.forEach(s => {
        console.log(`      - Slot ID: ${s._id}, Course: ${s.courseName}`);
      });
    }

    console.log(`   ❌ Bookings KHÔNG CÓ slot: ${bookingsWithoutSlot.length}`);
    if (bookingsWithoutSlot.length > 0) {
      bookingsWithoutSlot.forEach(b => {
        console.log(`      - Booking ID: ${b._id}, Slot: ${b.slot || 'NULL'}`);
      });
    }

    // Check 5: Users (learner) vs Bookings
    console.log(`\n✓ KIỂM TRA 5: Liên kết users (learner) ↔ bookings`);
    console.log('─'.repeat(100));

    const bookingsByUser = new Map();
    allBookings.forEach(booking => {
      if (booking.student) {
        const userId = booking.student.toString();
        if (!bookingsByUser.has(userId)) {
          bookingsByUser.set(userId, []);
        }
        bookingsByUser.get(userId).push(booking);
      }
    });

    const bookingsWithoutUser = allBookings.filter(b => 
      !b.student || !userMap.has(b.student.toString())
    );

    console.log(`   ✅ Bookings có user hợp lệ: ${allBookings.filter(b => b.student && userMap.has(b.student.toString())).length}`);
    console.log(`   ❌ Bookings KHÔNG CÓ user hoặc user đã bị xóa: ${bookingsWithoutUser.length}`);
    if (bookingsWithoutUser.length > 0) {
      bookingsWithoutUser.forEach(b => {
        console.log(`      - Booking ID: ${b._id}, Student: ${b.student || 'NULL'}`);
      });
    }

    // ==================== TỔNG KẾT ====================
    console.log('\n\n═'.repeat(100));
    console.log('📊 TỔNG KẾT CÁC VẤN ĐỀ CẦN XỬ LÝ');
    console.log('═'.repeat(100));

    let issueCount = 0;

    if (tutorsWithoutProfile.length > 0) {
      issueCount++;
      console.log(`\n❌ VẤN ĐỀ ${issueCount}: ${tutorsWithoutProfile.length} tutors không có profile`);
      console.log(`   → Cần tạo TutorProfile cho các user này hoặc đổi role về learner`);
    }

    if (orphanedProfiles.length > 0) {
      issueCount++;
      console.log(`\n❌ VẤN ĐỀ ${issueCount}: ${orphanedProfiles.length} profiles không có user (orphaned)`);
      console.log(`   → Cần xóa các profile này khỏi DB`);
    }

    if (inconsistentRoleStatus.length > 0) {
      issueCount++;
      console.log(`\n❌ VẤN ĐỀ ${issueCount}: ${inconsistentRoleStatus.length} profiles approved nhưng user role không phải tutor`);
      console.log(`   → Cần cập nhật role trong bảng users thành 'tutor'`);
    }

    if (slotsWithoutProfile.length > 0) {
      issueCount++;
      console.log(`\n❌ VẤN ĐỀ ${issueCount}: ${slotsWithoutProfile.length} teaching slots không có profile (orphaned)`);
      console.log(`   → Cần xóa các slot này khỏi DB`);
    }

    if (paymentsWithoutSlot.length > 0) {
      issueCount++;
      console.log(`\n❌ VẤN ĐỀ ${issueCount}: ${paymentsWithoutSlot.length} payments không có slotId`);
      console.log(`   → ĐÂY LÀ LỖI NGHIÊM TRỌNG - Webhook không thể tạo booking!`);
    }

    const paidWithoutBooking = paymentsWithoutBooking.filter(p => p.status === 'PAID').length;
    if (paidWithoutBooking > 0) {
      issueCount++;
      console.log(`\n❌ VẤN ĐỀ ${issueCount}: ${paidWithoutBooking} payments PAID nhưng không có booking`);
      console.log(`   → Webhook có thể đã lỗi - cần tạo booking thủ công hoặc fix webhook`);
    }

    if (bookedSlotsWithoutBooking.length > 0) {
      issueCount++;
      console.log(`\n❌ VẤN ĐỀ ${issueCount}: ${bookedSlotsWithoutBooking.length} slots status=booked nhưng không có booking`);
      console.log(`   → Cần đổi status về 'open' hoặc tạo booking record`);
    }

    if (openSlotsWithBooking.length > 0) {
      issueCount++;
      console.log(`\n❌ VẤN ĐỀ ${issueCount}: ${openSlotsWithBooking.length} slots status=open nhưng đã có booking`);
      console.log(`   → Cần cập nhật status thành 'booked'`);
    }

    if (bookingsWithoutSlot.length > 0) {
      issueCount++;
      console.log(`\n❌ VẤN ĐỀ ${issueCount}: ${bookingsWithoutSlot.length} bookings không có slot`);
      console.log(`   → Cần xóa hoặc gán slot cho các booking này`);
    }

    if (bookingsWithoutUser.length > 0) {
      issueCount++;
      console.log(`\n❌ VẤN ĐỀ ${issueCount}: ${bookingsWithoutUser.length} bookings không có user`);
      console.log(`   → Cần xóa các booking này`);
    }

    console.log('\n═'.repeat(100));
    if (issueCount === 0) {
      console.log('✅ HOÀN HẢO! Không có vấn đề về tính nhất quán dữ liệu.');
    } else {
      console.log(`⚠️  PHÁT HIỆN ${issueCount} VẤN ĐỀ CẦN XỬ LÝ`);
    }
    console.log('═'.repeat(100));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDataConsistency();
