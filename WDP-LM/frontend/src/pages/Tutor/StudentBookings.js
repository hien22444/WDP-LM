import React, { useEffect, useState } from "react";
import BookingService from "../../services/BookingService";
import "./StudentBookings.scss";

const StudentBookings = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await BookingService.listMyBookings('student')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Đặt lịch của tôi</h2>
      {loading && items.length === 0 ? (<div>Đang tải...</div>) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Gia sư</th><th>Thời gian</th><th>Hình thức</th><th>Giá</th><th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {items.map(b => (
              <tr key={b._id}>
                <td>{b.tutorProfile}</td>
                <td>{new Date(b.start).toLocaleString()} – {new Date(b.end).toLocaleString()}</td>
                <td>{b.mode}</td>
                <td>{(b.price||0).toLocaleString()} đ</td>
                <td>{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentBookings;


