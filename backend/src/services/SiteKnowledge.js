const TutorProfile = require("../models/TutorProfile");

function formatNum(n) {
  try {
    const num = Number(n || 0);
    return num.toLocaleString("vi-VN");
  } catch (e) {
    return String(n || 0);
  }
}

async function getSiteSummary() {
  try {
    const TeachingSlot = (() => {
      try {
        return require("../models/TeachingSlot");
      } catch (e) {
        return null;
      }
    })();

    const User = (() => {
      try {
        return require("../models/User");
      } catch (e) {
        return null;
      }
    })();

    const [tutorCount, slotCount, userCount, subjectsDistinct] = await Promise.all([
      TutorProfile.countDocuments({ status: "approved" }),
      TeachingSlot ? TeachingSlot.countDocuments({ status: { $ne: "deleted" } }) : 0,
      User ? User.countDocuments({}) : 0,
      TutorProfile.distinct("subjects.name", { status: "approved" }),
    ]);

    return {
      tutorCount,
      slotCount,
      userCount,
      subjects: (subjectsDistinct || []).filter(Boolean).slice(0, 20),
      asText() {
        return (
          `Tổng quan hệ thống: ` +
          `${formatNum(this.tutorCount)} gia sư đã duyệt, ` +
          `${formatNum(this.slotCount)} khóa/slot mở, ` +
          `${formatNum(this.userCount)} người dùng đăng ký. ` +
          `Các môn phổ biến: ${this.subjects.join(", ")}.`
        );
      },
    };
  } catch (e) {
    return {
      tutorCount: 0,
      slotCount: 0,
      userCount: 0,
      subjects: [],
      asText() {
        return "Tổng quan hệ thống hiện chưa sẵn có.";
      },
    };
  }
}

