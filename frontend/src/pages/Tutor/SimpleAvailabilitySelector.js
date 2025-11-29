import React, { useState, useEffect } from "react";
import "./SimpleAvailabilitySelector.scss";

/**
 * Component chọn lịch rảnh đơn giản theo buổi
 * - Buổi sáng: 7:00 - 11:30
 * - Buổi chiều: 13:00 - 16:30
 * - Learner sẽ chọn giờ cụ thể (tối thiểu 2h) trong khung giờ này
 */

const DAYS = [
  { label: "Thứ 2", value: 1 },
  { label: "Thứ 3", value: 2 },
  { label: "Thứ 4", value: 3 },
  { label: "Thứ 5", value: 4 },
  { label: "Thứ 6", value: 5 },
  { label: "Thứ 7", value: 6 },
  { label: "Chủ nhật", value: 0 },
];

const SESSIONS = {
  morning: { label: "Sáng", start: "07:00", end: "11:30" },
  afternoon: { label: "Chiều", start: "13:00", end: "16:30" },
};

const SimpleAvailabilitySelector = ({ defaultAvailability = [], onChange }) => {
  // State: { dayOfWeek: { morning: boolean, afternoon: boolean } }
  const [selected, setSelected] = useState({});

  // Load default availability
  useEffect(() => {
    if (!defaultAvailability || defaultAvailability.length === 0) return;

    const newSelected = {};
    
    defaultAvailability.forEach(slot => {
      const day = slot.dayOfWeek;
      if (!newSelected[day]) {
        newSelected[day] = { morning: false, afternoon: false };
      }

      // Check if slot is morning (7:00-11:30) or afternoon (13:00-16:30)
      const startHour = parseInt(slot.start.split(':')[0]);
      
      if (startHour >= 7 && startHour < 12) {
        newSelected[day].morning = true;
      } else if (startHour >= 13 && startHour < 17) {
        newSelected[day].afternoon = true;
      }
    });

    setSelected(newSelected);
  }, [defaultAvailability]);

  // Convert selected to availability format
  const convertToAvailability = (selectedData) => {
    const availability = [];

    Object.keys(selectedData).forEach(dayOfWeek => {
      const day = parseInt(dayOfWeek);
      const sessions = selectedData[day];

      if (sessions.morning) {
        availability.push({
          dayOfWeek: day,
          start: SESSIONS.morning.start,
          end: SESSIONS.morning.end,
        });
      }

      if (sessions.afternoon) {
        availability.push({
          dayOfWeek: day,
          start: SESSIONS.afternoon.start,
          end: SESSIONS.afternoon.end,
        });
      }
    });

    return availability;
  };

  // Toggle session for a day
  const toggleSession = (day, session) => {
    const newSelected = { ...selected };
    
    if (!newSelected[day]) {
      newSelected[day] = { morning: false, afternoon: false };
    }

    newSelected[day][session] = !newSelected[day][session];

    // If both sessions are unchecked, remove the day
    if (!newSelected[day].morning && !newSelected[day].afternoon) {
      delete newSelected[day];
    }

    setSelected(newSelected);
    onChange && onChange(convertToAvailability(newSelected));
  };

  // Select all days for a session
  const selectAllSession = (session) => {
    const newSelected = { ...selected };
    
    DAYS.forEach(day => {
      if (!newSelected[day.value]) {
        newSelected[day.value] = { morning: false, afternoon: false };
      }
      newSelected[day.value][session] = true;
    });

    setSelected(newSelected);
    onChange && onChange(convertToAvailability(newSelected));
  };

  // Clear all
  const clearAll = () => {
    setSelected({});
    onChange && onChange([]);
  };

  // Select weekdays (T2-T6)
  const selectWeekdays = (session) => {
    const newSelected = { ...selected };
    
    [1, 2, 3, 4, 5].forEach(day => {
      if (!newSelected[day]) {
        newSelected[day] = { morning: false, afternoon: false };
      }
      newSelected[day][session] = true;
    });

    setSelected(newSelected);
    onChange && onChange(convertToAvailability(newSelected));
  };

  return (
    <div className="simple-availability-selector">
      {/* Header */}
      <div className="header">
        <h3>Chọn lịch rảnh theo buổi</h3>
        <p className="description">
          Chọn các buổi bạn có thể dạy. Học viên sẽ chọn giờ cụ thể (tối thiểu 2h) trong khung giờ này.
        </p>
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <span className="badge morning">Sáng</span>
          <span className="time">7:00 - 11:30</span>
        </div>
        <div className="legend-item">
          <span className="badge afternoon">Chiều</span>
          <span className="time">13:00 - 16:30</span>
        </div>
        <div className="legend-item">
          <span className="note">⏱️ Học viên sẽ chọn giờ cụ thể (tối thiểu 2h)</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <button 
          type="button"
          className="btn-quick"
          onClick={() => selectWeekdays('morning')}
        >
          Sáng T2-T6
        </button>
        <button 
          type="button"
          className="btn-quick"
          onClick={() => selectWeekdays('afternoon')}
        >
          Chiều T2-T6
        </button>
        <button 
          type="button"
          className="btn-quick"
          onClick={() => selectAllSession('morning')}
        >
          Tất cả buổi sáng
        </button>
        <button 
          type="button"
          className="btn-quick"
          onClick={() => selectAllSession('afternoon')}
        >
          Tất cả buổi chiều
        </button>
        <button 
          type="button"
          className="btn-clear"
          onClick={clearAll}
        >
          ❌ Xóa tất cả
        </button>
      </div>

      {/* Selection grid */}
      <div className="selection-grid">
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Buổi sáng<br/><small>(7:00 - 11:30)</small></th>
              <th>Buổi chiều<br/><small>(13:00 - 16:30)</small></th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day.value}>
                <td className="day-label">{day.label}</td>
                <td className="session-cell">
                  <button
                    type="button"
                    className={`session-btn morning ${selected[day.value]?.morning ? 'active' : ''}`}
                    onClick={() => toggleSession(day.value, 'morning')}
                  >
                    {selected[day.value]?.morning ? '✓ Có thể dạy' : 'Không rảnh'}
                  </button>
                </td>
                <td className="session-cell">
                  <button
                    type="button"
                    className={`session-btn afternoon ${selected[day.value]?.afternoon ? 'active' : ''}`}
                    onClick={() => toggleSession(day.value, 'afternoon')}
                  >
                    {selected[day.value]?.afternoon ? '✓ Có thể dạy' : 'Không rảnh'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="summary">
        <h4>📅 Tóm tắt lịch rảnh của bạn:</h4>
        {Object.keys(selected).length === 0 ? (
          <p className="empty">Chưa chọn lịch nào</p>
        ) : (
          <ul>
            {DAYS.map(day => {
              const daySessions = selected[day.value];
              if (!daySessions) return null;

              const sessions = [];
              if (daySessions.morning) sessions.push('Sáng (7:00-11:30)');
              if (daySessions.afternoon) sessions.push('Chiều (13:00-16:30)');

              if (sessions.length === 0) return null;

              return (
                <li key={day.value}>
                  <strong>{day.label}:</strong> {sessions.join(', ')}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Info */}
      <div className="info">
        <p>
          <strong>💡 Lưu ý:</strong> Lịch này sẽ hiển thị cho học viên khi họ muốn đặt lịch với bạn.
          Học viên sẽ chọn giờ cụ thể trong khung giờ buổi sáng/chiều (tối thiểu 2 tiếng).
        </p>
        <p>
          <strong>📌 Ví dụ:</strong> Nếu bạn chọn "Thứ 2 - Buổi sáng", học viên có thể chọn:
          7:00-9:00, 8:00-10:00, 9:00-11:00, 7:30-9:30, v.v...
        </p>
      </div>
    </div>
  );
};

export default SimpleAvailabilitySelector;
