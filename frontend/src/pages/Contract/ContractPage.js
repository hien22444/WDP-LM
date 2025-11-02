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

// Hàm validate SĐT Việt Nam (10 số)
const validateVnPhoneNumber = (phone) => {
  // Regex này kiểm tra 10 số, bắt đầu bằng số 0
  const vnPhoneRegex = /^(0)([0-9]{9})$/;
  if (!phone) {
    return "Số điện thoại là bắt buộc.";
  }
  if (!vnPhoneRegex.test(phone)) {
    return "Số điện thoại không hợp lệ (cần 10 số, vd: 0912345678).";
  }
  return null; // Hợp lệ
};

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
  const [errors, setErrors] = useState({});

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

  // const handleInputChange = async (field, value) => {
  //   setContractData((prev) => {
  //     const newData = { ...prev, [field]: value };
  //     if (field === "totalSessions") {
  //       newData.totalPrice = newData.pricePerSession * parseInt(value);
  //     }

  //     // Lưu lại vào sessionStorage mỗi khi có thay đổi
  //     sessionStorage.setItem(
  //       "contractData",
  //       JSON.stringify({
  //         contractData: newData,
  //         tutor: tutor,
  //       })
  //     );

  //     return newData;
  //   });

  //   // Nếu cập nhật các trường thông tin cá nhân, lưu vào profile
  //   if (
  //     [
  //       "studentName",
  //       "studentPhone",
  //       "studentEmail",
  //       "studentAddress",
  //     ].includes(field)
  //   ) {
  //     try {
  //       const profileData = {
  //         full_name:
  //           field === "studentName" ? value : currentUser?.profile?.full_name,
  //         phone_number:
  //           field === "studentPhone"
  //             ? value
  //             : currentUser?.profile?.phone_number,
  //         email: field === "studentEmail" ? value : currentUser?.account?.email,
  //         address:
  //           field === "studentAddress" ? value : currentUser?.profile?.address,
  //       };

  //       const response = await updateUserProfileApi(profileData);
  //       dispatch(updateProfile(response));
  //       // toast.success("Đã cập nhật thông tin cá nhân");
  //     } catch (error) {
  //       console.error("Failed to update profile:", error);
  //       //toast.error("Không thể cập nhật thông tin cá nhân");
  //     }
  //   }
  // };

  // const handleInputChange = (field, value) => {
  //   setContractData((prev) => {
  //     const newData = { ...prev, [field]: value };
  //     if (field === "totalSessions") {
  //       newData.totalPrice = newData.pricePerSession * parseInt(value);
  //     }
  //     // 1. Xử lý giá trị (value) TRƯỚC KHI cập nhật state
  //     let processedValue = value; // Bắt đầu với giá trị gốc

  //     if (field === "studentPhone") {

  //       // Xóa tất cả ký tự KHÔNG PHẢI LÀ SỐ
  //       const sanitizedValue = value.replace(/[^0-9]/g, ""); // Giới hạn độ dài là 10 (SĐT Việt Nam)
  //       processedValue = sanitizedValue.slice(0, 10);
  //     } else if (field === "totalSessions") {
  //       // Tương tự, chỉ cho phép nhập số cho "Số buổi"
  //       processedValue = value.replace(/[^0-9]/g, "");
  //     }
  //     // (Các trường khác như "studentName" sẽ giữ nguyên giá trị 'value' gốc)

  //     // Kiểm tra số điện thoại ngay khi người dùng nhập
  //     if (field === "studentPhone") {
  //       const errorMessage = validateVnPhoneNumber(value);
  //       if (errorMessage) {
  //         setErrors((prev) => ({ ...prev, studentPhone: errorMessage }));
  //       } else {
  //         setErrors((prev) => ({ ...prev, studentPhone: null }));
  //       }
  //     }

  //     // Lưu vào sessionStorage
  //     sessionStorage.setItem(
  //       "contractData",
  //       JSON.stringify({
  //         contractData: newData,
  //         tutor: tutor,
  //       })
  //     );

  //     return newData;
  //   });
  // };
  const handleInputChange = (field, value) => {
    // --- BƯỚC 1: XỬ LÝ GIÁ TRỊ TRƯỚC ---
    let processedValue = value; // Bắt đầu với giá trị gốc

    if (field === "studentPhone") {
      // Xóa tất cả ký tự KHÔNG PHẢI LÀ SỐ
      const sanitizedValue = value.replace(/[^0-9]/g, "");
      processedValue = sanitizedValue.slice(0, 10); // Giới hạn 10 số
    } else if (field === "totalSessions") {
      // Tương tự, chỉ cho phép nhập số cho "Số buổi"
      processedValue = value.replace(/[^0-9]/g, "");
    } // (Các trường khác như "studentName" sẽ giữ nguyên 'processedValue' là 'value' gốc) // --- BƯỚC 2: CẬP NHẬT STATE BẰNG GIÁ TRỊ ĐÃ XỬ LÝ ---
    setContractData((prev) => {
      // Dùng processedValue ở đây
      const newData = { ...prev, [field]: processedValue };

      if (field === "totalSessions") {
        // Dùng processedValue ở đây
        newData.totalPrice =
          newData.pricePerSession * parseInt(processedValue || "0");
      } // Lưu vào sessionStorage (với data đã sạch)

      sessionStorage.setItem(
        "contractData",
        JSON.stringify({
          contractData: newData,
          tutor: tutor,
        })
      );

      return newData; // Trả về data đã sạch
    }); // --- BƯỚC 3: VALIDATE GIÁ TRỊ ĐÃ XỬ LÝ --- // (Chạy sau khi state đã được lên lịch cập nhật)

    if (field === "studentPhone") {
      // Dùng processedValue ở đây
      const errorMessage = validateVnPhoneNumber(processedValue); // Chỉ hiện lỗi khi gõ nếu nó không hợp lệ (nhưng không phải lỗi "bắt buộc")
      if (
        errorMessage &&
        processedValue.length > 0 &&
        errorMessage !== "Số điện thoại là bắt buộc."
      ) {
        setErrors((prev) => ({ ...prev, studentPhone: errorMessage }));
      } else {
        // Xóa lỗi nếu SĐT hợp lệ, HOẶC nếu người dùng xóa hết (rỗng)
        setErrors((prev) => ({ ...prev, studentPhone: null }));
      }
    } // Xóa lỗi cho các trường khác khi gõ (ví dụ: Họ tên)

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };
  // HÀM MỚI ĐỂ GỌI API KHI RỜI Ô INPUT (BLUR)
  const handleInputBlur = async (field, value) => {
    // --- PHẦN VALIDATION MỚI ---
    if (field === "studentPhone") {
      const errorMessage = validateVnPhoneNumber(value);
      if (errorMessage) {
        setErrors((prev) => ({ ...prev, studentPhone: errorMessage }));
        return; // Dừng lại, không gọi API nếu lỗi
      }
    } // --- KẾT THÚC PHẦN MỚI ---
    // 1. Chỉ chạy nếu là 4 trường profile
    if (
      ![
        "studentName",
        "studentPhone",
        "studentEmail",
        "studentAddress",
      ].includes(field)
    ) {
      return; // Không phải 4 trường này, không làm gì cả
    } // 2. (Tối ưu) Chỉ gọi API nếu giá trị thật sự thay đổi

    const oldProfile = currentUser?.profile;
    const oldAccount = currentUser?.account;
    if (
      (field === "studentName" && value === oldProfile?.full_name) ||
      (field === "studentPhone" && value === oldProfile?.phone_number) ||
      (field === "studentEmail" && value === oldAccount?.email) ||
      (field === "studentAddress" && value === oldProfile?.address)
    ) {
      return; // Giá trị không đổi, không cần gọi API
    }

    console.log(`Đang lưu ${field}...`); // 3. Dán logic gọi API (từ hàm cũ) vào đây

    try {
      const profileData = {
        full_name:
          field === "studentName" ? value : currentUser?.profile?.full_name,
        phone_number:
          field === "studentPhone" ? value : currentUser?.profile?.phone_number,
        email: field === "studentEmail" ? value : currentUser?.account?.email,
        address:
          field === "studentAddress" ? value : currentUser?.profile?.address,
      };

      const response = await updateUserProfileApi(profileData);
      dispatch(updateProfile(response));
      //toast.success("Đã cập nhật thông tin cá nhân"); // Bật lại toast ở đây
    } catch (error) {
      console.error("Failed to update profile:", error);
      // toast.error("Không thể cập nhật thông tin cá nhân"); // Bật lại toast ở đây
    }
  };

  const handleSignContract = () => {
    console.log("📝 [TEST] Chuyển hướng đến trang OrderSummary...");
    console.log("Debug tutor object:", tutor); // Thêm log để xem cấu trúc của tutor
    setSigning(true); // Kích hoạt trạng thái "Đang ký..."

    // Truyền thông tin cần thiết cho thanh toán và thông tin giảng viên
    const slot = {
      _id: "test_" + Date.now(),
      courseName: contractData.subject || "Khóa học test",
      price: contractData.totalPrice,
      // --- BẮT ĐẦU THÊM VÀO ---
      start: contractData.startDate, // Gửi ngày bắt đầu
      end: contractData.endDate, // Gửi ngày kết thúc
      // --- KẾT THÚC THÊM VÀO ---

      tutorProfile: {
        _id: id,
        user: {
          full_name: tutor?.user?.full_name || tutor?.name || "Tên gia sư",
          avatar: tutor?.user?.avatar || tutor?.avatar,
        },
        title: tutor?.title || "Giảng viên",
      },
    };

    // Chuyển hướng đến OrderSummary với state
    navigate("/payment/order-summary", {
      state: {
        slot,
      },
    });

    // Reset trạng thái signing sau 0.3s
    setTimeout(() => {
      setSigning(false);
    }, 300);
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
                  // THÊM DÒNG NÀY
                  onBlur={(e) => handleInputBlur("studentName", e.target.value)}
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
                  onBlur={(e) =>
                    handleInputBlur("studentPhone", e.target.value)
                  }
                  placeholder="Nhập số điện thoại"
                  required
                  // THÊM VÀO: thêm class 'is-invalid' nếu có lỗi
                  className={errors.studentPhone ? "is-invalid" : ""}
                />
                               {" "}
                {errors.studentPhone && (
                  // THÊM VÀO: Hiển thị thông báo lỗi
                  <span className="error-text">{errors.studentPhone}</span>
                )}
                             {" "}
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={contractData.studentEmail}
                  readOnly
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
                  onBlur={(e) =>
                    handleInputBlur("studentEmail", e.target.value)
                  }
                  placeholder="Nhập địa chỉ"
                  required
                />
              </div>
            </div>
          </div>
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
            disabled={
              !agreed ||
              signing ||
              errors.studentPhone ||
              !contractData.studentPhone
            }
            className="btn-primary"
            title={
              errors.studentPhone ? "Vui lòng nhập số điện thoại hợp lệ" : ""
            }
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
