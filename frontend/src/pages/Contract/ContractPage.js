import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { restoreUser, updateProfile } from "../../redux/slices/userSlice";
import { getTutorProfile } from "../../services/BookingService";
import {
  getCurrentUserApi,
  updateUserProfileApi,
} from "../../services/ApiService";
import ContractDisplay from "../../components/Contract/ContractDisplay";
import { toast } from "react-toastify";
import "./ContractPage.scss";

const ContractPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.user);
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState({
    studentName: "",
    studentPhone: "",
    studentEmail: "",
    studentAddress: "",
    subject: "",
    totalSessions: 1,
    sessionDuration: 150, // 2h30 = 150 phút
    weeklySchedule: [],
    mode: "online",
    pricePerSession: 0,
    totalPrice: 0,
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);

  // Fetch user data from API when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getCurrentUserApi();
        dispatch(updateProfile(response));
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    fetchUserData();
  }, [dispatch]);

  useEffect(() => {
    console.log("Current user from Redux:", currentUser);
    // Nếu có dữ liệu từ state (từ trang booking), sử dụng dữ liệu đó và lưu vào sessionStorage
    if (location.state?.bookingData && location.state?.tutor) {
      const { bookingData, tutor: tutorData } = location.state;
      console.log("📦 Using location.state data");
      console.log("📦 Booking data:", bookingData);
      console.log("📦 Tutor data:", tutorData);

      // Log để debug chi tiết hơn
      console.log("Original booking data:", bookingData);
      console.log("🔍 Price debug:", {
        rawPrice: bookingData.price,
        rawSessionPrice: bookingData.sessionPrice,
        sessionDetailsPrice: bookingData.sessionDetails?.price,
        tutorPrice: tutorData.price,
      });
      console.log("Debug session and price info:", {
        numberOfSessions: bookingData.numberOfSessions,
        totalSessions: bookingData.totalSessions,
        sessions: bookingData.sessions,
        bookingPrice: bookingData.price,
      });

      // Thêm log để debug
      console.log("Location state:", location.state);
      console.log("Booking data:", bookingData);
      console.log("Tutor data:", tutorData);

      // Tạo một biến tạm để kiểm tra giá trị price từ booking
      console.log("🏷️ Price from booking:", bookingData.price);

      // Định nghĩa giá trị cố định cho giá và số buổi
      const PRICE_PER_SESSION = 100000; // 100,000đ mỗi buổi
      const DEFAULT_SESSIONS = 6; // 6 buổi mặc định

      // Xử lý tên môn học - chỉ lấy tên môn, bỏ phần giá
      const subjectName = (bookingData.subject || tutorData.subject || "")
        .replace(/\s*-\s*0đ\/buổi$/, "") // Xóa phần "- 0đ/buổi" ở cuối
        .replace(/\s*-\s*\d+đ\/buổi$/, "") // Xóa bất kỳ giá tiền nào ở cuối
        .trim();

      const contractDataToSave = {
        ...bookingData,
        studentName: currentUser?.profile?.full_name || "",
        studentPhone: currentUser?.profile?.phone_number || "",
        studentEmail: currentUser?.account?.email || "",
        studentAddress: currentUser?.profile?.address || "",
        // Lấy thông tin môn học, chỉ phần tên môn
        subject: subjectName,
        // Lấy hình thức học
        mode: bookingData.mode || location.state?.mode || "offline",
        // Lấy ngày bắt đầu và kết thúc
        startDate: bookingData.start || location.state?.startDate || "",
        endDate: bookingData.end || location.state?.endDate || "",
        // Lấy số buổi học - mặc định 6 buổi như trong ảnh
        totalSessions:
          bookingData.totalSessions ||
          bookingData.numberOfSessions ||
          bookingData.sessions?.length ||
          DEFAULT_SESSIONS,
        notes: bookingData.notes || "",
        // Sử dụng giá cố định 100,000đ một buổi
        pricePerSession: PRICE_PER_SESSION,
        // Tính tổng học phí dựa trên số buổi và giá cố định
        totalPrice:
          PRICE_PER_SESSION *
          (bookingData.totalSessions ||
            bookingData.numberOfSessions ||
            bookingData.sessions?.length ||
            DEFAULT_SESSIONS),
      }; // Lưu vào sessionStorage
      sessionStorage.setItem(
        "contractData",
        JSON.stringify({
          contractData: contractDataToSave,
          tutor: tutorData,
        })
      );

      setTutor(tutorData);
      setContractData(contractDataToSave);
      setLoading(false);
    }
    // Nếu không có location.state, thử đọc từ sessionStorage
    else {
      const sessionData = sessionStorage.getItem("contractData");
      if (sessionData) {
        try {
          const { contractData: savedContractData, tutor: tutorData } =
            JSON.parse(sessionData);
          console.log("📦 Using sessionStorage data:", savedContractData);
          console.log("📦 Tutor data from storage:", tutorData);

          setTutor(tutorData);
          setContractData(savedContractData);
          setLoading(false);
        } catch (error) {
          console.error("❌ Error parsing sessionStorage data:", error);
          loadTutorProfile();
        }
      } else {
        // Nếu không có dữ liệu từ state, load từ API
        loadTutorProfile();
      }
    }
  }, [id, location.state, currentUser]);

  const loadTutorProfile = async () => {
    try {
      const tutorData = await getTutorProfile(id);
      setTutor(tutorData);
      setContractData((prev) => ({
        ...prev,
        pricePerSession: tutorData.price,
        totalPrice: tutorData.price * prev.totalSessions,
      }));
    } catch (error) {
      console.error("Error loading tutor:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (field, value) => {
    setContractData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "totalSessions") {
        newData.totalPrice = newData.pricePerSession * parseInt(value);
      }

      // Lưu lại vào sessionStorage mỗi khi có thay đổi
      sessionStorage.setItem(
        "contractData",
        JSON.stringify({
          contractData: newData,
          tutor: tutor,
        })
      );

      return newData;
    });

    // Nếu cập nhật các trường thông tin cá nhân, lưu vào profile
    if (
      [
        "studentName",
        "studentPhone",
        "studentEmail",
        "studentAddress",
      ].includes(field)
    ) {
      try {
        const profileData = {
          full_name:
            field === "studentName" ? value : currentUser?.profile?.full_name,
          phone_number:
            field === "studentPhone"
              ? value
              : currentUser?.profile?.phone_number,
          email: field === "studentEmail" ? value : currentUser?.account?.email,
          address:
            field === "studentAddress" ? value : currentUser?.profile?.address,
        };

        const response = await updateUserProfileApi(profileData);
        dispatch(updateProfile(response));
        toast.success("Đã cập nhật thông tin cá nhân");
      } catch (error) {
        console.error("Failed to update profile:", error);
        toast.error("Không thể cập nhật thông tin cá nhân");
      }
    }
  };

  const handleSignContract = async () => {
    // Bỏ validation

    console.log("📝 Signing contract...");
    console.log("📦 Contract data:", contractData);
    console.log("📦 Location state:", location.state);

    setSigning(true);
    let bookingPayload;

    try {
      // Bỏ qua việc lấy dữ liệu từ location.state
      console.log("📦 Contract data:", contractData);

      // Bỏ qua xử lý thời gian phức tạp

      // Tạo booking với thông tin tối thiểu
      bookingPayload = {
        tutorId: id,
        subject: "Test Subject",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
        mode: "offline",
        totalPrice: 100000,
      };

      console.log("📦 Booking payload:", bookingPayload);
      console.log("📦 Debug information:", {
        dates: {
          contractStart: contractData.startDate,
          contractEnd: contractData.endDate,
          finalStart: new Date().toISOString(),
          finalEnd: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
        },
        subject: {
          fromContract: contractData.subject,
          final: bookingPayload.subject,
        },
        price: {
          fromContract: contractData.totalPrice,
          final: bookingPayload.totalPrice,
        },
      });

      // Gọi API tạo booking bằng BookingService
      const BookingService = (await import("../../services/BookingService"))
        .default;
      const createdBooking = await BookingService.createBooking(bookingPayload);

      console.log("✅ Booking created:", createdBooking);

      try {
        // Tạo payload cho PayOS đơn giản
        const paymentPayload = {
          amount: 100000,
          orderDescription: "Test Payment",
          returnUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
          bookingId: createdBooking._id,
        };

        console.log("📦 Payment payload:", paymentPayload);

        // Gọi API tạo payment link
        const PaymentService = (await import("../../services/PaymentService"))
          .default;
        const paymentResponse = await PaymentService.createPaymentLink(
          paymentPayload
        );

        console.log("✅ Payment link created:", paymentResponse);

        if (paymentResponse.success && paymentResponse.checkoutUrl) {
          window.location.href = paymentResponse.checkoutUrl;
        } else {
          throw new Error("Không thể tạo liên kết thanh toán");
        }
      } catch (paymentError) {
        console.error("❌ Error creating payment:", paymentError);
        alert(
          "Có lỗi khi tạo thanh toán: " +
            (paymentError.message || "Vui lòng thử lại")
        );
      }
    } catch (error) {
      console.error("❌ Error signing contract:", error);

      // Log chi tiết về lỗi
      console.error("Full error object:", error);
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
      console.error("Validation errors:", error.response?.data?.errors);

      // Log payload đã gửi
      console.error("Sent payload:", bookingPayload);

      let errorMessage;
      if (error.response?.data?.errors) {
        // Hiển thị tất cả các lỗi validation
        errorMessage = error.response.data.errors
          .map((err) => err.msg)
          .join("\n");
      } else {
        errorMessage = error.response?.data?.message || error.message;
      }

      alert(
        `Có lỗi xảy ra khi ký hợp đồng:\n${errorMessage}\nVui lòng thử lại.`
      );

      // Log thêm thông tin debug
      console.error("Error details:", {
        response: error.response?.data,
        status: error.response?.status,
        requestData: bookingPayload,
      });
    } finally {
      setSigning(false);
    }
  };

  const getDayName = (dayOfWeek) => {
    const days = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];
    return days[dayOfWeek];
  };

  if (loading) {
    return (
      <div className="contract-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin gia sư...</p>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="contract-page">
        <div className="error-container">
          <h2>Không tìm thấy thông tin gia sư</h2>
          <button onClick={() => navigate("/")} className="btn-primary">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-page">
      <div className="contract-container">
        {/* Header */}
        <div className="contract-header">
          <h1>📋 HỢP ĐỒNG THUÊ GIA SƯss</h1>
          <div className="contract-info">
            <span className="contract-number">
              Số hợp đồng: HD-{Date.now()}
            </span>
            <span className="contract-date">
              Ngày ký: {new Date().toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>

        {/* Contract Form */}
        <div className="contract-form">
          {/* Student Information */}
          <div className="form-section">
            <h3>👨‍🎓 Thông tin học viên</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Họ tên *</label>
                <input
                  type="text"
                  value={contractData.studentName}
                  onChange={(e) =>
                    handleInputChange("studentName", e.target.value)
                  }
                  placeholder="Nhập họ tên đầy đủ"
                  required
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  value={contractData.studentPhone}
                  onChange={(e) =>
                    handleInputChange("studentPhone", e.target.value)
                  }
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={contractData.studentEmail}
                  onChange={(e) =>
                    handleInputChange("studentEmail", e.target.value)
                  }
                  placeholder="Nhập email"
                  required
                />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input
                  type="text"
                  value={contractData.studentAddress}
                  onChange={(e) =>
                    handleInputChange("studentAddress", e.target.value)
                  }
                  placeholder="Nhập địa chỉ"
                />
              </div>
            </div>
          </div>

          {/* Course Information */}
          {/* <div className="form-section">
            <h3>📚 Thông tin khóa họcccc</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Môn học *</label>
                <input
                  type="text"
                  value={contractData.subject}
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="form-group">
                <label>Số buổi học *</label>
                <input
                  type="text"
                  value={contractData.totalSessions}
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="form-group">
                <label>Thời gian mỗi buổi</label>
                <input
                  type="text"
                  value="2 giờ 30 phút"
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="form-group">
                <label>Hình thức học *</label>
                <input
                  type="text"
                  value={
                    contractData.mode === "online" ? "Trực tuyến" : "Trực tiếp"
                  }
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="form-group">
                <label>Ngày bắt đầu *</label>
                <input
                  type="date"
                  value={contractData.startDate}
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="form-group">
                <label>Ngày kết thúc</label>
                <input
                  type="date"
                  value={contractData.endDate}
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={contractData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Nhập nội dung muốn học, mục tiêu, yêu cầu đặc biệt..."
                  rows="3"
                />
              </div>
            </div>
          </div> */}

          {/* Pricing */}
          {/* <div className="form-section pricing-section">
            <h3>💰 Thông tin tài chính</h3>
            <div className="pricing-grid">
              <div className="pricing-item">
                <span>Học phí mỗi buổi:</span>
                <span className="price">
                  {Number(contractData.pricePerSession).toLocaleString()}đ
                </span>
              </div>
              <div className="pricing-item">
                <span>Số buổi học:</span>
                <span>{Number(contractData.totalSessions)} buổi</span>
              </div>
              <div className="pricing-item total">
                <span>Tổng học phí:</span>
                <span className="price">
                  {Number(contractData.totalPrice).toLocaleString()}đ
                </span>
              </div>
            </div>
          </div> */}
        </div>

        {/* Contract Display */}
        <div className="contract-display-section">
          <ContractDisplay
            contractData={contractData}
            tutor={tutor}
            onSign={(signatureData) => {
              console.log("✍️ Signature updated:", signatureData);
              // Lưu chữ ký vào state nếu cần
            }}
          />
        </div>

        {/* Agreement */}
        <div className="agreement-section">
          <label className="agreement-checkbox">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="checkmark"></span>
            <span className="agreement-text">
              Tôi đã đọc và đồng ý với tất cả các điều khoản trong hợp đồng thuê
              gia sư này
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="contract-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            <i className="fas fa-arrow-left"></i>
            Quay lại
          </button>
          <button
            type="button"
            onClick={handleSignContract}
            disabled={!agreed || signing}
            className="btn-primary"
          >
            {signing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Đang ký hợp đồng...
              </>
            ) : (
              <>
                <i className="fas fa-signature"></i>
                Ký hợp đồng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractPage;