function getFAQs() {
  // Comprehensive FAQs covering all system features
  return [
    {
      q: "Quy trình đặt gia sư thế nào?",
      a:
        "1) Tìm gia sư phù hợp (môn/level/khu vực) → 2) Xem chi tiết hồ sơ → 3) Chọn slot/khóa học → 4) Ký hợp đồng → 5) Thanh toán qua PayOS → 6) Đơn ở trạng thái 'pending' → 7) Gia sư chấp nhận → 8) Nhận lịch và vào phòng học.",
    },
    {
      q: "Thanh toán xong có gì xảy ra?",
      a:
        "Hệ thống tạo đơn 'pending' và gửi thông báo cho gia sư (email + in-app). Gia sư vào 'Đơn yêu cầu' để xem hợp đồng và chấp nhận. Khi gia sư chấp nhận, học viên nhận email xác nhận và hướng dẫn tham gia phòng học.",
    },
    {
      q: "Hủy/hoàn tiền thế nào?",
      a:
        "Liên hệ hỗ trợ kèm mã đơn. Tùy trạng thái buổi học và điều khoản, hệ thống xử lý theo quy định escrow. Tiền được giữ trong escrow và chỉ giải phóng khi buổi học hoàn tất.",
    },
    {
      q: "Thông báo hoạt động ra sao?",
      a:
        "Có email (Nodemailer) và thông báo trong ứng dụng (Socket.io). Gia sư nhận thông báo khi có đơn pending; học viên nhận khi đơn được chấp nhận. Bạn có thể xem thông báo qua icon chuông ở header.",
    },
    {
      q: "Làm sao để trở thành gia sư?",
      a:
        "1) Đăng ký tài khoản → 2) Chọn 'Trở thành gia sư' → 3) Điền thông tin hồ sơ (môn dạy, kinh nghiệm, chứng chỉ) → 4) Upload giấy tờ xác minh → 5) Chờ admin duyệt → 6) Sau khi duyệt, bạn có thể tạo khóa học và nhận đơn đặt lịch.",
    },
    {
      q: "Cách tạo khóa học/slot?",
      a:
        "Gia sư vào 'Khóa học' → 'Tạo khóa học mới' → Điền: tên khóa, môn học, thời gian, giá, hình thức (online/offline), mô tả → Lưu. Slot sẽ hiển thị cho học viên tìm kiếm.",
    },
    {
      q: "Học phí được tính thế nào?",
      a:
        "Học phí = giá slot/khóa học do gia sư đặt. Hệ thống thu phí platform (15%) và trả 85% cho gia sư. Tiền được giữ trong escrow và giải phóng sau khi buổi học hoàn tất.",
    },
    {
      q: "Làm sao rút tiền?",
      a:
        "Gia sư vào 'Ví' → 'Rút tiền' → Điền thông tin tài khoản ngân hàng → Nhập số tiền → Xác nhận. Tiền sẽ được chuyển trong 1-3 ngày làm việc.",
    },
    {
      q: "Phòng học hoạt động thế nào?",
      a:
        "Sau khi gia sư chấp nhận đơn, hệ thống tạo phòng học với roomId. Cả gia sư và học viên vào 'Phòng Học' → Nhập roomId → Tham gia video call và chat.",
    },
    {
      q: "Đánh giá gia sư thế nào?",
      a:
        "Sau khi buổi học hoàn tất, học viên có thể đánh giá gia sư (1-5 sao) và viết nhận xét. Đánh giá hiển thị công khai trên hồ sơ gia sư.",
    },
    {
      q: "Làm sao tìm gia sư?",
      a:
        "1) Dùng thanh tìm kiếm ở header → 2) Vào 'Danh sách gia sư' → 3) Lọc theo môn/khu vực/giới tính → 4) Xem hồ sơ chi tiết → 5) Chọn slot phù hợp → 6) Đặt lịch.",
    },
    {
      q: "Hợp đồng là gì?",
      a:
        "Hợp đồng là thỏa thuận giữa học viên và gia sư, bao gồm: thông tin hai bên, môn học, thời gian, học phí, điều khoản. Học viên ký trước khi thanh toán, gia sư ký khi chấp nhận đơn.",
    },
    {
      q: "Làm sao liên hệ hỗ trợ?",
      a:
        "Bạn có thể: 1) Gửi tin nhắn qua chat widget này, 2) Email hỗ trợ (nếu có), 3) Xem FAQ trong trang 'Về Chúng Tôi'.",
    },
    {
      q: "Các trạng thái đơn đặt lịch là gì?",
      a:
        "pending: Chờ gia sư chấp nhận → accepted: Đã chấp nhận → in_progress: Đang học → completed: Hoàn tất → cancelled: Đã hủy → disputed: Tranh chấp. Học viên thanh toán xong → pending, gia sư chấp nhận → accepted.",
    },
    {
      q: "Trạng thái thanh toán là gì?",
      a:
        "PENDING: Chờ thanh toán → PAID: Đã thanh toán → FAILED: Thất bại → REFUNDED: Đã hoàn tiền. Nếu chuyển khoản xong nhưng vẫn PENDING, bấm 'Xác minh (verify)' để đồng bộ.",
    },
    {
      q: "Menu trong hệ thống có gì?",
      a:
        "Header: Danh sách gia sư, Khóa học, Trở thành gia sư, Về Chúng Tôi, Tìm kiếm, Phòng Học, Thông báo (icon chuông), Avatar (menu: Hồ sơ, Dashboard, Đơn yêu cầu (gia sư), Đăng xuất).",
    },
    {
      q: "Cách xem thông báo?",
      a:
        "Click icon chuông ở header → Xem danh sách thông báo → Click để xem chi tiết. Thông báo hiển thị: đơn mới (gia sư), đơn được chấp nhận (học viên), thanh toán, hợp đồng, v.v.",
    },
    {
      q: "Cách đổi mật khẩu?",
      a:
        "Vào Hồ sơ cá nhân → Chọn 'Đổi mật khẩu' hoặc vào /change-password → Nhập mật khẩu cũ → Nhập mật khẩu mới (tối thiểu 8 ký tự) → Xác nhận.",
    },
    {
      q: "Quên mật khẩu thì sao?",
      a:
        "Vào trang Đăng nhập → Click 'Quên mật khẩu?' → Nhập email → Nhận link reset qua email → Đặt mật khẩu mới.",
    },
    {
      q: "Cách xem lịch sử đặt lịch?",
      a:
        "Học viên: Vào 'Đơn của tôi' (/bookings/me). Gia sư: Vào 'Đơn yêu cầu' (/bookings/tutor) để xem đơn pending, hoặc 'Lịch dạy' (/tutor/schedule) để xem tất cả.",
    },
    {
      q: "Cách quản lý lịch rảnh?",
      a:
        "Gia sư vào 'Lịch dạy' (/tutor/schedule) → Chọn thứ trong tuần → Chọn khung giờ (sáng/chiều/tối) → Lưu. Học viên sẽ thấy lịch rảnh khi xem hồ sơ gia sư.",
    },
  ];
}

function buildFAQText() {
  const list = getFAQs();
  return (
    "FAQ hệ thống:\n" +
    list
      .map((f, i) => `${i + 1}) ${f.q}\n- ${f.a}`)
      .join("\n")
  );
}

