import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentService from "../../services/PaymentService";

const OrderSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState(null);

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

      // Simplified payload structure
      const payload = {
        product: {
          name: `Khóa học: ${slot.courseName}`,
          unitPrice: parseInt(slot.price) || 100000,
        },
      };

      const res = await PaymentService.createPaymentLink(payload);

      // If we got QR data, show it immediately
      if (res.qrUrl || res.qrBase64) {
        setQrData({
          qrUrl: res.qrUrl,
          qrBase64: res.qrBase64,
          amount: res.amount,
          orderCode: res.orderCode,
          productName: res.productName,
        });
        setShowQR(true);
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        throw new Error("Không nhận được thông tin thanh toán từ server");
      }
    } catch (err) {
      console.error(err);
      setPayError(err?.message || "Lỗi tạo thanh toán");
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <>
      {showQR && qrData && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target.className.includes("modal")) {
              setShowQR(false);
            }
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Quét mã QR để thanh toán</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowQR(false)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <div className="mb-3">
                  <strong>{qrData.productName}</strong>
                </div>
                <div className="mb-3">
                  <strong className="text-danger fs-4">
                    {(qrData.amount || 0).toLocaleString("vi-VN")} ₫
                  </strong>
                </div>
                {qrData.qrBase64 ? (
                  <img
                    src={`data:image/png;base64,${qrData.qrBase64}`}
                    alt="QR Code"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                ) : qrData.qrUrl ? (
                  <img
                    src={qrData.qrUrl}
                    alt="QR Code"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                ) : (
                  <div className="alert alert-danger">Không có mã QR</div>
                )}
                <div className="small text-muted mt-3">
                  Mã đơn hàng: {qrData.orderCode}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowQR(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {/* --- BẮT ĐẦU ĐOẠN CODE MỚI --- */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="text-secondary small d-block">
                      Ngày bắt đầu
                    </label>
                    <div className="fw-semibold">
                      {slot.start
                        ? new Date(slot.start).toLocaleDateString("vi-VN")
                        : "Chưa xác định"}
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-secondary small d-block">
                      Ngày kết thúc dự kiến
                    </label>
                    <div className="fw-semibold">
                      {slot.end
                        ? new Date(slot.end).toLocaleDateString("vi-VN")
                        : "Chưa xác định"}
                    </div>
                  </div>
                </div>
                {/* --- KẾT THÚC ĐOẠN CODE MỚI --- */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="text-secondary small d-block">
                      Hình thức
                    </label>
                    <div>
                      {slot.mode === "online" ? "Trực tuyến" : "Trực tiếp"}
                    </div>
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
                      {slot.tutorProfile?.user?.full_name ||
                        "Chưa có thông tin"}
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
    </>
  );
};

export default OrderSummary;
