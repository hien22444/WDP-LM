import React, { useEffect, useState } from "react";
import BookingService from "../../services/BookingService";
import "./TutorBookings.scss";

const TutorBookings = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await BookingService.listMyBookings('tutor')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const decide = async (id, decision) => {
    setLoading(true);
    try { await BookingService.tutorDecision(id, decision); await load(); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Yêu cầu đặt lịch</h2>
      {loading && items.length === 0 ? (<div>Đang tải...</div>) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Học sinh</th><th>Thời gian</th><th>Hình thức</th><th>Giá</th><th>Trạng thái</th><th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map(b => (
              <tr key={b._id}>
                <td>{b.student}</td>
                <td>{new Date(b.start).toLocaleString()} – {new Date(b.end).toLocaleString()}</td>
                <td>{b.mode}</td>
                <td>{(b.price||0).toLocaleString()} đ</td>
                <td>{b.status}</td>
                <td>
                  {b.status === 'pending' ? (
                    <>
                      <button onClick={()=>decide(b._id,'accept')}>Chấp nhận</button>
                      <button onClick={()=>decide(b._id,'reject')} style={{ marginLeft: 8 }}>Từ chối</button>
                    </>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TutorBookings;