function getSystemFeatures() {
  return {
    pages: {
      public: [
        { path: "/", name: "Trang chủ", desc: "Landing page giới thiệu hệ thống" },
        { path: "/signin", name: "Đăng nhập", desc: "Đăng nhập bằng email/password, Google, Facebook" },
        { path: "/signup", name: "Đăng ký", desc: "Đăng ký tài khoản mới" },
        { path: "/tutors", name: "Danh sách gia sư", desc: "Tìm kiếm và lọc gia sư theo môn/khu vực/giới tính" },
        { path: "/about", name: "Về chúng tôi", desc: "Thông tin về hệ thống" },
      ],
      student: [
        { path: "/home", name: "Trang chủ", desc: "Dashboard học viên" },
        { path: "/tutors", name: "Tìm gia sư", desc: "Tìm và lọc gia sư" },
        { path: "/tutor/:id", name: "Hồ sơ gia sư", desc: "Xem chi tiết hồ sơ, môn dạy, đánh giá, khóa học, lịch dạy" },
        { path: "/bookings/me", name: "Đơn của tôi", desc: "Xem lịch sử đặt lịch" },
        { path: "/profile", name: "Hồ sơ cá nhân", desc: "Quản lý thông tin cá nhân" },
        { path: "/payments", name: "Lịch sử thanh toán", desc: "Xem và xác minh giao dịch" },
        { path: "/room/:roomId", name: "Phòng học", desc: "Video call với gia sư" },
      ],
      tutor: [
        { path: "/tutor/onboarding", name: "Đăng ký gia sư", desc: "Wizard điền hồ sơ gia sư" },
        { path: "/tutor/profile-update", name: "Cập nhật hồ sơ", desc: "Chỉnh sửa thông tin gia sư" },
        { path: "/bookings/tutor", name: "Đơn yêu cầu", desc: "Xem và chấp nhận/từ chối đơn đặt lịch" },
        { path: "/tutor/schedule", name: "Lịch dạy", desc: "Quản lý lịch rảnh và slot" },
        { path: "/tutor/publish-slot", name: "Tạo slot", desc: "Đăng slot/khóa học mới" },
        { path: "/courses", name: "Khóa học", desc: "Quản lý khóa học đã tạo" },
        { path: "/tutor/wallet", name: "Ví", desc: "Xem số dư, lịch sử giao dịch, rút tiền" },
      ],
      admin: [
        { path: "/admin", name: "Dashboard admin", desc: "Tổng quan hệ thống" },
        { path: "/admin/users", name: "Quản lý người dùng", desc: "Xem, khóa, mở khóa users" },
        { path: "/admin/tutors", name: "Quản lý gia sư", desc: "Duyệt/từ chối hồ sơ gia sư" },
        { path: "/admin/bookings", name: "Quản lý đơn", desc: "Xem và quản lý tất cả đơn đặt lịch" },
        { path: "/admin/contracts", name: "Quản lý hợp đồng", desc: "Xem chi tiết hợp đồng" },
        { path: "/admin/reports", name: "Báo cáo", desc: "Thống kê và báo cáo" },
      ],
    },
    features: {
      search: "Tìm kiếm gia sư theo: tên, môn học, chương trình, khu vực, giới tính",
      booking: "Đặt lịch: Chọn slot → Ký hợp đồng → Thanh toán → Gia sư chấp nhận",
      payment: "Thanh toán qua PayOS (chuyển khoản, ví điện tử). Tiền giữ trong escrow.",
      contract: "Hợp đồng điện tử: Học viên ký trước thanh toán, gia sư ký khi chấp nhận",
      notification: "Thông báo email + in-app (icon chuông header) cho mọi sự kiện quan trọng",
      videoCall: "Phòng học video call với roomId, chat real-time",
      wallet: "Ví gia sư: Xem số dư, lịch sử, rút tiền về STK",
      review: "Đánh giá 1-5 sao + nhận xét sau khi học xong",
    },
    asText() {
      return `CÁC TRANG VÀ TÍNH NĂNG HỆ THỐNG:
      
TRANG CÔNG KHAI:
${this.pages.public.map(p => `- ${p.name} (${p.path}): ${p.desc}`).join('\n')}

TRANG HỌC VIÊN:
${this.pages.student.map(p => `- ${p.name} (${p.path}): ${p.desc}`).join('\n')}

TRANG GIA SƯ:
${this.pages.tutor.map(p => `- ${p.name} (${p.path}): ${p.desc}`).join('\n')}

TRANG ADMIN:
${this.pages.admin.map(p => `- ${p.name} (${p.path}): ${p.desc}`).join('\n')}

TÍNH NĂNG CHÍNH:
${Object.entries(this.features).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`;
    },
  };
}

async function buildSiteKnowledgeText() {
  const summary = await getSiteSummary();
  const faqText = buildFAQText();
  const features = getSystemFeatures();
  return `${summary.asText()}\n\n${features.asText()}\n\n${faqText}`;
}

module.exports = {
  getSiteSummary,
  buildSiteKnowledgeText,
  getFAQs,
  getSystemFeatures,
};


