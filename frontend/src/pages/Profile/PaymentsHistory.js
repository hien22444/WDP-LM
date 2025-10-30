import React, { useEffect, useState } from "react";
import PaymentService from "../../services/PaymentService";

const PaymentsHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await PaymentService.listPayments({});
        setPayments(Array.isArray(res.items) ? res.items : res);
      } catch (e) {
        console.error(e);
        setError("Không tải được lịch sử thanh toán");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = async () => {
    try {
      setLoading(true);
      const res = await PaymentService.listPayments({});
      const items = Array.isArray(res.items) ? res.items : res;
      setPayments(items);
      if (selected) {
        const updated = items.find(
          (it) => String(it._id) === String(selected._id)
        );
        setSelected(updated || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "28px auto", padding: "0 16px" }}>
      <div
        style={{
          background: "linear-gradient(180deg, #f7f9fc 0%, #ffffff 100%)",
          border: "1px solid #eef2f7",
          borderRadius: 16,
          padding: "18px 20px",
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, margin: 0 }}>Lịch sử thanh toán</h2>
          <p style={{ color: "#6b7280", margin: "6px 0 0 0" }}>
            Xem tất cả giao dịch thanh toán của bạn.
          </p>
        </div>
        <div>
          <button className="btn btn-outline-primary" onClick={refresh}>
            Làm mới
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 12,
              boxShadow: "0 8px 20px rgba(2,8,23,.06)",
            }}
          >
            {loading ? (
              <div>Đang tải...</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #eef2f7",
                    }}
                  >
                    <th style={{ padding: "12px 8px" }}>Mã đơn</th>
                    <th style={{ padding: "12px 8px" }}>Sản phẩm</th>
                    <th style={{ padding: "12px 8px" }}>Số tiền</th>
                    <th style={{ padding: "12px 8px" }}>Trạng thái</th>
                    <th style={{ padding: "12px 8px" }}>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {payments && payments.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 12 }}>
                        Không có giao dịch nào
                      </td>
                    </tr>
                  )}
                  {payments.map((p) => (
                    <tr
                      key={p._id || p.orderCode}
                      onClick={() => setSelected(p)}
                      style={{
                        cursor: "pointer",
                        borderBottom: "1px solid #f3f6fb",
                        transition: "background .15s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#fcfdff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={{ padding: "12px 8px", fontWeight: 600 }}>
                        {p.orderCode || p._id}
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        {p.productName || (p.product && p.product.name) || "—"}
                      </td>
                      <td style={{ padding: "12px 8px", color: "#0b1220" }}>
                        {p.amount
                          ? p.amount.toLocaleString("vi-VN") + " ₫"
                          : p.product && p.product.unitPrice
                          ? p.product.unitPrice.toLocaleString("vi-VN") + " ₫"
                          : "—"}
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <span
                          style={{
                            background:
                              (p.status || p.paymentStatus) === "CANCELLED"
                                ? "#fde8e8"
                                : (p.status || p.paymentStatus) === "SUCCESS"
                                ? "#e8f7ee"
                                : "#fff8e6",
                            color:
                              (p.status || p.paymentStatus) === "CANCELLED"
                                ? "#b91c1c"
                                : (p.status || p.paymentStatus) === "SUCCESS"
                                ? "#0e9f6e"
                                : "#9a6b00",
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontWeight: 600,
                            border: "1px solid rgba(0,0,0,.05)",
                          }}
                        >
                          {p.status || p.paymentStatus || "PENDING"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleString()
                          : p.created_at
                          ? new Date(p.created_at).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ width: 360 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 8px 20px rgba(2,8,23,.06)",
            }}
          >
            <h4 style={{ marginTop: 0 }}>Chi tiết giao dịch</h4>
            {!selected && (
              <div style={{ color: "#6b7280" }}>
                Chọn một giao dịch để xem chi tiết
              </div>
            )}
            {selected && (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Mã đơn:</strong> {selected.orderCode || selected._id}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Sản phẩm:</strong>{" "}
                  {selected.productName ||
                    (selected.product && selected.product.name)}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Số tiền:</strong>{" "}
                  {selected.amount
                    ? selected.amount.toLocaleString("vi-VN") + " ₫"
                    : selected.product && selected.product.unitPrice
                    ? selected.product.unitPrice.toLocaleString("vi-VN") + " ₫"
                    : "—"}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Trạng thái:</strong>{" "}
                  <span
                    style={{
                      background:
                        (selected.status || selected.paymentStatus) ===
                        "CANCELLED"
                          ? "#fde8e8"
                          : (selected.status || selected.paymentStatus) ===
                            "SUCCESS"
                          ? "#e8f7ee"
                          : "#fff8e6",
                      color:
                        (selected.status || selected.paymentStatus) ===
                        "CANCELLED"
                          ? "#b91c1c"
                          : (selected.status || selected.paymentStatus) ===
                            "SUCCESS"
                          ? "#0e9f6e"
                          : "#9a6b00",
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontWeight: 600,
                      border: "1px solid rgba(0,0,0,.05)",
                    }}
                  >
                    {selected.status || selected.paymentStatus || "PENDING"}
                  </span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Thời gian:</strong>{" "}
                  {selected.createdAt
                    ? new Date(selected.createdAt).toLocaleString()
                    : selected.created_at
                    ? new Date(selected.created_at).toLocaleString()
                    : "—"}
                </div>
                <div style={{ marginTop: 12 }}>
                  <a
                    href={selected.checkoutUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                  >
                    Mở link thanh toán
                  </a>
                  {selected.status === "PENDING" && (
                    <button
                      style={{ marginLeft: 8 }}
                      className="btn btn-secondary"
                      onClick={async (e) => {
                        e.preventDefault();
                        const ok = window.confirm(
                          "Bạn có chắc muốn hủy giao dịch này?"
                        );
                        if (!ok) return;
                        try {
                          await PaymentService.cancelPayment(selected._id);
                          // refresh list and selected
                          await refresh();
                        } catch (err) {
                          console.error(err);
                          alert(
                            err?.response?.data?.message ||
                              "Không thể hủy giao dịch"
                          );
                        }
                      }}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsHistory;
