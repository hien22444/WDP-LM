import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useChat } from "../../contexts/ChatContext";
import { getTutorProfile, createBooking } from "../../services/BookingService";
import { getTutorCourses } from "../../services/TutorService";
import {
  addFavoriteTutor,
  removeFavoriteTutor,
  checkFavoriteTutor,
} from "../../services/FavoriteTutorService";
import "./TutorProfilePage.scss";

// Lazy load components for better performance
const LazyImage = lazy(() => import("../../components/Common/LazyImage"));

const TutorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.user);
  const { openChat } = useChat();
  const [tutor, setTutor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("about");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookingData, setBookingData] = useState({
    subject: null, // Object môn học được chọn {name, price, level, description}
    start: "",
    end: "",
    mode: "online",
    notes: "",
    numberOfSessions: 1, // Số buổi học, mỗi buổi = 2h30
    weeklySchedule: [], // Các thứ trong tuần muốn học [1,3,5] = Thứ 2,4,6
    numberOfWeeks: 1, // Số tuần học
    flexibleSchedule: false, // Có muốn lịch linh hoạt không
    daySchedules: {}, // Lịch riêng cho từng thứ: {1: {start: '08:00', end: '09:30'}, 3: {start: '18:00', end: '19:30'}}
    pricePerSession: 0, // Học phí mỗi buổi
    totalPrice: 0, // Tổng học phí
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [availability, setAvailability] = useState({ slots: [], booked: [] });
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Tính toán lịch học theo tuần (hỗ trợ lịch linh hoạt)
  const calculateWeeklySchedule = (
    startDate,
    weeklySchedule,
    numberOfWeeks,
    flexibleSchedule = false,
    daySchedules = {}
  ) => {
    if (!startDate || weeklySchedule.length === 0) return [];

    const sessions = [];
    const start = new Date(startDate);

    for (let week = 0; week < numberOfWeeks; week++) {
      weeklySchedule.forEach((dayOfWeek) => {
        const sessionDate = new Date(start);
        // Tính ngày của thứ trong tuần đó
        const daysToAdd = ((dayOfWeek - start.getDay() + 7) % 7) + week * 7;
        sessionDate.setDate(start.getDate() + daysToAdd);

        // Tạo session cho thứ này
        const sessionStart = new Date(sessionDate);

        if (
          flexibleSchedule &&
          daySchedules[dayOfWeek] &&
          daySchedules[dayOfWeek].start &&
          daySchedules[dayOfWeek].end
        ) {
          // Lịch linh hoạt: sử dụng thời gian riêng cho từng thứ
          const startTimeParts = daySchedules[dayOfWeek].start.split(":");
          const endTimeParts = daySchedules[dayOfWeek].end.split(":");

          if (startTimeParts.length >= 2 && endTimeParts.length >= 2) {
            const [hour, minute] = startTimeParts.map(Number);
            sessionStart.setHours(hour, minute, 0, 0);

            const sessionEnd = new Date(sessionStart);
            const [endHour, endMinute] = endTimeParts.map(Number);
            sessionEnd.setHours(endHour, endMinute, 0, 0);

            sessions.push({
              start: sessionStart.toISOString(),
              end: sessionEnd.toISOString(),
              dayOfWeek: dayOfWeek,
              week: week + 1,
              customTime: true,
              timeSlot: `${daySchedules[dayOfWeek].start} - ${daySchedules[dayOfWeek].end}`,
            });
          }
        } else {
          // Lịch cố định: sử dụng thời gian bắt đầu chung
          sessionStart.setHours(start.getHours(), start.getMinutes(), 0, 0);

          const sessionEnd = new Date(sessionStart);
          sessionEnd.setTime(sessionStart.getTime() + 2.5 * 60 * 60 * 1000); // +2h30

          sessions.push({
            start: sessionStart.toISOString(),
            end: sessionEnd.toISOString(),
            dayOfWeek: dayOfWeek,
            week: week + 1,
            customTime: false,
          });
        }
      });
    }

    return sessions.sort((a, b) => new Date(a.start) - new Date(b.start));
  };

  // Lấy tên thứ trong tuần
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

  const loadTutorProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getTutorProfile(id);

      // Cập nhật title của trang
      document.title = `Tin nhắn | EduMatch`;
      const t = response?.tutor || response?.profile || {};

      console.log("📊 Raw tutor data:", t);
      console.log("📊 Tutor ID fields:", {
        id: t.id,
        _id: t._id,
        userId: t.userId,
        user: t.user,
        user_id: t.user?._id,
      });

      // Normalize subjects with their prices
      let normalizedSubjects = [];

      // Xử lý subjects từ môn học đã đăng ký
      if (Array.isArray(t.subjects)) {
        normalizedSubjects = t.subjects
          .map((s) => {
            if (!s) return null;
            if (typeof s === "string") {
              return {
                name: s,
                price: t.sessionRate || 0,
                level: "Tất cả",
              };
            }
            return {
              name: s.name,
              price: t.sessionRate || s.price || 0,
              level: s.level || "Tất cả",
              description: s.description,
            };
          })
          .filter(Boolean);
      }
      // Nếu không có registeredSubjects, thử lấy từ subjects
      else if (Array.isArray(t.subjects)) {
        normalizedSubjects = t.subjects
          .map((s) => {
            if (!s) return null;
            // Nếu subject là string
            if (typeof s === "string") {
              return {
                name: s,
                price: t.price || 0,
                level: "Tất cả",
                description: "",
              };
            }
            // Nếu subject là object
            if (typeof s === "object") {
              return {
                name: s.name || s.subject?.name || s.subject || null,
                price: s.price || s.hourlyRate || t.price || 0,
                level: s.level || "Tất cả",
                description: s.description || "",
              };
            }
            return null;
          })
          .filter(Boolean);
      }

      console.log("📚 Normalized subjects:", normalizedSubjects);

      // Helper function to convert relative URLs to absolute
      const toUrl = (url) => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        const baseUrl =
          process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
        return `${baseUrl}/${url.replace(/^\/?/, "")}`;
      };

      // Extract tutor ID - ưu tiên _id của TutorProfile
      const tutorProfileId = t._id || t.id;
      const tutorUserId =
        t.userId || t.user?._id || (typeof t.user === "string" ? t.user : null);

      console.log("📊 Extracted tutor IDs in setTutor:", {
        tutorUserId,
        tutorProfileId,
        originalUserId: t.userId,
        originalUser: t.user,
        original_id: t._id,
        originalId: t.id,
      });

      setTutor({
        ...t,
        // Sử dụng tutorProfileId cho tất cả các chức năng liên quan đến profile
        userId: tutorUserId, // Chỉ dùng cho chat
        _id: tutorProfileId, // ID chính của TutorProfile
        id: tutorProfileId, // ID chính của TutorProfile
        // Giữ nguyên user object nếu có
        user: t.user || (tutorUserId ? { _id: tutorUserId } : null),
        name: t.name || t.user?.fullName || t.user?.full_name || "Gia sư",
        // Ưu tiên avatar từ TutorProfile (avatarUrl), sau đó từ User (image), sau đó mới fallback
        avatar:
          toUrl(t.avatarUrl || t.user?.image || t.avatar || t.profileImage) ||
          null,
        subjects: normalizedSubjects,
        experience: t.experience || `${t.experienceYears || 0} năm`,
        price: t.price || t.sessionRate || 0,
        location: t.location || t.city || "Chưa cập nhật",
        teachModes:
          t.teachModes ||
          (t.teachingOptions?.mode ? [t.teachingOptions.mode] : []),
        rating: t.rating || 0,
        reviewCount: t.reviewCount || 0,
        verified:
          typeof t.verified === "boolean"
            ? t.verified
            : t.status === "approved",
        isOwnProfile: currentUser && String(t.user) === String(currentUser._id),

        // Thêm thông tin chi tiết
        bio: t.bio || t.description || "Chưa có giới thiệu",
        email: t.user?.email || t.email || "Chưa cập nhật",
        phone: t.user?.phone_number || t.phone || "Chưa cập nhật",
        languages: t.languages || ["Tiếng Việt"],
        education: t.education || "Chưa cập nhật",
        achievements: t.achievements || [],
        teachingStyle: t.teachingStyle || "Chưa cập nhật",
        availability: t.availability || "Chưa cập nhật",

        // Thông tin xác minh
        verification: t.verification || {},
        degreeStatus: t.verification?.degreeStatus || "pending",
        idStatus: t.verification?.idStatus || "pending",

        // Portfolio và gallery
        portfolio: t.portfolio || [],
        gallery: t.gallery || [],
        uploads: t.uploads || [],

        // Chứng chỉ và bằng cấp
        certificates: t.certificates || [],
        degrees: t.degrees || [],

        // Thông tin liên hệ
        contactInfo: {
          email: t.user?.email || t.email || "Chưa cập nhật",
          phone: t.user?.phone_number || t.phone || "Chưa cập nhật",
          address: t.address || t.location || t.city || "Chưa cập nhật",
        },
      });

      console.log("📋 Normalized tutor data:", {
        name: t.name || t.user?.fullName || t.user?.full_name || "Gia sư",
        avatar: t.avatarUrl || t.user?.image || t.avatar || t.profileImage,
        avatarUrl: t.avatarUrl,
        userImage: t.user?.image,
        subjects: normalizedSubjects,
        bio: t.bio || t.description || "Chưa có giới thiệu",
        price: t.price || t.sessionRate || 0,
        verified:
          typeof t.verified === "boolean"
            ? t.verified
            : t.status === "approved",
      });

      console.log("🔍 Avatar Debug:", {
        "t.avatarUrl": t.avatarUrl,
        "t.user?.image": t.user?.image,
        "t.avatar": t.avatar,
        "t.profileImage": t.profileImage,
        "Final avatar": toUrl(
          t.avatarUrl || t.user?.image || t.avatar || t.profileImage
        ),
        "User object": t.user,
      });
    } catch (error) {
      console.error("Error loading tutor profile:", error);
      setError("Không thể tải thông tin gia sư");
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  // Memoized computed values for better performance
  const normalizedSubjects = useMemo(() => {
    if (!tutor?.subjects) return [];
    return Array.isArray(tutor.subjects) ? tutor.subjects : [];
  }, [tutor?.subjects]);

  const isOwnProfile = useMemo(() => {
    return (
      currentUser && tutor && String(tutor.user) === String(currentUser._id)
    );
  }, [currentUser, tutor]);

  const formattedPrice = useMemo(() => {
    if (!tutor?.price) return "0";
    return new Intl.NumberFormat("vi-VN").format(tutor.price);
  }, [tutor?.price]);

  // Kiểm tra trạng thái yêu thích
  const checkIfFavorite = async () => {
    if (!tutor?._id) return;
    try {
      const result = await checkFavoriteTutor(tutor._id);
      setIsFavorite(result);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  // Xử lý khi click vào nút yêu thích
  const handleToggleFavorite = async () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để thêm gia sư vào danh sách yêu thích");
      return;
    }

    if (!tutor?._id) {
      toast.error("Không thể thực hiện thao tác này");
      return;
    }

    try {
      if (isFavorite) {
        await removeFavoriteTutor(tutor._id);
        toast.success("Đã xóa khỏi danh sách yêu thích");
      } else {
        await addFavoriteTutor(tutor._id);
        toast.success("Đã thêm vào danh sách yêu thích");
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  useEffect(() => {
    loadTutorProfile();
  }, [id, loadTutorProfile]);

  // Kiểm tra favorite status khi đã có tutor data
  useEffect(() => {
    if (tutor?._id) {
      checkIfFavorite();
    }
  }, [tutor?._id]);

  const loadTutorCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await getTutorCourses(id);
      setCourses(response.courses || []);
    } catch (error) {
      console.error("Error loading tutor courses:", error);
      // Don't show error for courses, just log it
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      setAvailabilityLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/v1/tutors/${id}/availability`
      );
      const data = await response.json();
      setAvailability(data.availability || { slots: [], booked: [] });
    } catch (error) {
      console.error("Error loading availability:", error);
      setAvailability({ slots: [], booked: [] });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleBookSession = () => {
    // Kiểm tra đăng nhập trước khi cho phép đặt lịch
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để đặt lịch học");
      navigate("/signin", { state: { from: window.location.pathname } });
      return;
    }

    setShowBookingForm(true);
    setBookingError("");
    // Reset form with default values and set tutor's price
    setBookingData({
      start: "",
      end: "",
      mode: tutor?.teachModes?.includes("online") ? "online" : "offline",
      notes: "",
      subject: "",
      pricePerSession: tutor.price || 0, // Lấy giá từ thông tin gia sư
      totalPrice: tutor.price || 0, // Ban đầu là giá 1 buổi
      numberOfSessions: 1,
      weeklySchedule: [],
      numberOfWeeks: 1,
      flexibleSchedule: false,
      daySchedules: {},
    });
  };

  const handleSelectSlot = (slot) => {
    // Kiểm tra đăng nhập trước khi cho phép chọn slot
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để đặt lịch học");
      navigate("/signin", { state: { from: window.location.pathname } });
      return;
    }

    // Mỗi buổi học = 2h30 (150 phút)
    const startDate = new Date(slot.date);
    const endDate = new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000); // +2h30

    setBookingData({
      start: startDate.toISOString().slice(0, 16),
      end: endDate.toISOString().slice(0, 16),
      mode: tutor?.teachModes?.includes("online") ? "online" : "offline",
      notes: "",
      numberOfSessions: 1,
    });
    // Open booking form
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (e) => {
    console.log("🚀 handleBookingSubmit called!", e);
    e.preventDefault();

    // Debug logs for form validation
    console.log("📝 Current booking data:", bookingData);
    console.log("📝 Form validity check:");
    console.log("- Subject selected:", bookingData.subject?.name);
    console.log("- Start time:", bookingData.start);
    console.log("- Weekly schedule:", bookingData.weeklySchedule);
    console.log("- Number of weeks:", bookingData.numberOfWeeks);

    setBookingLoading(true);
    setBookingError("");

    try {
      // Validate booking data
      console.log("🔍 Validating booking data:", bookingData);

      if (!bookingData.subject || !bookingData.subject.name) {
        console.log("❌ Validation failed: No subject selected");
        throw new Error("Vui lòng chọn môn học");
      }

      if (!bookingData.start || !bookingData.end) {
        console.log("❌ Validation failed: No start/end time");
        throw new Error("Vui lòng chọn thời gian bắt đầu và kết thúc");
      }

      if (
        !bookingData.weeklySchedule ||
        bookingData.weeklySchedule.length === 0
      ) {
        console.log("❌ Validation failed: No weekly schedule");
        throw new Error("Vui lòng chọn ít nhất một thứ trong tuần để học");
      }

      console.log("✅ Validation passed");

      // Kiểm tra lịch linh hoạt
      if (bookingData.flexibleSchedule) {
        const missingSchedules = bookingData.weeklySchedule.filter(
          (day) => !bookingData.daySchedules[day]
        );
        if (missingSchedules.length > 0) {
          const dayNames = missingSchedules
            .map((day) => getDayName(day))
            .join(", ");
          throw new Error(`Vui lòng chọn thời gian học cho: ${dayNames}`);
        }
      }

      const numberOfSessions = bookingData.numberOfSessions || 1;
      if (numberOfSessions < 1 || numberOfSessions > 50) {
        throw new Error("Số buổi học phải từ 1 đến 50 buổi");
      }

      const numberOfWeeks = bookingData.numberOfWeeks || 1;
      if (numberOfWeeks < 1 || numberOfWeeks > 20) {
        throw new Error("Số tuần học phải từ 1 đến 20 tuần");
      }

      const startTime = new Date(bookingData.start);
      const endTime = new Date(bookingData.end);

      if (startTime >= endTime) {
        throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
      }

      if (startTime <= new Date()) {
        throw new Error("Thời gian đặt lịch phải trong tương lai");
      }

      // Kiểm tra thời gian kết thúc của buổi học đầu tiên
      // const expectedEndTime = new Date(
      //   startTime.getTime() + 2.5 * 60 * 60 * 1000
      // ); // +2h30

      // Kiểm tra xem thời gian kết thúc có đúng bằng 2h30 không
      // if (Math.abs(endTime.getTime() - expectedEndTime.getTime()) > 1000) {
      //   // Allow 1 second difference for rounding
      //   throw new Error("Thời gian mỗi buổi học phải là 2 tiếng 30 phút");
      // }

      // Tính ngày của buổi học cuối cùng
      const sortedDays = [...bookingData.weeklySchedule].sort((a, b) => a - b);
      const lastDayOfWeek = sortedDays[sortedDays.length - 1];
      const startDayOfWeek = startTime.getDay();
      const daysToAdd =
        ((lastDayOfWeek - startDayOfWeek + 7) % 7) + 7 * (numberOfWeeks - 1);

      // Log cho debug
      console.log("⏰ Schedule calculation:", {
        startDate: startTime,
        startDayOfWeek,
        lastDayOfWeek,
        daysToAdd,
        numberOfWeeks,
      });

      // Cảnh báo khi đặt nhiều buổi
      if (numberOfSessions > 10) {
        const confirmMessage = `Bạn đang đặt ${numberOfSessions} buổi học (${
          numberOfSessions * 2.5
        } giờ). Tổng tiền: ${(
          tutor.price * numberOfSessions
        ).toLocaleString()}đ.\n\nBạn có chắc chắn muốn tiếp tục?`;
        if (!window.confirm(confirmMessage)) {
          return; // Hủy đặt lịch
        }
      }

      // Create booking - Tính giá theo số buổi học
      const totalPrice = tutor.price * numberOfSessions;

      // Tính toán lịch học chi tiết
      const weeklySchedule = calculateWeeklySchedule(
        bookingData.start,
        bookingData.weeklySchedule,
        bookingData.numberOfWeeks,
        bookingData.flexibleSchedule,
        bookingData.daySchedules
      );

      const bookingPayload = {
        tutorProfileId: id,
        start: bookingData.start,
        end: bookingData.end,
        mode: bookingData.mode,
        price: totalPrice, // Tổng tiền cho tất cả buổi học
        notes:
          bookingData.notes ||
          `Đặt ${numberOfSessions} buổi học trong ${bookingData.numberOfWeeks} tuần`,
        weeklySchedule: bookingData.weeklySchedule, // [1,3,5] = Thứ 2,4,6
        numberOfWeeks: bookingData.numberOfWeeks,
        totalSessions: numberOfSessions,
        flexibleSchedule: bookingData.flexibleSchedule,
        daySchedules: bookingData.daySchedules,
        sessionDetails: weeklySchedule, // Chi tiết từng buổi học
        subject: bookingData.subject.name, // Thêm môn học vào payload
      };

      // Chuyển đến trang hợp đồng thay vì tạo booking trực tiếp
      setShowBookingForm(false);

      // Debug log
      console.log("🔄 Preparing navigation...");
      console.log("📦 Full booking payload:", bookingPayload);
      console.log("👨‍🏫 Full tutor data:", tutor);
      console.log("🎯 Target contract page:", `/contract/${id}`);

      // Log state data
      const navigationState = {
        bookingData: bookingPayload,
        tutor: tutor,
      };
      console.log("� Navigation state:", navigationState);

      // Thử nhiều cách navigation
      try {
        console.log("🔄 Attempting React Router navigation...");
        // Cách 1: React Router navigate
        navigate(`/contract/${id}`, {
          state: navigationState,
        });
        console.log("✅ Navigation appears successful");
      } catch (error) {
        console.error("❌ Navigation error:", error);

        // Cách 2: Manual redirect với state
        try {
          const state = {
            bookingData: bookingPayload,
            tutor: tutor,
          };
          sessionStorage.setItem("contractData", JSON.stringify(state));
          window.location.href = `/contract/${id}`;
          console.log("✅ Manual redirect successful");
        } catch (redirectError) {
          console.error("❌ Manual redirect failed:", redirectError);
          alert("Có lỗi xảy ra khi chuyển trang. Vui lòng thử lại.");
        }
      }

      // Reset form
      setBookingData({
        start: "",
        end: "",
        mode: tutor?.teachModes?.includes("online") ? "online" : "offline",
        notes: "",
        numberOfSessions: 1,
        weeklySchedule: [],
        numberOfWeeks: 1,
        flexibleSchedule: false,
        daySchedules: {},
      });
    } catch (error) {
      console.error("Booking error:", error);
      setBookingError(error.message || "Có lỗi xảy ra khi đặt lịch học");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookingInputChange = (field, value) => {
    setBookingData((prev) => {
      const newData = { ...prev, [field]: value };

      // Cập nhật giá khi chọn môn học
      if (field === "subject") {
        newData.pricePerSession = tutor.price || 0;
        newData.totalPrice = (tutor.price || 0) * prev.numberOfSessions;
      }

      // Nếu thay đổi thời gian bắt đầu, tự động cập nhật thời gian kết thúc cho buổi đầu tiên
      if (field === "start") {
        console.log("⏰ Input start time:", value);
        const startDate = new Date(value);
        console.log("⏰ Parsed start date:", startDate);
        console.log("⏰ Start date ISO:", startDate.toISOString());

        if (!isNaN(startDate.getTime())) {
          // Chỉ tính thời gian kết thúc cho buổi học đầu tiên (2h30)
          const endDate = new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000);
          console.log("⏰ Calculated end date:", endDate);
          console.log("⏰ End date ISO:", endDate.toISOString());

          // Format theo múi giờ local để tránh lỗi timezone
          const year = endDate.getFullYear();
          const month = String(endDate.getMonth() + 1).padStart(2, "0");
          const day = String(endDate.getDate()).padStart(2, "0");
          const hours = String(endDate.getHours()).padStart(2, "0");
          const minutes = String(endDate.getMinutes()).padStart(2, "0");
          newData.end = `${year}-${month}-${day}T${hours}:${minutes}`;
          console.log("⏰ Final end time:", newData.end);
        }
      }

      // Nếu thay đổi lịch tuần hoặc số tuần, tự động tính số buổi học và ngày kết thúc
      if (
        field === "weeklySchedule" ||
        field === "numberOfWeeks" ||
        field === "start"
      ) {
        const weeklySchedule =
          field === "weeklySchedule" ? value : newData.weeklySchedule;
        const numberOfWeeks =
          field === "numberOfWeeks"
            ? parseInt(value) || 1
            : newData.numberOfWeeks;
        const startDate =
          field === "start" ? new Date(value) : new Date(newData.start);

        if (
          weeklySchedule?.length > 0 &&
          startDate &&
          !isNaN(startDate.getTime())
        ) {
          // Tính số buổi học = số thứ trong tuần × số tuần
          const totalSessions = weeklySchedule.length * numberOfWeeks;
          newData.numberOfSessions = totalSessions;

          // Sắp xếp các thứ trong tuần để tìm buổi học cuối
          const sortedDays = [...weeklySchedule].sort((a, b) => a - b);
          const lastDayOfWeek = sortedDays[sortedDays.length - 1];

          // Tính ngày của buổi học cuối cùng
          const startDayOfWeek = startDate.getDay(); // 0 = CN, 1 = T2, ...
          const daysToAdd =
            ((lastDayOfWeek - startDayOfWeek + 7) % 7) +
            7 * (numberOfWeeks - 1);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + daysToAdd);

          // Format end date để set vào form
          const year = endDate.getFullYear();
          const month = String(endDate.getMonth() + 1).padStart(2, "0");
          const day = String(endDate.getDate()).padStart(2, "0");
          const hours = String(endDate.getHours()).padStart(2, "0");
          const minutes = String(endDate.getMinutes()).padStart(2, "0");

          newData.end = `${year}-${month}-${day}T${hours}:${minutes}`;
          console.log("📅 Calculated end date:", newData.end);
        }
      }

      // Nếu bật/tắt lịch linh hoạt, reset daySchedules
      if (field === "flexibleSchedule") {
        if (!value) {
          // Tắt lịch linh hoạt: xóa daySchedules
          newData.daySchedules = {};
        }
      }

      // Nếu thay đổi thời gian cho một thứ cụ thể
      if (field.startsWith("daySchedule_")) {
        const dayOfWeek = parseInt(field.split("_")[1]);
        const timeSlot = value; // Format: "08:00-09:30"

        // Đảm bảo daySchedules tồn tại
        if (!newData.daySchedules) {
          newData.daySchedules = {};
        }

        if (timeSlot && timeSlot.includes("-")) {
          const [start, end] = timeSlot.split("-");
          if (start && end) {
            newData.daySchedules[dayOfWeek] = {
              start: start.trim(),
              end: end.trim(),
            };
          }
        } else {
          // Xóa lịch cho thứ này nếu không hợp lệ
          delete newData.daySchedules[dayOfWeek];
        }
      }

      return newData;
    });
  };

  const handleContactTutor = () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để liên hệ với gia sư");
      navigate("/signin", { state: { from: window.location.pathname } });
      return;
    }
    openChat(tutor, currentUser);
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `Hồ sơ gia sư ${tutor.name}`,
        text: `Xem hồ sơ gia sư ${tutor.name} trên EduMatch`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert("Đã sao chép link hồ sơ vào clipboard!");
      });
    }
  };

  const handleReportProfile = () => {
    const reason = prompt("Vui lòng cho biết lý do báo cáo:");
    if (reason && reason.trim()) {
      alert(
        "Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất."
      );
    }
  };

  if (loading) {
    return (
      <div className="tutor-profile-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin gia sư...</p>
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="tutor-profile-error">
        <div className="error-content">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Không tìm thấy gia sư</h3>
          <p>{error || "Gia sư này không tồn tại hoặc đã bị xóa"}</p>
          <button onClick={() => navigate("/tutor")} className="back-btn">
            Quay lại danh sách gia sư
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tutor-profile-page">
      {/* Page Title */}
      <div className="page-title">
        <h1>Hồ sơ gia sư</h1>
      </div>

      {/* Compact Header Section */}
      <div
        className="tutor-profile-header"
        style={{ margin: "0 24px 40px 24px" }}
      >
        <div className="container">
          <div className="tutor-header-content">
            <div className="tutor-avatar-section">
              <div className="tutor-avatar">
                <Suspense
                  fallback={
                    <div className="avatar-placeholder">
                      <i className="fas fa-user"></i>
                    </div>
                  }
                >
                  {tutor.avatar ? (
                    <LazyImage
                      src={tutor.avatar}
                      alt={tutor.name}
                      className="tutor-avatar-img"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                </Suspense>
                {/* Nút yêu thích */}
                <button
                  className={`favorite-heart-btn ${isFavorite ? "active" : ""}`}
                  onClick={handleToggleFavorite}
                  title={
                    isFavorite
                      ? "Xóa khỏi danh sách yêu thích"
                      : "Thêm vào yêu thích"
                  }
                >
                  <i className={`${isFavorite ? "fas" : "far"} fa-heart`}></i>
                </button>
                {/* Verified badge nếu cần */}
                {tutor.verified && (
                  <div className="verified-badge">
                    <i className="fas fa-check-circle"></i>
                  </div>
                )}
              </div>

              {/* Contact Information Only */}
              <div className="contact-info">
                <div className="contact-item">
                  <span className="contact-label">Email:</span>
                  <span>
                    {tutor.contactInfo?.email || tutor.email || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="contact-item">
                  <span className="contact-label">Số điện thoại:</span>
                  <span>
                    {tutor.contactInfo?.phone || tutor.phone || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="contact-item">
                  <span className="contact-label">Địa chỉ:</span>
                  <span>
                    {tutor.contactInfo?.address ||
                      tutor.location ||
                      "Chưa cập nhật"}
                  </span>
                </div>
              </div>
            </div>

            <div className="tutor-basic-info">
              <h1 className="tutor-name">{tutor.name}</h1>

              <div className="tutor-location">
                <i className="fas fa-map-marker-alt"></i>
                <span>{tutor.location}</span>
              </div>

              <div className="tutor-subjects">
                {Array.isArray(tutor.subjects) && tutor.subjects.length > 0 ? (
                  tutor.subjects.map((subject, index) => (
                    <span key={index} className="subject-tag">
                      {typeof subject === "string" ? subject : subject.name}
                    </span>
                  ))
                ) : (
                  <span className="no-subjects">Chưa cập nhật môn dạy</span>
                )}
              </div>

              <div className="tutor-rating">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fas fa-star ${
                        i < Math.floor(tutor.rating) ? "filled" : ""
                      }`}
                    />
                  ))}
                </div>
                <span className="rating-value">{tutor.rating}</span>
                <span className="review-count">
                  ({tutor.reviewCount} đánh giá)
                </span>
              </div>

              <div className="tutor-experience">
                <i className="fas fa-graduation-cap"></i>
                <span>{tutor.experience} kinh nghiệm</span>
              </div>

              <div className="tutor-price">
                <span className="price-label">Học phí:</span>
                <span className="price-value">
                  {tutor.price.toLocaleString()}đ
                </span>
                <span className="price-unit">/buổi</span>
              </div>
            </div>

            <div className="tutor-actions">
              <button onClick={handleBookSession} className="btn btn-primary">
                <i className="fas fa-calendar-plus"></i>
                Đặt lịch học
              </button>
              <button onClick={handleContactTutor} className="btn btn-outline">
                <i className="fas fa-comments"></i>
                Liên hệ
              </button>
              <button onClick={handleShareProfile} className="btn btn-outline">
                <i className="fas fa-share-alt"></i>
                Chia sẻ hồ sơ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="tutor-profile-content">
        <div className="container">
          <div className="tutor-content-layout">
            <div className="tutor-main-content">
              {/* Navigation Tabs */}
              <div className="tutor-tabs">
                <button
                  className={`tab-btn ${activeTab === "about" ? "active" : ""}`}
                  onClick={() => setActiveTab("about")}
                >
                  <span>Giới thiệu</span>
                </button>
                <button
                  className={`tab-btn ${
                    activeTab === "subjects" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("subjects")}
                >
                  <span>Môn dạy</span>
                </button>
                <button
                  className={`tab-btn ${
                    activeTab === "reviews" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("reviews")}
                >
                  <span>Đánh giá</span>
                </button>
                <button
                  className={`tab-btn ${
                    activeTab === "courses" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("courses");
                    if (courses.length === 0) loadTutorCourses();
                  }}
                >
                  <span>Khóa học ({courses.length})</span>
                </button>
                <button
                  className={`tab-btn ${
                    activeTab === "schedule" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("schedule");
                    if (availability.slots.length === 0) loadAvailability();
                  }}
                >
                  <span>Lịch dạy</span>
                </button>
                <button
                  className={`tab-btn ${
                    activeTab === "certifications" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("certifications")}
                >
                  <span>Chứng chỉ</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === "about" && (
                  <div className="about-section">
                    <h3>Giới thiệu</h3>
                    <div className="bio-content">
                      <p>{tutor.bio}</p>
                    </div>

                    <div className="tutor-details-grid">
                      <div className="detail-item">
                        <div className="icon-wrapper">
                          <i className="fas fa-graduation-cap"></i>
                        </div>
                        <div>
                          <h4>Kinh nghiệm</h4>
                          <p>{tutor.experience}</p>
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="icon-wrapper">
                          <i className="fas fa-video"></i>
                        </div>
                        <div>
                          <h4>Hình thức dạy</h4>
                          <p>
                            {tutor.teachModes?.includes("online") &&
                              "Trực tuyến"}
                            {tutor.teachModes?.includes("online") &&
                              tutor.teachModes?.includes("offline") &&
                              ", "}
                            {tutor.teachModes?.includes("offline") &&
                              "Trực tiếp"}
                            {(!tutor.teachModes ||
                              tutor.teachModes.length === 0) &&
                              "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="icon-wrapper">
                          <i className="fas fa-language"></i>
                        </div>
                        <div>
                          <h4>Ngôn ngữ</h4>
                          <p>{tutor.languages?.join(", ") || "Tiếng Việt"}</p>
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="icon-wrapper">
                          <i className="fas fa-university"></i>
                        </div>
                        <div>
                          <h4>Học vấn</h4>
                          <p>{tutor.education}</p>
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="icon-wrapper">
                          <i className="fas fa-chalkboard-teacher"></i>
                        </div>
                        <div>
                          <h4>Phong cách dạy</h4>
                          <p>{tutor.teachingStyle}</p>
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="icon-wrapper">
                          <i className="fas fa-clock"></i>
                        </div>
                        <div>
                          <h4>Thời gian rảnh</h4>
                          <p>
                            {Array.isArray(tutor.availability) &&
                            tutor.availability.length > 0
                              ? tutor.availability
                                  .map((slot) => {
                                    const daysVN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]; // 0..6
                                    const mapStr = {
                                      sunday: 0, sun: 0,
                                      monday: 1, mon: 1, "t2": 1,
                                      tuesday: 2, tue: 2, "t3": 2,
                                      wednesday: 3, wed: 3, "t4": 3,
                                      thursday: 4, thu: 4, "t5": 4,
                                      friday: 5, fri: 5, "t6": 5,
                                      saturday: 6, sat: 6, "t7": 6,
                                    };
                                    let d = slot.dayOfWeek ?? slot.day ?? slot.weekday ?? slot.dow;
                                    if (typeof d === "string") d = mapStr[d.toLowerCase()] ?? 0;
                                    if (typeof d === "number") {
                                      // Accept 1..7 or 0..6
                                      d = d === 7 ? 0 : d;
                                    } else {
                                      d = 0;
                                    }
                                    const label = daysVN[d] || "CN";
                                    const start = slot.start || slot.startTime || slot.from || "";
                                    const end = slot.end || slot.endTime || slot.to || "";
                                    return `${label}: ${start}-${end}`;
                                  })
                                  .join(", ")
                              : tutor.availability || "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Thành tích và chứng chỉ */}
                    {tutor.achievements && tutor.achievements.length > 0 && (
                      <div className="achievements-section">
                        <h4>Thành tích nổi bật</h4>
                        <ul className="achievements-list">
                          {tutor.achievements.map((achievement, index) => (
                            <li key={index}>
                              <i className="fas fa-trophy"></i>
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Portfolio */}
                    {tutor.portfolio && tutor.portfolio.length > 0 && (
                      <div className="portfolio-section">
                        <h4>Portfolio</h4>
                        <div className="portfolio-grid">
                          {tutor.portfolio.map((item, index) => (
                            <div key={index} className="portfolio-item">
                              {item.image && (
                                <img
                                  src={
                                    item.image.startsWith("http")
                                      ? item.image
                                      : `${
                                          process.env.REACT_APP_API_BASE_URL ||
                                          "http://localhost:5000"
                                        }/${item.image.replace(/^\/?/, "")}`
                                  }
                                  alt={item.title || `Portfolio ${index + 1}`}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              )}
                              <div className="portfolio-info">
                                <h5>{item.title || `Dự án ${index + 1}`}</h5>
                                <p>{item.description || "Mô tả dự án"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "subjects" && (
                  <div className="subjects-section">
                    <h3>Môn học</h3>
                    <div className="subjects-grid">
                      {tutor.subjects.map((subject) => {
                        // Count courses for this subject
                        const subjectCourses = courses.filter((course) =>
                          course.courseName
                            ?.toLowerCase()
                            .includes(subject.name.toLowerCase())
                        );

                        return (
                          <div key={subject.name} className="subject-card">
                            <div className="subject-header">
                              <h4>{subject.name}</h4>
                              <span className="subject-price">
                                {subject.price.toLocaleString()}đ/buổi
                              </span>
                            </div>
                            <div className="subject-details">
                              <p>
                                <strong>Trình độ:</strong> {subject.level}
                              </p>
                              {subject.description && (
                                <p>
                                  <strong>Mô tả:</strong> {subject.description}
                                </p>
                              )}
                            </div>
                            {subjectCourses.length > 0 && (
                              <div className="subject-courses-count">
                                <i className="fas fa-book"></i>
                                <span>
                                  {subjectCourses.length} khóa học đang mở
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="reviews-section">
                    <h3>Đánh giá ({tutor.reviewCount})</h3>
                    <div className="reviews-summary">
                      <div className="rating-breakdown">
                        <div className="rating-item">
                          <span>5 sao</span>
                          <div className="rating-bar">
                            <div
                              className="rating-fill"
                              style={{ width: "80%" }}
                            ></div>
                          </div>
                          <span>80%</span>
                        </div>
                        <div className="rating-item">
                          <span>4 sao</span>
                          <div className="rating-bar">
                            <div
                              className="rating-fill"
                              style={{ width: "15%" }}
                            ></div>
                          </div>
                          <span>15%</span>
                        </div>
                        <div className="rating-item">
                          <span>3 sao</span>
                          <div className="rating-bar">
                            <div
                              className="rating-fill"
                              style={{ width: "3%" }}
                            ></div>
                          </div>
                          <span>3%</span>
                        </div>
                        <div className="rating-item">
                          <span>2 sao</span>
                          <div className="rating-bar">
                            <div
                              className="rating-fill"
                              style={{ width: "1%" }}
                            ></div>
                          </div>
                          <span>1%</span>
                        </div>
                        <div className="rating-item">
                          <span>1 sao</span>
                          <div className="rating-bar">
                            <div
                              className="rating-fill"
                              style={{ width: "1%" }}
                            ></div>
                          </div>
                          <span>1%</span>
                        </div>
                      </div>
                    </div>

                    <div className="reviews-list">
                      {/* Mock reviews - sẽ thay bằng API thật */}
                      <div className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <div className="reviewer-avatar">
                              <img
                                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face"
                                alt="Reviewer"
                              />
                            </div>
                            <div>
                              <h4>Nguyễn Văn A</h4>
                              <div className="review-rating">
                                {[...Array(5)].map((_, i) => (
                                  <i key={i} className="fas fa-star filled"></i>
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="review-date">2 ngày trước</span>
                        </div>
                        <p className="review-text">
                          Thầy dạy rất hay và dễ hiểu. Em đã cải thiện điểm số
                          Toán rất nhiều sau khi học với thầy.
                        </p>
                      </div>

                      <div className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <div className="reviewer-avatar">
                              <img
                                src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
                                alt="Reviewer"
                              />
                            </div>
                            <div>
                              <h4>Trần Thị B</h4>
                              <div className="review-rating">
                                {[...Array(5)].map((_, i) => (
                                  <i key={i} className="fas fa-star filled"></i>
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="review-date">1 tuần trước</span>
                        </div>
                        <p className="review-text">
                          Gia sư rất tận tâm và kiên nhẫn. Con tôi rất thích học
                          với cô.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "courses" && (
                  <div className="courses-section">
                    <div className="courses-header">
                      <h3>Khóa học đang mở</h3>
                      {tutor.isOwnProfile && (
                        <div className="course-actions">
                          <button
                            className="create-course-btn"
                            onClick={() => navigate("/tutor/publish-slot")}
                          >
                            <i className="fas fa-plus"></i>
                            Tạo khóa học mới
                          </button>
                          <button
                            className="manage-course-btn"
                            onClick={() => navigate("/tutor/schedule")}
                          >
                            <i className="fas fa-cog"></i>
                            Quản lý khóa học
                          </button>
                        </div>
                      )}
                    </div>
                    {coursesLoading ? (
                      <div className="loading-courses">
                        <div className="spinner"></div>
                        <div className="loading-text">Đang tải khóa học...</div>
                      </div>
                    ) : courses.length > 0 ? (
                      <div className="courses-grid">
                        {courses.map((course) => (
                          <div key={course.id} className="course-card">
                            <div className="course-header">
                              <h4 className="course-title">
                                {course.courseName}
                              </h4>
                              <div className="course-price">
                                {course.price
                                  ? `${course.price.toLocaleString()}`
                                  : "Liên hệ"}
                              </div>
                            </div>

                            <div className="course-details">
                              <div className="detail-item">
                                <i className="fas fa-calendar icon"></i>
                                <span className="detail-text">
                                  {new Date(course.start).toLocaleDateString(
                                    "vi-VN",
                                    {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  )}
                                </span>
                              </div>
                              <div className="detail-item">
                                <i className="fas fa-clock icon"></i>
                                <span className="detail-text">
                                  {new Date(course.start).toLocaleTimeString(
                                    "vi-VN",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}{" "}
                                  -{" "}
                                  {new Date(course.end).toLocaleTimeString(
                                    "vi-VN",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                              <div className="detail-item">
                                <i
                                  className={`fas ${
                                    course.mode === "online"
                                      ? "fa-video"
                                      : "fa-map-marker-alt"
                                  } icon`}
                                ></i>
                                <span className="detail-text">
                                  {course.mode === "online"
                                    ? "Trực tuyến"
                                    : course.location || "Tại nhà"}
                                </span>
                              </div>
                              <div className="detail-item">
                                <i className="fas fa-users icon"></i>
                                <span className="detail-text">
                                  Tối đa {course.capacity} học viên
                                </span>
                              </div>
                            </div>

                            {course.notes && (
                              <div className="course-notes">
                                <p>{course.notes}</p>
                              </div>
                            )}

                            <button
                              className="book-btn"
                              onClick={() => handleBookSession()}
                            >
                              Đặt lịch học
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-courses">
                        <div className="icon">🎓</div>
                        <h4>Chưa có khóa học nào</h4>
                        <p>
                          Gia sư chưa đăng khóa học nào. Vui lòng liên hệ trực
                          tiếp để đặt lịch.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "schedule" && (
                  <div className="schedule-section">
                    <h3>Lịch của gia sư</h3>

                    {availabilityLoading ? (
                      <div className="loading-spinner">Đang tải lịch trống...</div>
                    ) : (
                      <Timetable
                        available={availability.slots || []}
                        booked={availability.booked || []}
                        onPick={(slot) => handleSelectSlot(slot)}
                      />
                    )}
                  </div>
                )}

                {activeTab === "certifications" && (
                  <div className="certifications-section">
                    <h3>Chứng chỉ & Bằng cấp</h3>

                    {/* Bằng cấp học vấn */}
                    {tutor.verification && (
                      <div className="verification-section">
                        <h4>Xác minh danh tính</h4>
                        <div className="verification-grid">
                          <div className="verification-item">
                            <div className="verification-icon">
                              <i className="fas fa-graduation-cap"></i>
                            </div>
                            <div className="verification-content">
                              <h5>Bằng cấp học vấn</h5>
                              <p>Bằng đại học, thạc sĩ, tiến sĩ</p>
                              <span
                                className={`verification-status ${tutor.degreeStatus}`}
                              >
                                {tutor.degreeStatus === "verified"
                                  ? "Đã xác minh"
                                  : tutor.degreeStatus === "rejected"
                                  ? "Bị từ chối"
                                  : "Chờ xác minh"}
                              </span>
                            </div>
                            <div
                              className={`verification-badge ${tutor.degreeStatus}`}
                            >
                              <i
                                className={`fas ${
                                  tutor.degreeStatus === "verified"
                                    ? "fa-check-circle"
                                    : tutor.degreeStatus === "rejected"
                                    ? "fa-times-circle"
                                    : "fa-hourglass-half"
                                }`}
                              ></i>
                            </div>
                          </div>

                          <div className="verification-item">
                            <div className="verification-icon">
                              <i className="fas fa-id-card"></i>
                            </div>
                            <div className="verification-content">
                              <h5>CMND/CCCD</h5>
                              <p>Giấy tờ tùy thân</p>
                              <span
                                className={`verification-status ${tutor.idStatus}`}
                              >
                                {tutor.idStatus === "verified"
                                  ? "Đã xác minh"
                                  : tutor.idStatus === "rejected"
                                  ? "Bị từ chối"
                                  : "Chờ xác minh"}
                              </span>
                            </div>
                            <div
                              className={`verification-badge ${tutor.idStatus}`}
                            >
                              <i
                                className={`fas ${
                                  tutor.idStatus === "verified"
                                    ? "fa-check-circle"
                                    : tutor.idStatus === "rejected"
                                    ? "fa-times-circle"
                                    : "fa-hourglass-half"
                                }`}
                              ></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chứng chỉ từ dữ liệu */}
                    {tutor.certificates && tutor.certificates.length > 0 ? (
                      <div className="certificates-section">
                        <h4>Chứng chỉ chuyên môn</h4>
                        <div className="certifications-grid">
                          {tutor.certificates.map((cert, index) => (
                            <div key={index} className="certification-card">
                              <div className="cert-icon">
                                <i className="fas fa-certificate"></i>
                              </div>
                              <div className="cert-content">
                                <h5>
                                  {cert.name ||
                                    cert.title ||
                                    `Chứng chỉ ${index + 1}`}
                                </h5>
                                <p>
                                  {cert.description ||
                                    cert.issuer ||
                                    "Chứng chỉ chuyên môn"}
                                </p>
                                <span className="cert-date">
                                  {cert.date || cert.year || "N/A"}
                                </span>
                              </div>
                              <div className="cert-badge verified">
                                <i className="fas fa-check-circle"></i>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="no-certificates">
                        <i className="fas fa-certificate"></i>
                        <h4>Chưa có chứng chỉ</h4>
                        <p>Gia sư chưa cập nhật chứng chỉ chuyên môn</p>
                      </div>
                    )}

                    {/* Bằng cấp từ dữ liệu */}
                    {tutor.degrees && tutor.degrees.length > 0 && (
                      <div className="degrees-section">
                        <h4>Bằng cấp học vấn</h4>
                        <div className="certifications-grid">
                          {tutor.degrees.map((degree, index) => (
                            <div key={index} className="certification-card">
                              <div className="cert-icon">
                                <i className="fas fa-graduation-cap"></i>
                              </div>
                              <div className="cert-content">
                                <h5>
                                  {degree.name ||
                                    degree.title ||
                                    `Bằng cấp ${index + 1}`}
                                </h5>
                                <p>
                                  {degree.school ||
                                    degree.institution ||
                                    "Trường đại học"}
                                </p>
                                <span className="cert-date">
                                  {degree.year || degree.date || "N/A"}
                                </span>
                              </div>
                              <div className="cert-badge verified">
                                <i className="fas fa-check-circle"></i>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="tutor-sidebar">
              <div className="sidebar-card">
                <h3>Thông tin liên hệ</h3>
                <div className="contact-info">
                  <div className="contact-item">
                    <span className="contact-label">Email:</span>
                    <span>
                      {tutor.contactInfo?.email ||
                        tutor.email ||
                        "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Số điện thoại:</span>
                    <span>
                      {tutor.contactInfo?.phone ||
                        tutor.phone ||
                        "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Địa chỉ:</span>
                    <span>
                      {tutor.contactInfo?.address ||
                        tutor.location ||
                        "Chưa cập nhật"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sidebar-card">
                <h3>Thống kê</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{tutor.reviewCount}</span>
                    <span className="stat-label">Đánh giá</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{tutor.experience}</span>
                    <span className="stat-label">Kinh nghiệm</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{tutor.subjects.length}</span>
                    <span className="stat-label">Môn dạy</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{tutor.rating}</span>
                    <span className="stat-label">Đánh giá TB</span>
                  </div>
                </div>
              </div>

              <div className="sidebar-card">
                <h3>Thông tin bổ sung</h3>
                <div className="additional-info">
                  <div className="info-item">
                    <i className="fas fa-graduation-cap"></i>
                    <div>
                      <span className="info-label">Học vấn</span>
                      <span className="info-value">{tutor.education}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-language"></i>
                    <div>
                      <span className="info-label">Ngôn ngữ</span>
                      <span className="info-value">
                        {tutor.languages?.join(", ") || "Tiếng Việt"}
                      </span>
                    </div>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-clock"></i>
                    <div>
                      <span className="info-label">Thời gian rảnh</span>
                      <span className="info-value">
                        {Array.isArray(tutor.availability) && tutor.availability.length > 0
                          ? tutor.availability
                              .map((slot) => {
                                const daysVN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]; // 0..6
                                const mapStr = {
                                  sunday: 0, sun: 0,
                                  monday: 1, mon: 1, "t2": 1,
                                  tuesday: 2, tue: 2, "t3": 2,
                                  wednesday: 3, wed: 3, "t4": 3,
                                  thursday: 4, thu: 4, "t5": 4,
                                  friday: 5, fri: 5, "t6": 5,
                                  saturday: 6, sat: 6, "t7": 6,
                                };
                                let d = slot.dayOfWeek ?? slot.day ?? slot.weekday ?? slot.dow;
                                if (typeof d === "string") d = mapStr[d.toLowerCase()] ?? 0;
                                if (typeof d === "number") d = d === 7 ? 0 : d;
                                const label = daysVN[d] || "CN";
                                const start = slot.start || slot.startTime || slot.from || "";
                                const end = slot.end || slot.endTime || slot.to || "";
                                return `${label}: ${start}-${end}`;
                              })
                              .join(", ")
                          : tutor.availability || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sidebar-card">
                <h3>Xác minh</h3>
                <div className="verification-info">
                  <div className="verification-item">
                    <i
                      className={`fas ${
                        tutor.verified ? "fa-check-circle" : "fa-hourglass-half"
                      }`}
                    ></i>
                    <span>
                      {tutor.verified ? "Đã xác minh" : "Chờ xác minh"}
                    </span>
                  </div>
                  {tutor.degreeStatus && (
                    <div className="verification-item">
                      <i
                        className={`fas ${
                          tutor.degreeStatus === "verified"
                            ? "fa-check-circle"
                            : "fa-hourglass-half"
                        }`}
                      ></i>
                      <span>
                        Bằng cấp:{" "}
                        {tutor.degreeStatus === "verified"
                          ? "Đã xác minh"
                          : "Chờ xác minh"}
                      </span>
                    </div>
                  )}
                  {tutor.idStatus && (
                    <div className="verification-item">
                      <i
                        className={`fas ${
                          tutor.idStatus === "verified"
                            ? "fa-check-circle"
                            : "fa-hourglass-half"
                        }`}
                      ></i>
                      <span>
                        CMND:{" "}
                        {tutor.idStatus === "verified"
                          ? "Đã xác minh"
                          : "Chờ xác minh"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div
          className="booking-modal-overlay"
          onClick={() => setShowBookingForm(false)}
        >
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đặt lịch học với {tutor.name}</h3>
              <button
                onClick={() => setShowBookingForm(false)}
                className="close-btn"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <form
                onSubmit={(e) => {
                  console.log("📝 Form submit event triggered!", e);
                  console.log("📝 Form validity:", e.target.checkValidity());
                  console.log(
                    "📝 Form elements:",
                    Array.from(e.target.elements).map((el) => ({
                      name: el.name || el.id,
                      value: el.value,
                      validity: el.validity?.valid,
                      validationMessage: el.validationMessage,
                    }))
                  );
                  handleBookingSubmit(e);
                }}
                className="booking-form"
              >
                <div className="form-group">
                  <label htmlFor="subject">Chọn môn học *</label>
                  <select
                    id="subject"
                    value={bookingData.subject?.name || ""}
                    onChange={(e) => {
                      const selectedSubject = tutor.subjects.find(
                        (s) => s.name === e.target.value
                      );
                      // Lưu toàn bộ object subject
                      handleBookingInputChange("subject", selectedSubject);
                      // Cập nhật giá khi chọn môn học
                      if (selectedSubject) {
                        handleBookingInputChange(
                          "pricePerSession",
                          selectedSubject.price
                        );
                        handleBookingInputChange(
                          "totalPrice",
                          selectedSubject.price * bookingData.numberOfSessions
                        );
                      }
                    }}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "10px",
                      fontSize: "15px",
                      marginBottom: "16px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <option value="">-- Chọn môn học --</option>
                    {tutor.subjects?.map((subject, index) => (
                      <option key={index} value={subject.name}>
                        {subject.name}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="start-time">
                    Thời gian bắt đầu buổi học đầu tiên *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="date"
                      id="start-time"
                      value={
                        bookingData.start ? bookingData.start.split("T")[0] : ""
                      }
                      onChange={(e) => {
                        const date = e.target.value;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Set time to midnight for date comparison
                        const selectedDate = new Date(date);
                        selectedDate.setHours(0, 0, 0, 0);

                        // Nếu chọn ngày trong quá khứ, set về ngày hiện tại
                        if (selectedDate < today) {
                          const currentDate = new Date()
                            .toISOString()
                            .split("T")[0];
                          handleBookingInputChange(
                            "start",
                            `${currentDate}T08:00`
                          );
                          alert("Không thể chọn ngày trong quá khứ!");
                          return;
                        }

                        const fullDateTime = `${date}T08:00`; // Default to 8:00 AM
                        handleBookingInputChange("start", fullDateTime);
                      }}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "2px solid #e5e7eb",
                        borderRadius: "10px",
                        fontSize: "15px",
                        transition: "all 0.3s ease",
                        backgroundColor: "#fafafa",
                      }}
                    />
                    <i
                      className="fas fa-calendar-alt"
                      style={{
                        position: "absolute",
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6b7280",
                        fontSize: "16px",
                      }}
                    ></i>
                  </div>
                  <small
                    style={{
                      color: "#6b7280",
                      fontSize: "13px",
                      display: "block",
                      marginTop: "6px",
                    }}
                  >
                    📅 Thời gian bắt đầu của buổi học đầu tiên
                  </small>
                </div>

                <div className="form-group">
                  <label
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "12px",
                      display: "block",
                    }}
                  >
                    Các thứ trong tuần muốn học *
                  </label>
                  {/* Hiển thị thông tin học phí */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "10px",
                      marginBottom: "12px",
                    }}
                  >
                    {[
                      { value: 1, label: "T2", color: "#3b82f6" },
                      { value: 2, label: "T3", color: "#10b981" },
                      { value: 3, label: "T4", color: "#f59e0b" },
                      { value: 4, label: "T5", color: "#ef4444" },
                      { value: 5, label: "T6", color: "#8b5cf6" },
                      { value: 6, label: "T7", color: "#06b6d4" },
                      { value: 0, label: "CN", color: "#f97316" },
                    ].map((day) => (
                      <label
                        key={day.value}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "12px 8px",
                          border: "2px solid #e5e7eb",
                          borderRadius: "12px",
                          cursor: "pointer",
                          backgroundColor: bookingData.weeklySchedule?.includes(
                            day.value
                          )
                            ? day.color
                            : "white",
                          borderColor: bookingData.weeklySchedule?.includes(
                            day.value
                          )
                            ? day.color
                            : "#e5e7eb",
                          transition: "all 0.3s ease",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            bookingData.weeklySchedule?.includes(day.value) ||
                            false
                          }
                          onChange={(e) => {
                            const newSchedule = e.target.checked
                              ? [
                                  ...(bookingData.weeklySchedule || []),
                                  day.value,
                                ]
                              : (bookingData.weeklySchedule || []).filter(
                                  (d) => d !== day.value
                                );
                            handleBookingInputChange(
                              "weeklySchedule",
                              newSchedule
                            );
                          }}
                          style={{
                            position: "absolute",
                            opacity: 0,
                            width: "100%",
                            height: "100%",
                            margin: 0,
                            cursor: "pointer",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: bookingData.weeklySchedule?.includes(
                              day.value
                            )
                              ? "white"
                              : "#374151",
                            textAlign: "center",
                            zIndex: 1,
                          }}
                        >
                          {day.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <small
                    style={{
                      color: "#6b7280",
                      fontSize: "13px",
                      display: "block",
                    }}
                  >
                    ✨ Chọn các thứ trong tuần bạn muốn học (tối thiểu 1 thứ)
                  </small>
                </div>

                <div
                  className="form-group"
                  style={{
                    background:
                      "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                    border: "2px solid #0ea5e9",
                    borderRadius: "12px",
                    padding: "16px",
                    margin: "16px 0",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={bookingData.flexibleSchedule}
                      onChange={(e) =>
                        handleBookingInputChange(
                          "flexibleSchedule",
                          e.target.checked
                        )
                      }
                      style={{
                        width: "20px",
                        height: "20px",
                        accentColor: "#0ea5e9",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#0c4a6e",
                      }}
                    >
                      🎯 Lịch học linh hoạt
                    </span>
                  </label>
                  <p
                    style={{
                      color: "#0c4a6e",
                      fontSize: "14px",
                      margin: "0 0 0 32px",
                      lineHeight: "1.5",
                    }}
                  >
                    Bật tính năng này để chọn thời gian học riêng cho từng thứ
                    <br />
                    <strong>Ví dụ:</strong> T2 học 8h-9h30, T3 học 18h-19h30
                  </p>
                </div>

                {/* Hiển thị form chọn thời gian cho từng thứ khi bật lịch linh hoạt */}
                {bookingData.flexibleSchedule &&
                  bookingData.weeklySchedule?.length > 0 && (
                    <div
                      className="form-group"
                      style={{
                        background: "#f8fafc",
                        border: "2px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "20px",
                        margin: "16px 0",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "16px",
                          display: "block",
                        }}
                      >
                        ⏰ Thời gian học cho từng thứ *
                      </label>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {bookingData.weeklySchedule.map((dayOfWeek) => (
                          <div
                            key={dayOfWeek}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                              padding: "16px",
                              border: "2px solid #e5e7eb",
                              borderRadius: "10px",
                              backgroundColor: "white",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                            }}
                          >
                            <div
                              style={{
                                minWidth: "80px",
                                fontWeight: "600",
                                fontSize: "15px",
                                textAlign: "center",
                                padding: "8px 12px",
                                background:
                                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "white",
                                borderRadius: "8px",
                              }}
                            >
                              {getDayName(dayOfWeek)}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flex: 1,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <input
                                  type="time"
                                  value={
                                    bookingData.daySchedules?.[dayOfWeek]
                                      ?.start || ""
                                  }
                                  onChange={(e) => {
                                    const startTime = e.target.value;
                                    const endTime =
                                      bookingData.daySchedules?.[dayOfWeek]
                                        ?.end || "";
                                    // Khi thay đổi giờ bắt đầu
                                    const newStartTime = startTime;
                                    const currentEndTime =
                                      bookingData.daySchedules?.[dayOfWeek]
                                        ?.end;

                                    // Tự động tính giờ kết thúc là 2h30 sau giờ bắt đầu
                                    if (newStartTime) {
                                      const [hours, minutes] =
                                        newStartTime.split(":");
                                      const startDate = new Date();
                                      startDate.setHours(
                                        parseInt(hours),
                                        parseInt(minutes),
                                        0
                                      );

                                      const endDate = new Date(
                                        startDate.getTime() +
                                          2.5 * 60 * 60 * 1000
                                      );
                                      const endHours = String(
                                        endDate.getHours()
                                      ).padStart(2, "0");
                                      const endMinutes = String(
                                        endDate.getMinutes()
                                      ).padStart(2, "0");
                                      const newEndTime = `${endHours}:${endMinutes}`;

                                      handleBookingInputChange(
                                        `daySchedule_${dayOfWeek}`,
                                        `${newStartTime}-${newEndTime}`
                                      );
                                    } else {
                                      handleBookingInputChange(
                                        `daySchedule_${dayOfWeek}`,
                                        `${startTime}-${endTime}`
                                      );
                                    }
                                  }}
                                  style={{
                                    padding: "12px 16px",
                                    border: "2px solid #d1d5db",
                                    borderRadius: "8px",
                                    fontSize: "15px",
                                    width: "120px",
                                    transition: "all 0.3s ease",
                                  }}
                                />
                                <span>-</span>
                                <input
                                  type="time"
                                  value={
                                    bookingData.daySchedules?.[dayOfWeek]
                                      ?.end || ""
                                  }
                                  readOnly
                                  onChange={(e) => {
                                    const startTime =
                                      bookingData.daySchedules?.[dayOfWeek]
                                        ?.start || "";
                                    const endTime = e.target.value;
                                    handleBookingInputChange(
                                      `daySchedule_${dayOfWeek}`,
                                      `${startTime}-${endTime}`
                                    );
                                  }}
                                  style={{
                                    padding: "12px 16px",
                                    border: "2px solid #d1d5db",
                                    borderRadius: "8px",
                                    fontSize: "15px",
                                    width: "120px",
                                    transition: "all 0.3s ease",
                                  }}
                                />
                              </div>
                              <small
                                style={{
                                  color: "#6b7280",
                                  fontSize: "12px",
                                  fontStyle: "italic",
                                }}
                              ></small>
                            </div>
                          </div>
                        ))}
                      </div>
                      <small
                        style={{
                          color: "#6b7280",
                          fontSize: "13px",
                          display: "block",
                          marginTop: "12px",
                          textAlign: "center",
                        }}
                      >
                        💡 Nhập thời gian theo định dạng HH:MM-HH:MM cho từng
                        thứ đã chọn
                      </small>
                    </div>
                  )}

                <div className="form-group">
                  <label htmlFor="numberOfWeeks">Số tuần học *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      id="numberOfWeeks"
                      value={bookingData.numberOfWeeks}
                      onChange={(e) =>
                        handleBookingInputChange(
                          "numberOfWeeks",
                          e.target.value
                        )
                      }
                      min="1"
                      max="20"
                      required
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "2px solid #e5e7eb",
                        borderRadius: "10px",
                        fontSize: "15px",
                        transition: "all 0.3s ease",
                        backgroundColor: "#fafafa",
                      }}
                    />
                    <i
                      className="fas fa-calendar-week"
                      style={{
                        position: "absolute",
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6b7280",
                        fontSize: "16px",
                      }}
                    ></i>
                  </div>
                  <small
                    style={{
                      color: "#6b7280",
                      fontSize: "13px",
                      display: "block",
                      marginTop: "6px",
                    }}
                  >
                    📆 Số tuần học (tối đa 20 tuần)
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="numberOfSessions">
                    Tổng số buổi học (tự động tính)
                  </label>
                  <input
                    type="number"
                    id="numberOfSessions"
                    value={bookingData.numberOfSessions}
                    readOnly
                    style={{
                      backgroundColor: "#f0f9ff",
                      color: "#0c4a6e",
                      border: "2px solid #0ea5e9",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      fontSize: "15px",
                      fontWeight: "600",
                    }}
                  />
                  <small
                    style={{
                      color: "#0c4a6e",
                      fontSize: "13px",
                      display: "block",
                      marginTop: "6px",
                    }}
                  >
                    🧮 Tự động tính: {bookingData.weeklySchedule?.length || 0}{" "}
                    thứ/tuần × {bookingData.numberOfWeeks} tuần ={" "}
                    {bookingData.numberOfSessions} buổi
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="end-time">
                    Thời gian dự kiến kết thúc khóa học
                  </label>
                  <input
                    type="date"
                    id="end-time"
                    value={bookingData.end ? bookingData.end.split("T")[0] : ""}
                    onChange={(e) => {
                      const date = e.target.value;
                      const fullDateTime = `${date}T08:00`; // Default to 8:00 AM
                      handleBookingInputChange("end", fullDateTime);
                    }}
                    min={
                      bookingData.start
                        ? bookingData.start.split("T")[0]
                        : new Date().toISOString().split("T")[0]
                    }
                    required
                    readOnly
                  />
                  <small
                    style={{
                      color: "#6b7280",
                      fontSize: "12px",
                      display: "block",
                      marginTop: "4px",
                    }}
                  ></small>
                </div>

                <div className="form-group">
                  <label>Hình thức dạy học *</label>
                  <div
                    style={{ display: "flex", gap: "20px", marginTop: "10px" }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="mode"
                        value="online"
                        checked={bookingData.mode === "online"}
                        onChange={(e) =>
                          handleBookingInputChange("mode", e.target.value)
                        }
                        required
                        style={{ width: "20px", height: "20px" }}
                      />
                      <span style={{ fontSize: "15px" }}>Trực tuyến</span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="mode"
                        value="offline"
                        checked={bookingData.mode === "offline"}
                        onChange={(e) =>
                          handleBookingInputChange("mode", e.target.value)
                        }
                        required
                        style={{ width: "20px", height: "20px" }}
                      />
                      <span style={{ fontSize: "15px" }}>Trực tiếp</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Ghi chú (tùy chọn)</label>
                  <textarea
                    id="notes"
                    value={bookingData.notes}
                    onChange={(e) =>
                      handleBookingInputChange("notes", e.target.value)
                    }
                    placeholder="Nhập nội dung muốn học, mục tiêu, yêu cầu đặc biệt..."
                    rows="3"
                  />
                </div>

                <div
                  className="booking-summary"
                  style={{
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    border: "2px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "24px",
                    margin: "24px 0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#1e293b",
                      marginBottom: "20px",
                      textAlign: "center",
                      paddingBottom: "12px",
                      borderBottom: "2px solid #e2e8f0",
                    }}
                  >
                    📋 Tóm tắt đặt lịch học
                  </div>

                  <div style={{ display: "grid", gap: "12px" }}>
                    <div
                      className="summary-item"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        background: "white",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <span style={{ fontSize: "15px", color: "#6b7280" }}>
                        💰 Học phí 1 buổi:
                      </span>
                      <span
                        className="price"
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#059669",
                        }}
                      >
                        {tutor.price.toLocaleString()}đ
                      </span>
                    </div>

                    <div
                      className="summary-item"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        background: "white",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <span style={{ fontSize: "15px", color: "#6b7280" }}>
                        📅 Lịch học:
                      </span>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#374151",
                        }}
                      >
                        {bookingData.weeklySchedule?.length > 0
                          ? bookingData.weeklySchedule
                              .map((day) => getDayName(day))
                              .join(", ")
                          : "Chưa chọn"}
                      </span>
                    </div>

                    <div
                      className="summary-item"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        background: "white",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <span style={{ fontSize: "15px", color: "#6b7280" }}>
                        📆 Số tuần học:
                      </span>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#374151",
                        }}
                      >
                        {bookingData.numberOfWeeks} tuần
                      </span>
                    </div>

                    <div
                      className="summary-item"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        background: "white",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <span style={{ fontSize: "15px", color: "#6b7280" }}>
                        🎯 Tổng số buổi:
                      </span>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#374151",
                        }}
                      >
                        {bookingData.numberOfSessions} buổi (mỗi buổi 2h30)
                      </span>
                    </div>

                    <div
                      className="summary-item"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        background: "white",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <span style={{ fontSize: "15px", color: "#6b7280" }}>
                        ⏰ Thời gian khóa học :
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#374151",
                          textAlign: "right",
                        }}
                      >
                        {bookingData.start
                          ? new Date(bookingData.start).toLocaleDateString(
                              "vi-VN"
                            )
                          : "Chưa chọn"}
                        <br />
                        {bookingData.end
                          ? new Date(bookingData.end).toLocaleDateString(
                              "vi-VN"
                            )
                          : "Chưa tính"}
                      </span>
                    </div>
                  </div>

                  {/* Hiển thị lịch học chi tiết */}
                  {bookingData.start &&
                    bookingData.weeklySchedule?.length > 0 &&
                    bookingData.numberOfWeeks > 0 && (
                      <div
                        className="summary-item"
                        style={{
                          background:
                            "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                          border: "2px solid #0ea5e9",
                          borderRadius: "12px",
                          padding: "16px",
                          margin: "16px 0",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "600",
                            marginBottom: "12px",
                            color: "#0c4a6e",
                            fontSize: "16px",
                          }}
                        >
                          📅 Lịch học chi tiết:
                        </div>
                        <div style={{ fontSize: "13px", color: "#0c4a6e" }}>
                          {calculateWeeklySchedule(
                            bookingData.start,
                            bookingData.weeklySchedule,
                            bookingData.numberOfWeeks,
                            bookingData.flexibleSchedule,
                            bookingData.daySchedules
                          )
                            .slice(0, 5) // Chỉ hiển thị 5 buổi đầu
                            .map((session) => (
                              <div
                                key={session.start}
                                style={{
                                  marginBottom: "6px",
                                  padding: "8px 12px",
                                  background: "rgba(255,255,255,0.7)",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(14, 165, 233, 0.2)",
                                }}
                              >
                                <strong>Tuần {session.week}</strong> -{" "}
                                {getDayName(session.dayOfWeek)}:{" "}
                                {new Date(session.start).toLocaleString(
                                  "vi-VN"
                                )}
                                {session.customTime && (
                                  <span
                                    style={{
                                      color: "#059669",
                                      fontWeight: "600",
                                      marginLeft: "8px",
                                    }}
                                  >
                                    ({session.timeSlot})
                                  </span>
                                )}
                              </div>
                            ))}
                          {bookingData.numberOfSessions > 5 && (
                            <div
                              style={{
                                fontStyle: "italic",
                                marginTop: "8px",
                                padding: "8px 12px",
                                background: "rgba(255,255,255,0.5)",
                                borderRadius: "6px",
                                textAlign: "center",
                              }}
                            >
                              ... và {bookingData.numberOfSessions - 5} buổi học
                              khác
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  <div
                    className="summary-item"
                    style={{
                      borderTop: "3px solid #0ea5e9",
                      paddingTop: "16px",
                      marginTop: "16px",
                      background:
                        "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
                      borderRadius: "12px",
                      padding: "20px",
                      color: "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: "700", fontSize: "18px" }}>
                        💎 Tổng tiền:
                      </span>
                      <span
                        className="price"
                        style={{ fontSize: "24px", fontWeight: "800" }}
                      >
                        {(
                          tutor.price * (bookingData.numberOfSessions || 1)
                        ).toLocaleString()}
                        đ
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        opacity: 0.9,
                        marginTop: "8px",
                        textAlign: "center",
                      }}
                    >
                      Đã bao gồm tất cả buổi học trong{" "}
                      {bookingData.numberOfWeeks} tuần
                    </div>
                  </div>
                </div>

                {bookingError && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    {bookingError}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={bookingLoading}
                    style={{
                      backgroundColor: "#0ea5e9",
                      color: "white",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      width: "100%",
                      cursor: "pointer",
                      border: "none",
                      transition: "all 0.3s ease",
                    }}
                    onMouseDown={(e) => {
                      console.log("🖱️ Button MouseDown!");
                      const form = e.target.closest("form");
                      if (form) {
                        console.log("� Form found:", form);
                        console.log("� Form valid:", form.checkValidity());
                        console.log(
                          "� Form elements:",
                          Array.from(form.elements)
                        );
                      }
                    }}
                  >
                    {bookingLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-calendar-check"></i>
                        Xác nhận đặt lịch
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="cancel-btn"
                    disabled={bookingLoading}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Timetable component for schedule display
function Timetable({ available = [], booked = [], onPick }) {
  const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
  const [weekOffset, setWeekOffset] = React.useState(0);

  const getPeriod = (time) => {
    const [h] = String(time).split(":");
    const hour = parseInt(h || 0, 10);
    if (hour < 12) return "morning"; // 06-11
    if (hour < 18) return "afternoon"; // 12-17
    return "evening"; // 18-22
  };

  // Build map: dayIndex(1..7 with CN=7) -> { morning: [], afternoon: [], evening: [] }
  const initCell = () => ({ morning: [], afternoon: [], evening: [] });
  const grid = new Map();
  const addToGrid = (dateIso, start, end, type) => {
    const d = new Date(dateIso);
    // Convert Sunday(0) -> 7, Monday(1) -> 1..6
    let dayIdx = d.getDay();
    dayIdx = dayIdx === 0 ? 7 : dayIdx;
    const period = getPeriod(start);
    if (!grid.has(dayIdx)) grid.set(dayIdx, initCell());
    grid.get(dayIdx)[period].push({ date: dateIso, start, end, type });
  };

  // Week window
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const startOfWeekMon = (d) => {
    const x = new Date(d);
    const day = x.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday as start
    return addDays(x, diff);
  };
  const windowStart = addDays(startOfWeekMon(new Date()), weekOffset * 7);
  const windowEnd = addDays(windowStart, 7);

  const inWindow = (iso) => {
    const t = new Date(iso);
    return t >= windowStart && t < windowEnd;
  };

  available.filter((s) => inWindow(s.date)).forEach((s) => addToGrid(s.date, s.start, s.end, "available"));
  booked.filter((s) => inWindow(s.date)).forEach((s) => addToGrid(s.date, s.start, s.end, "booked"));

  const periods = [
    { key: "morning", label: "Sáng" },
    { key: "afternoon", label: "Chiều" },
    { key: "evening", label: "Tối" },
  ];

  const handleClick = (slot) => {
    if (slot.type !== "available") return;
    if (typeof onPick === "function") onPick(slot);
  };

  return (
    <div className="timetable">
      <div className="tt-legend">
        <span className="lg-item">
          <span className="lg-dot lg-available" /> Trống (màu xanh)
        </span>
        <span className="lg-item">
          <span className="lg-dot lg-booked" /> Đã bận (màu đỏ)
        </span>
        <span className="lg-item">
          <span className="lg-dot lg-empty" /> Chưa có lịch (màu trắng)
        </span>
      </div>
      <div className="tt-toolbar">
        <button
          className="tt-nav"
          disabled={weekOffset <= 0}
          onClick={() => setWeekOffset((v) => Math.max(0, v - 1))}
        >
          Tuần trước
        </button>
        <div className="tt-range">
          {windowStart.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
          {" - "}
          {addDays(windowStart, 6).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
        </div>
        <button className="tt-nav" onClick={() => setWeekOffset((v) => v + 1)}>
          Tuần sau
        </button>
      </div>
      <div className="tt-head">
        <div className="tt-cell tt-corner"></div>
        {days.map((d, i) => (
          <div key={i} className="tt-cell tt-day">{d}</div>
        ))}
      </div>
      {periods.map((p) => (
        <div key={p.key} className="tt-row">
          <div className="tt-cell tt-period">{p.label}</div>
          {days.map((_, colIdx) => {
            const dayIdx = colIdx + 1; // 1..7 (CN=7)
            const items = (grid.get(dayIdx) || {})[p.key] || [];
            if (items.length === 0) {
              return <div key={colIdx} className="tt-cell tt-empty" />;
            }
            return (
              <div key={colIdx} className="tt-cell tt-slotlist">
                {items.map((s, idx) => (
                  <div
                    key={idx}
                    className={`tt-slot ${s.type === "available" ? "tt-available" : "tt-booked"}`}
                    onClick={() => handleClick(s)}
                    role={s.type === "available" ? "button" : undefined}
                  >
                    <span className="tt-time">{s.start} – {s.end}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Helper function to get day name

export default TutorProfilePage;
