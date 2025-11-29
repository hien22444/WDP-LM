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
import { getTutorReviews } from "../../services/ReviewService";
import "./TutorProfilePageV2.scss";

// Lazy load components for better performance
const LazyImage = lazy(() => import("../../components/Common/LazyImage"));

const TutorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.user);
  const { openChat } = useChat();
  const [tutor, setTutor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [ratingStats, setRatingStats] = useState(null);
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
        availability: Array.isArray(t.availability) ? t.availability : [],

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

  // Load reviews khi có tutor data
  useEffect(() => {
    if (tutor?._id) {
      loadTutorReviews();
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

  const loadTutorReviews = async () => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      const response = await getTutorReviews(id, { page: 1, limit: 20 });
      setReviews(response.reviews || []);
      setRatingStats(response.ratingStats || null);
      console.log("📊 Loaded reviews:", response);
      
      // Cập nhật rating và reviewCount của tutor từ ratingStats
      if (response.ratingStats && tutor) {
        setTutor(prev => ({
          ...prev,
          rating: response.ratingStats.rating || 0,
          reviewCount: response.ratingStats.totalReviews || 0
        }));
      }
    } catch (error) {
      console.error("Error loading tutor reviews:", error);
      setReviews([]);
      setRatingStats(null);
    } finally {
      setReviewsLoading(false);
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

    // Chuyển hướng sang trang đặt lịch riêng
    navigate(`/booking/${id}`);
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
    <>
    <div className="tutor-profile-page-v2">
      {/* Top Navigation Bar */}
      <div className="top-nav">
        <button className="back-button" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Quay lại
        </button>
        <div className="nav-actions">
          <button 
            className={`favorite-toggle ${isFavorite ? "active" : ""}`}
            onClick={handleToggleFavorite}
          >
            <i className={`${isFavorite ? "fas" : "far"} fa-heart`}></i>
            {isFavorite ? " Đã lưu" : " Lưu"}
          </button>
          <button className="share-button" onClick={handleShareProfile}>
            <i className="fas fa-share-alt"></i> Chia sẻ
          </button>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="profile-container">
        {/* Left Sidebar - Tutor Info Card */}
        <aside className="tutor-sidebar">
          <div className="tutor-card-sticky">
            {/* Avatar */}
            <div className="tutor-avatar-section">
              <div className="avatar-frame">
                <Suspense fallback={<div className="avatar-loader"></div>}>
                  {tutor.avatar ? (
                    <img src={tutor.avatar} alt={tutor.name} className="avatar-img" />
                  ) : (
                    <div className="avatar-placeholder">
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                </Suspense>
                {tutor.verified && (
                  <div className="verified-badge">
                    <i className="fas fa-check-circle"></i>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="tutor-basic-info">
              <h1 className="tutor-name">{tutor.name}</h1>
              <p className="tutor-title">{tutor.bio || "Gia sư nhiệt huyết"}</p>
              
              <div className="location-badge">
                <i className="fas fa-map-marker-alt"></i>
                {tutor.location}
              </div>

              {/* Rating */}
              <div className="rating-section">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i 
                      key={star}
                      className={`fas fa-star ${star <= Math.floor(tutor.rating) ? 'filled' : 'empty'}`}
                    ></i>
                  ))}
                </div>
                <span className="rating-text">
                  <strong>{tutor.rating}</strong> ({tutor.reviewCount} đánh giá)
                </span>
              </div>

              {/* Price */}
              <div className="price-section">
                <div className="price-label">Học phí</div>
                <div className="price-value">{tutor.price?.toLocaleString() || 0}đ<span>/buổi</span></div>
              </div>

              {/* Subjects */}
              <div className="subjects-section">
                <div className="section-title">
                  <i className="fas fa-book"></i> Môn dạy
                </div>
                <div className="subjects-tags">
                  {Array.isArray(tutor.subjects) && tutor.subjects.length > 0 ? (
                    tutor.subjects.slice(0, 5).map((subject, index) => (
                      <span key={index} className="subject-tag">
                        {typeof subject === "string" ? subject : subject.name}
                      </span>
                    ))
                  ) : (
                    <span className="no-data">Chưa cập nhật</span>
                  )}
                  {tutor.subjects?.length > 5 && (
                    <span className="more-subjects">+{tutor.subjects.length - 5} môn</span>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="quick-stats">
                <div className="stat-item">
                  <i className="fas fa-graduation-cap"></i>
                  <div>
                    <div className="stat-label">Kinh nghiệm</div>
                    <div className="stat-value">{tutor.experience || "N/A"}</div>
                  </div>
                </div>
                <div className="stat-item">
                  <i className="fas fa-chalkboard-teacher"></i>
                  <div>
                    <div className="stat-label">Hình thức</div>
                    <div className="stat-value">
                      {tutor.teachModes?.includes("online") && tutor.teachModes?.includes("offline") 
                        ? "Online & Offline" 
                        : tutor.teachModes?.includes("online") 
                        ? "Online" 
                        : "Offline"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn-primary-large" onClick={handleBookSession}>
                <i className="fas fa-calendar-check"></i>
                Đặt lịch học ngay
              </button>
              <button className="btn-secondary-large" onClick={handleContactTutor}>
                <i className="fas fa-comments"></i>
                Nhắn tin với gia sư
              </button>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="tutor-content-area">
          {/* Tabs Navigation */}
          <nav className="content-tabs">
            <button
              className={`tab-item ${activeTab === "about" ? "active" : ""}`}
              onClick={() => setActiveTab("about")}
            >
              <i className="fas fa-info-circle"></i>
              <span>Giới thiệu</span>
            </button>
            <button
              className={`tab-item ${activeTab === "schedule" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("schedule");
                if (availability.slots.length === 0) loadAvailability();
              }}
            >
              <i className="fas fa-calendar-alt"></i>
              <span>Lịch</span>
            </button>
            <button
              className={`tab-item ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              <i className="fas fa-star"></i>
              <span>Đánh giá ({tutor.reviewCount || 0})</span>
            </button>
            <button
              className={`tab-item ${activeTab === "certifications" ? "active" : ""}`}
              onClick={() => setActiveTab("certifications")}
            >
              <i className="fas fa-certificate"></i>
              <span>Chứng chỉ</span>
            </button>
            <button
              className={`tab-item ${activeTab === "courses" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("courses");
                if (courses.length === 0) loadTutorCourses();
              }}
            >
              <i className="fas fa-book-open"></i>
              <span>Khóa học ({courses.length})</span>
            </button>
          </nav>

          {/* Tab Content */}
          <div className="tab-content-area">
            {/* About Tab */}
            {activeTab === "about" && (
              <div>
                <h2><i className="fas fa-user-circle"></i> Giới thiệu về gia sư</h2>
                <div className="bio-content">
                  <p>{tutor.bio || "Gia sư chưa cập nhật thông tin giới thiệu."}</p>
                </div>

                <div className="tutor-details-grid">
                  <div className="detail-item">
                    <div className="icon-wrapper">
                      <i className="fas fa-graduation-cap"></i>
                    </div>
                    <div>
                      <h4>Kinh nghiệm</h4>
                      <p>{tutor.experience || "Chưa cập nhật"}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="icon-wrapper">
                      <i className="fas fa-chalkboard-teacher"></i>
                    </div>
                    <div>
                      <h4>Hình thức dạy</h4>
                      <p>
                        {tutor.teachModes?.includes("online") && tutor.teachModes?.includes("offline") 
                          ? "Online & Offline" 
                          : tutor.teachModes?.includes("online") 
                          ? "Online" 
                          : tutor.teachModes?.includes("offline")
                          ? "Offline"
                          : "Chưa cập nhật"}
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
                      <p>{tutor.education || "Chưa cập nhật"}</p>
                    </div>
                  </div>
                </div>

                <div className="verification-section">
                  <h3><i className="fas fa-shield-alt"></i> Xác minh</h3>
                  <div className="verification-badges">
                    <div className={`verify-badge ${tutor.verified ? "verified" : "pending"}`}>
                      <i className={`fas ${tutor.verified ? "fa-check-circle" : "fa-hourglass-half"}`}></i>
                      <span>{tutor.verified ? "Đã xác minh" : "Chờ xác minh"}</span>
                    </div>
                    {tutor.degreeStatus && (
                      <div className={`verify-badge ${tutor.degreeStatus === "verified" ? "verified" : "pending"}`}>
                        <i className={`fas ${tutor.degreeStatus === "verified" ? "fa-check-circle" : "fa-hourglass-half"}`}></i>
                        <span>Bằng cấp: {tutor.degreeStatus === "verified" ? "Đã xác minh" : "Chờ xác minh"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === "schedule" && (
              <div>
                <h2><i className="fas fa-calendar-alt"></i> Lịch của gia sư</h2>
                {availabilityLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#3b82f6' }}></i>
                    <p>Đang tải lịch...</p>
                  </div>
                ) : (
                  <div className="availability-calendar">
                    <div className="calendar-header">
                      <h3>Lịch trong tuần</h3>
                      <div className="legend">
                        <div className="legend-item">
                          <div className="color-box available"></div>
                          <span>Rảnh</span>
                        </div>
                        <div className="legend-item">
                          <div className="color-box unavailable"></div>
                          <span>Không rảnh</span>
                        </div>
                      </div>
                    </div>
                    <div className="availability-grid">
                      <div className="grid-cell header">Thời gian</div>
                      {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, i) => (
                        <div key={i} className="grid-cell header">{day}</div>
                      ))}
                      
                      {/* Morning */}
                      <div className="grid-cell time-label">
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>Buổi sáng</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>07:00 - 11:30</div>
                      </div>
                      {[0,1,2,3,4,5,6].map(dayIndex => {
                        const available = tutor.availability?.some(
                          slot => (slot.dayOfWeek === dayIndex || slot.day === dayIndex) && 
                          parseInt((slot.start || '').split(':')[0]) < 12
                        );
                        return (
                          <div key={dayIndex} className={`grid-cell ${available ? 'available' : 'unavailable'}`}>
                            {available ? (
                              <span className="check-icon">✓</span>
                            ) : (
                              <span className="x-icon">−</span>
                            )}
                          </div>
                        );
                      })}

                      {/* Afternoon */}
                      <div className="grid-cell time-label">
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>Buổi chiều</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>13:00 - 17:30</div>
                      </div>
                      {[0,1,2,3,4,5,6].map(dayIndex => {
                        const available = tutor.availability?.some(
                          slot => (slot.dayOfWeek === dayIndex || slot.day === dayIndex) && 
                          parseInt((slot.start || '').split(':')[0]) >= 12
                        );
                        return (
                          <div key={dayIndex} className={`grid-cell ${available ? 'available' : 'unavailable'}`}>
                            {available ? (
                              <span className="check-icon">✓</span>
                            ) : (
                              <span className="x-icon">−</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div>
                <h2><i className="fas fa-star"></i> Đánh giá từ học viên</h2>
                
                {reviewsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#3b82f6' }}></i>
                    <p>Đang tải đánh giá...</p>
                  </div>
                ) : (
                  <>
                    {ratingStats && ratingStats.totalReviews > 0 && (
                      <div className="rating-summary" style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '24px',
                        borderRadius: '12px',
                        color: 'white',
                        marginBottom: '24px'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'center' }}>
                          <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.3)', paddingRight: '24px' }}>
                            <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
                              {ratingStats.rating?.toFixed(1) || '0.0'}
                            </div>
                            <div style={{ fontSize: '18px', marginTop: '8px' }}>
                              {ratingStats.totalReviews || 0} đánh giá
                            </div>
                          </div>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {ratingStats.categories && (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>📚 Chất lượng giảng dạy:</span>
                                  <span style={{ fontWeight: 'bold' }}>{ratingStats.categories.teaching?.toFixed(1) || '0.0'}/5</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>⏰ Đúng giờ:</span>
                                  <span style={{ fontWeight: 'bold' }}>{ratingStats.categories.punctuality?.toFixed(1) || '0.0'}/5</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>💬 Giao tiếp:</span>
                                  <span style={{ fontWeight: 'bold' }}>{ratingStats.categories.communication?.toFixed(1) || '0.0'}/5</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>📖 Chuẩn bị bài học:</span>
                                  <span style={{ fontWeight: 'bold' }}>{ratingStats.categories.preparation?.toFixed(1) || '0.0'}/5</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>😊 Thân thiện:</span>
                                  <span style={{ fontWeight: 'bold' }}>{ratingStats.categories.friendliness?.toFixed(1) || '0.0'}/5</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="reviews-list">
                      {reviews && reviews.length > 0 ? (
                        reviews.map((review) => (
                          <div key={review._id} className="review-item" style={{
                            background: '#f8f9fa',
                            padding: '20px',
                            borderRadius: '12px',
                            marginBottom: '16px',
                            border: '1px solid #e9ecef'
                          }}>
                            <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <div className="reviewer-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="reviewer-avatar" style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '50%',
                                  background: '#667eea',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '20px',
                                  overflow: 'hidden'
                                }}>
                                  {review.student?.avatar ? (
                                    <img src={review.student.avatar} alt={review.student.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <i className="fas fa-user"></i>
                                  )}
                                </div>
                                <div>
                                  <div className="reviewer-name" style={{ fontWeight: '600', color: '#1e293b' }}>
                                    {review.isAnonymous ? "Học viên ẩn danh" : (review.student?.full_name || "Học viên")}
                                  </div>
                                  <div className="review-rating" style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                    {[1,2,3,4,5].map(star => (
                                      <i key={star} className={`fas fa-star`} style={{ color: star <= review.rating ? '#fbbf24' : '#d1d5db', fontSize: '14px' }}></i>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="review-date" style={{ fontSize: '13px', color: '#64748b' }}>
                                {new Date(review.created_at).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                            
                            {review.categories && (
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                                gap: '8px', 
                                marginBottom: '12px',
                                padding: '12px',
                                background: 'white',
                                borderRadius: '8px'
                              }}>
                                <div style={{ fontSize: '12px' }}>
                                  <span style={{ color: '#64748b' }}>Giảng dạy:</span>
                                  <span style={{ fontWeight: '600', color: '#667eea', marginLeft: '4px' }}>{review.categories.teaching}/5</span>
                                </div>
                                <div style={{ fontSize: '12px' }}>
                                  <span style={{ color: '#64748b' }}>Đúng giờ:</span>
                                  <span style={{ fontWeight: '600', color: '#667eea', marginLeft: '4px' }}>{review.categories.punctuality}/5</span>
                                </div>
                                <div style={{ fontSize: '12px' }}>
                                  <span style={{ color: '#64748b' }}>Giao tiếp:</span>
                                  <span style={{ fontWeight: '600', color: '#667eea', marginLeft: '4px' }}>{review.categories.communication}/5</span>
                                </div>
                                <div style={{ fontSize: '12px' }}>
                                  <span style={{ color: '#64748b' }}>Chuẩn bị:</span>
                                  <span style={{ fontWeight: '600', color: '#667eea', marginLeft: '4px' }}>{review.categories.preparation}/5</span>
                                </div>
                                <div style={{ fontSize: '12px' }}>
                                  <span style={{ color: '#64748b' }}>Thân thiện:</span>
                                  <span style={{ fontWeight: '600', color: '#667eea', marginLeft: '4px' }}>{review.categories.friendliness}/5</span>
                                </div>
                              </div>
                            )}
                            
                            {review.comment && (
                              <div className="review-content" style={{ 
                                color: '#475569', 
                                lineHeight: '1.6',
                                fontSize: '14px'
                              }}>
                                {review.comment}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="no-reviews" style={{ textAlign: 'center', padding: '60px 20px' }}>
                          <i className="fas fa-comment-slash" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }}></i>
                          <p style={{ color: '#64748b', fontSize: '16px' }}>Chưa có đánh giá nào</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Certifications Tab */}
            {activeTab === "certifications" && (
              <div>
                <h2><i className="fas fa-certificate"></i> Chứng chỉ & Bằng cấp</h2>
                <div className="certifications-grid">
                  {tutor.certifications && tutor.certifications.length > 0 ? (
                    tutor.certifications.map((cert, index) => (
                      <div key={index} className="cert-item">
                        <div className="cert-icon">
                          <i className="fas fa-award"></i>
                        </div>
                        <div className="cert-name">{cert.name}</div>
                        <div className="cert-date">{cert.year || cert.date}</div>
                      </div>
                    ))
                  ) : (
                    <div className="no-certifications">
                      <i className="fas fa-award"></i>
                      <p>Chưa có chứng chỉ nào</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === "courses" && (
              <div>
                <h2><i className="fas fa-book-open"></i> Khóa học của gia sư</h2>
                {coursesLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#3b82f6' }}></i>
                    <p>Đang tải khóa học...</p>
                  </div>
                ) : (
                  <div className="courses-grid">
                    {courses && courses.length > 0 ? (
                      courses.map((course, index) => (
                        <div key={index} className="course-card" onClick={() => navigate(`/courses/${course._id}`)}>
                          <div className="course-image">
                            {course.thumbnail ? (
                              <img src={course.thumbnail} alt={course.title} />
                            ) : (
                              <i className="fas fa-book"></i>
                            )}
                          </div>
                          <div className="course-info">
                            <div className="course-name">{course.title}</div>
                            <div className="course-desc">{course.description}</div>
                            <div className="course-meta">
                              <div className="course-price">{course.price?.toLocaleString() || 0}đ</div>
                              <div className="course-students">
                                <i className="fas fa-users"></i>
                                {course.enrolledCount || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-courses">
                        <i className="fas fa-book-open"></i>
                        <p>Chưa có khóa học nào</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* End tab-content-area */}
        </main>
        {/* End tutor-content-area */}
      </div>
      {/* End profile-container */}
    </div>

      {/* Booking Form Modal - Outside of main content */}
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

            {/* Tutor Availability Calendar */}
            <div className="tutor-availability-section">
              <h4 style={{ marginBottom: '16px', color: '#1e293b', fontSize: '1.125rem' }}>
                📅 Lịch rảnh của gia sư
              </h4>
              <div className="availability-grid">
                <div className="availability-header">
                  <div className="time-label">Thời gian</div>
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
                    <div key={idx} className="day-label">{day}</div>
                  ))}
                </div>
                
                {/* Morning Session */}
                <div className="availability-row">
                  <div className="session-label">
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>Buổi sáng</div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>7:00-11:30</div>
                  </div>
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                    const hasSlot = Array.isArray(tutor.availability) && tutor.availability.some((slot) => {
                      let d = slot.dayOfWeek ?? slot.day ?? 0;
                      if (d === 7) d = 0;
                      if (d !== dayIndex) return false;
                      
                      const start = slot.start || '';
                      const [startHour] = start.split(':').map(Number);
                      return startHour < 12;
                    });
                    
                    return (
                      <div key={dayIndex} className={`availability-cell ${hasSlot ? 'available' : ''}`}>
                        {hasSlot && <span className="check-icon">✓</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Afternoon Session */}
                <div className="availability-row">
                  <div className="session-label">
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>Buổi chiều</div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>13:00-16:30</div>
                  </div>
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                    const hasSlot = Array.isArray(tutor.availability) && tutor.availability.some((slot) => {
                      let d = slot.dayOfWeek ?? slot.day ?? 0;
                      if (d === 7) d = 0;
                      if (d !== dayIndex) return false;
                      
                      const start = slot.start || '';
                      const [startHour] = start.split(':').map(Number);
                      return startHour >= 12;
                    });
                    
                    return (
                      <div key={dayIndex} className={`availability-cell ${hasSlot ? 'available' : ''}`}>
                        {hasSlot && <span className="check-icon">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <p style={{ marginTop: '12px', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                Ô có dấu ✓ là thời gian gia sư rảnh để dạy
              </p>
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
                    value={bookingData.subject?.name || bookingData.subject || ""}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      const selectedSubject = tutor.subjects.find((s) => {
                        const subjectName = typeof s === 'string' ? s : s.name;
                        return subjectName === selectedValue;
                      });
                      
                      // Normalize subject to object format
                      const normalizedSubject = typeof selectedSubject === 'string' 
                        ? { name: selectedSubject, price: tutor.price, level: '', description: '' }
                        : selectedSubject;
                      
                      // Lưu toàn bộ object subject
                      handleBookingInputChange("subject", normalizedSubject);
                      // Cập nhật giá khi chọn môn học
                      if (normalizedSubject) {
                        handleBookingInputChange(
                          "pricePerSession",
                          normalizedSubject.price || tutor.price
                        );
                        handleBookingInputChange(
                          "totalPrice",
                          (normalizedSubject.price || tutor.price) * bookingData.numberOfSessions
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
                    {tutor.subjects?.map((subject, index) => {
                      const subjectName = typeof subject === 'string' ? subject : subject.name;
                      return (
                        <option key={index} value={subjectName}>
                          {subjectName}
                        </option>
                      );
                    })}
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
    </>
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
