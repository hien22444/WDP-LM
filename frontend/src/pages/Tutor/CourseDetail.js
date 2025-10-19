import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import BackHomeButton from "../../components/Common/BackHomeButton";
import BookingService from "../../services/BookingService";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [related, setRelated] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await BookingService.getPublicTeachingSlot(id);
        setSlot(res);
      } catch (e) {
        // Fallback: tìm trong danh sách public nếu API chi tiết không khả dụng
        try {
          const list = await BookingService.listPublicTeachingSlots();
          const found = (list || []).find((s) => String(s._id) === String(id));
          if (found) setSlot(found);
          else setError("Không tìm thấy khóa học");
        } catch (e2) {
          setError("Không tải được chi tiết khóa học");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Load các buổi liên quan (cùng gia sư + cùng tên khóa) để hiển thị lịch tuần/tổng số buổi
  useEffect(() => {
    (async () => {
      if (!slot?.tutorProfile?._id) return;
      try {
        const list = await BookingService.listPublicTeachingSlots({
          tutorId: slot.tutorProfile._id,
        });
        const same = (list || []).filter((s) =>
          s.courseCode && slot.courseCode
            ? s.courseCode === slot.courseCode
            : (s.courseName || "").trim() === (slot.courseName || "").trim()
        );
        setRelated(same);
      } catch {}
    })();
  }, [slot]);

  const weekdayVi = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];
  const weeklySchedule = (() => {
    const map = {};
    for (const s of related) {
      const d = new Date(s.start);
      const day = weekdayVi[d.getDay()];
      const time = `${new Date(s.start).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} – ${new Date(s.end).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      if (!map[day]) map[day] = new Set();
      map[day].add(time);
    }
    // sort times
    const result = [];
    for (const day of weekdayVi) {
      if (map[day]) result.push({ day, times: Array.from(map[day]).sort() });
    }
    return result;
  })();

  if (loading) return <div className="container py-4">Đang tải...</div>;
  if (error || !slot)
    return (
      <div className="container py-4 text-danger">
        {error || "Không tìm thấy khóa học"}
      </div>
    );

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/courses">Khóa học</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Chi tiết
            </li>
          </ol>
        </nav>
        <BackHomeButton />
      </div>
      <div className="mb-3">
        <h2 className="m-0 fw-bold">{slot.courseName}</h2>
        <div className="d-flex flex-wrap gap-2 mt-2">
          <span
            className={`badge rounded-pill ${
              slot.mode === "online" ? "text-bg-info" : "text-bg-warning"
            }`}
          >
            {slot.mode === "online" ? "Online" : "Offline"}
          </span>
          <span
            className={`badge rounded-pill ${
              slot.status === "open" ? "text-bg-success" : "text-bg-secondary"
            }`}
          >
            {slot.status || "open"}
          </span>
          {slot.courseCode && (
            <span className="badge rounded-pill text-bg-secondary">
              Mã: {slot.courseCode}
            </span>
          )}
        </div>
      </div>
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Tổng quan</h5>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="small text-secondary">Ngày</div>
                  <div className="fw-semibold">
                    {new Date(slot.start).toLocaleDateString()}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="small text-secondary">Giờ</div>
                  <div className="fw-semibold">
                    {new Date(slot.start).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(slot.end).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="small text-secondary">Thời lượng</div>
                  <div className="fw-semibold">
                    {Math.round(
                      ((new Date(slot.end) - new Date(slot.start)) /
                        (1000 * 60 * 60)) *
                        10
                    ) / 10}{" "}
                    giờ
                  </div>
                </div>
                {slot.location && (
                  <div className="col-12 col-md-6">
                    <div className="small text-secondary">Địa điểm</div>
                    <div className="fw-semibold">{slot.location}</div>
                  </div>
                )}
                <div className="col-12">
                  <div className="small text-secondary">Mô tả</div>
                  <div className="fw-normal">{slot.notes || "—"}</div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="small text-secondary">Mã khóa</div>
                  <div className="fw-semibold">{slot._id}</div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="small text-secondary">Cập nhật</div>
                  <div className="fw-semibold">
                    {slot.updated_at
                      ? new Date(slot.updated_at).toLocaleString()
                      : new Date(
                          slot.created_at || slot.start
                        ).toLocaleString()}
                  </div>
                </div>
                <div className="col-12">
                  <div className="small text-secondary">
                    Tổng số buổi (cùng khóa)
                  </div>
                  <div className="fw-semibold">{related.length}</div>
                </div>
                {weeklySchedule.length > 0 && (
                  <div className="col-12">
                    <h5 className="fw-bold mt-2 mb-2">Lịch theo tuần</h5>
                    <div className="row g-2">
                      {weeklySchedule.map((row) => (
                        <div key={row.day} className="col-12 col-md-6">
                          <div className="border rounded-3 p-2 h-100">
                            <div className="fw-semibold mb-1">{row.day}</div>
                            <div className="text-secondary small">
                              {row.times.join(", ")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div
            className="card border-0 shadow-sm rounded-4 sticky-top"
            style={{ top: 16 }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div className="fw-bold">Giá</div>
                <div className="fw-bold">
                  {slot.price ? slot.price.toLocaleString() : "Liên hệ"}
                </div>
              </div>
              <div className="text-secondary">
                Số học viên: {slot.capacity || 1}
              </div>
              <div className="mt-3 d-flex align-items-center gap-2">
                <img
                  src={
                    slot.tutorProfile?.user?.avatar ||
                    "https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760334427/whiteava_m3gka1.jpg"
                  }
                  alt="avatar"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                {slot.tutorProfile?.user?.full_name && (
                  <Link
                    to={`/tutor/${slot.tutorProfile._id}`}
                    className="link-dark fw-semibold"
                  >
                    {slot.tutorProfile.user.full_name}
                  </Link>
                )}
              </div>
              <div className="d-grid mt-3">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    // Navigate to order summary with slot data
                    navigate("/payment/order-summary", {
                      state: { slot, weeklySchedule },
                    });
                  }}
                >
                  Đặt ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
