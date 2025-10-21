import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentService from "../../services/PaymentService";

const OrderSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  // Get slot and schedule data from location state (passed by CourseDetail)
  const slot = location.state?.slot;
  const weeklySchedule = location.state?.weeklySchedule || [];
  if (!slot) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          Không tìm thấy thông tin đơn hàng
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!window.confirm("Xác nhận thanh toán?")) return;

    setPayError("");
    try {
      setPayLoading(true);
      const payload = {
        product: {
          id: slot._id,
          name: slot.courseName,
          unitPrice: slot.price || 0,
          quantity: 1,
        },
        metadata: {
          tutorId: slot.tutorProfile?._id,
          slotId: slot._id,
        },
      };

      const res = await PaymentService.createPaymentLink(payload);
      // backend may return checkoutUrl or redirectUrl
      const redirect =
        res.checkoutUrl ||
        res.redirectUrl ||
        res.url ||
        (res.data && (res.data.checkoutUrl || res.data.url));

      if (redirect) {
        window.location.href = redirect;
      } else if (res.qrUrl || res.qrBase64) {
        // fallback: open demo payment page or show QR
        // Pass the resolved amount and productName so demo page can display correct price
        const qp = new URLSearchParams();
        if (typeof res.amount === "number")
          qp.set("amount", String(res.amount));
        if (res.productName) qp.set("product", res.productName);
        const demoUrl =
          "/demo_payment.html" + (qp.toString() ? `?${qp.toString()}` : "");
        window.location.href = demoUrl;
      } else {
        throw new Error("Không nhận được link thanh toán từ server");
      }
    } catch (err) {
      console.error(err);
      setPayError(err?.message || "Lỗi tạo link thanh toán");
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Xác nhận đặt khóa học</h2>

      <div className="row">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body">
              <h5 className="card-title mb-4">Thông tin khóa học</h5>

              <div className="mb-3">
                <label className="text-secondary small d-block">
                  Tên khóa học
                </label>
                <div className="fw-semibold">{slot.courseName}</div>
              </div>

              <div className="mb-3">
                <label className="text-secondary small d-block">
                  Lịch học trong tuần
                </label>
                {weeklySchedule.length > 0 ? (
                  <div className="row g-2">
                    {weeklySchedule.map((row) => (
                      <div key={row.day} className="col-12">
                        <div className="border rounded-3 p-2">
                          <div className="fw-semibold">{row.day}</div>
                          <div className="text-secondary small">
                            {row.times.join(", ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {new Date(slot.start).toLocaleDateString()}{" "}
                    {new Date(slot.start).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" – "}
                    {new Date(slot.end).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="text-secondary small d-block">
                    Hình thức
                  </label>
                  <div>{slot.mode === "online" ? "Online" : "Offline"}</div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="text-secondary small d-block">
                    Số học viên
                  </label>
                  <div>{slot.capacity || 1}</div>
                </div>
              </div>

              {slot.location && (
                <div className="mb-3">
                  <label className="text-secondary small d-block">
                    Địa điểm
                  </label>
                  <div>{slot.location}</div>
                </div>
              )}

              {slot.notes && (
                <div className="mb-3">
                  <label className="text-secondary small d-block">
                    Ghi chú
                  </label>
                  <div>{slot.notes}</div>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body">
              <h5 className="card-title mb-4">Thông tin giảng viên</h5>

              <div className="d-flex align-items-center gap-3">
                <img
                  src={
                    slot.tutorProfile?.user?.avatar ||
                    "https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760334427/whiteava_m3gka1.jpg"
                  }
                  alt="avatar"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <div>
                  <div className="fw-semibold mb-1">
                    {slot.tutorProfile?.user?.full_name || "Chưa có thông tin"}
                  </div>
                  <div className="text-secondary small">
                    {slot.tutorProfile?.title || "Giảng viên"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div
            className="card border-0 shadow-sm rounded-4 sticky-top"
            style={{ top: 16 }}
          >
            <div className="card-body">
              <h5 className="card-title mb-4">Thanh toán</h5>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="text-secondary">Học phí</div>
                <div className="fw-semibold">
                  {slot.price
                    ? slot.price.toLocaleString("vi-VN") + " ₫"
                    : "Liên hệ"}
                </div>
              </div>

              <div className="d-grid gap-2">
                <button
                  className="btn btn-primary"
                  onClick={handlePayment}
                  disabled={payLoading}
                >
                  {payLoading ? "Đang xử lý..." : "Xác nhận thanh toán"}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate(-1)}
                  disabled={payLoading}
                >
                  Quay lại
                </button>
              </div>

              {payError && (
                <div className="alert alert-danger mt-3 mb-0 py-2">
                  {payError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
