import React, { useMemo, useState, useRef } from "react";

// Helper to generate time labels with custom range and step
function generateTimes(startHour, endHour, stepMinutes) {
  const stepsPerHour = Math.floor(60 / stepMinutes);
  const totalSteps = (endHour - startHour) * stepsPerHour + 1; // inclusive end
  return Array.from({ length: totalSteps }, (_, i) => {
    const minutesFromStart = i * stepMinutes;
    const totalMinutes = startHour * 60 + minutesFromStart;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
  });
}
const DAYS = [
  { label: "T2", idx: 1 },
  { label: "T3", idx: 2 },
  { label: "T4", idx: 3 },
  { label: "T5", idx: 4 },
  { label: "T6", idx: 5 },
  { label: "T7", idx: 6 },
  { label: "CN", idx: 0 },
];

function toKey(day, time) { return `${day}-${time}`; }

// Group contiguous selected 30-min cells to slots { dayOfWeek, start, end }
function toAvailability(selected) {
  const perDay = new Map();
  for (const key of selected) {
    const [d, t] = key.split("-");
    if (!perDay.has(d)) perDay.set(d, []);
    perDay.get(d).push(t);
  }
  const slots = [];
  for (const [day, hours] of perDay.entries()) {
    hours.sort();
    let start = null, prev = null;
    for (const t of hours) {
      const [hh, mm] = t.split(":").map(Number);
      const minutes = hh * 60 + mm;
      if (start === null) { start = minutes; prev = minutes; continue; }
      if (minutes === prev + 30) { prev = minutes; continue; }
      const sH = Math.floor(start/60), sM = start%60;
      const eH = Math.floor((prev+30)/60), eM = (prev+30)%60;
      slots.push({ dayOfWeek: Number(day), start: `${sH.toString().padStart(2,'0')}:${sM.toString().padStart(2,'0')}`, end: `${eH.toString().padStart(2,'0')}:${eM.toString().padStart(2,'0')}` });
      start = minutes; prev = minutes;
    }
    if (start !== null) {
      const sH = Math.floor(start/60), sM = start%60;
      const eH = Math.floor((prev+30)/60), eM = (prev+30)%60;
      slots.push({ dayOfWeek: Number(day), start: `${sH.toString().padStart(2,'0')}:${sM.toString().padStart(2,'0')}`, end: `${eH.toString().padStart(2,'0')}:${eM.toString().padStart(2,'0')}` });
    }
  }
  return slots;
}

const AvailabilityGrid = ({ defaultAvailability = [], onChange, startHour = 6, endHour = 22, stepMinutes = 30 }) => {
  const times = useMemo(() => generateTimes(startHour, endHour, stepMinutes), [startHour, endHour, stepMinutes]);
  // Convert defaultAvailability to selected keys
  const defaultSelected = useMemo(() => {
    const set = new Set();
    for (const s of defaultAvailability) {
      const day = Number(s.dayOfWeek);
      const [sh, sm] = (s.start || "06:00").split(":").map(Number);
      const [eh, em] = (s.end || "06:30").split(":").map(Number);
      let minutes = sh*60 + (sm||0);
      const end = eh*60 + (em||0);
      while (minutes < end) {
        const h = Math.floor(minutes/60), m = minutes%60;
        set.add(toKey(day, `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`));
        minutes += 30;
      }
    }
    return set;
  }, [defaultAvailability]);

  const [selected, setSelected] = useState(defaultSelected);
  // Quick add state
  const [quickDay, setQuickDay] = useState("weekday"); // weekday | weekend | all | 0..6
  const [quickStart, setQuickStart] = useState("18:00");
  const [quickEnd, setQuickEnd] = useState("20:00");
  const dragging = useRef(false);
  const dragMode = useRef(null); // 'add' | 'remove'

  const toggle = (day, time) => {
    const key = toKey(day, time);
    const s = new Set(selected);
    if (s.has(key)) s.delete(key); else s.add(key);
    setSelected(s);
    onChange && onChange(toAvailability(s));
  };

  const handleMouseDown = (day, time) => {
    dragging.current = true;
    const key = toKey(day, time);
    const isActive = selected.has(key);
    dragMode.current = isActive ? 'remove' : 'add';
    toggle(day, time);
  };

  const handleMouseEnter = (day, time) => {
    if (!dragging.current) return;
    const key = toKey(day, time);
    const s = new Set(selected);
    if (dragMode.current === 'add') {
      if (!s.has(key)) {
        s.add(key);
        setSelected(s);
        onChange && onChange(toAvailability(s));
      }
    } else {
      if (s.has(key)) {
        s.delete(key);
        setSelected(s);
        onChange && onChange(toAvailability(s));
      }
    }
  };

  const handleMouseUp = () => { dragging.current = false; };

  // Helpers for range operations
  const addRange = (s, day, startTime, endTime) => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    let m = sh * 60 + (sm || 0);
    const end = eh * 60 + (em || 0);
    while (m < end) {
      const h = Math.floor(m / 60), mm = m % 60;
      s.add(toKey(day, `${h.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}`));
      m += 30;
    }
  };

  const clearDay = (day) => {
    const s = new Set(selected);
    for (const t of times) s.delete(toKey(day, t));
    setSelected(s);
    onChange && onChange(toAvailability(s));
  };

  const clearAll = () => {
    const s = new Set();
    setSelected(s);
    onChange && onChange([]);
  };

  const resolveDays = (mode) => {
    if (mode === 'weekday') return [1,2,3,4,5];
    if (mode === 'weekend') return [6,0];
    if (mode === 'all') return [1,2,3,4,5,6,0];
    const n = Number(mode);
    return Number.isNaN(n) ? [] : [n];
  };

  const applyQuickAdd = () => {
    if (!quickStart || !quickEnd || quickStart >= quickEnd) return;
    const s = new Set(selected);
    for (const d of resolveDays(quickDay)) addRange(s, d, quickStart, quickEnd);
    setSelected(s);
    onChange && onChange(toAvailability(s));
  };

  const isFullHour = (t) => t.endsWith(':00');

  return (
    <div>
      {/* Legend + wrapper card */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        marginBottom: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700 }}>Thời khóa biểu rảnh</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 12 }}>
            <span style={{ width: 14, height: 14, background: '#a78bfa', border: '1px solid #8b5cf6', borderRadius: 4 }} />
            <span>Đang chọn</span>
            <span style={{ width: 14, height: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4 }} />
            <span>Trống</span>
            <span style={{ borderTop: '2px solid #cbd5e1', width: 24 }} />
            <span>Vạch giờ</span>
          </div>
        </div>
      {/* Quick tools */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 600 }}>Thêm nhanh:</label>
        <select value={quickDay} onChange={(e) => setQuickDay(e.target.value)}>
          <option value="weekday">T2–T6</option>
          <option value="weekend">T7–CN</option>
          <option value="all">Tất cả</option>
          {DAYS.map(d => <option key={d.idx} value={String(d.idx)}>Chỉ {d.label}</option>)}
        </select>
        <select value={quickStart} onChange={(e) => setQuickStart(e.target.value)}>
          {times.map(t => <option key={`s-${t}`} value={t}>{t}</option>)}
        </select>
        <span>→</span>
        <select value={quickEnd} onChange={(e) => setQuickEnd(e.target.value)}>
          {times.map(t => <option key={`e-${t}`} value={t}>{t}</option>)}
        </select>
        <button type="button" onClick={applyQuickAdd} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#4f46e5', color: '#fff' }}>Thêm</button>
        <span style={{ marginLeft: 12, color: '#64748b' }}>|</span>
        <button type="button" onClick={() => { setQuickDay('weekday'); setQuickStart('08:00'); setQuickEnd('11:00'); applyQuickAdd(); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Sáng 08–11 (T2–T6)</button>
        <button type="button" onClick={() => { setQuickDay('weekday'); setQuickStart('13:00'); setQuickEnd('17:00'); applyQuickAdd(); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Chiều 13–17 (T2–T6)</button>
        <button type="button" onClick={() => { setQuickDay('all'); setQuickStart('18:00'); setQuickEnd('21:00'); applyQuickAdd(); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Tối 18–21 (Tất cả)</button>
        <span style={{ marginLeft: 12, color: '#64748b' }}>|</span>
        <button type="button" onClick={clearAll} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ef4444', color: '#b91c1c', background: '#fff' }}>Xóa tất cả</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${DAYS.length}, 1fr)`, gap: 6 }} onMouseLeave={handleMouseUp}>
        <div />
        {DAYS.map(d => (
          <div key={d.idx} style={{ textAlign: 'center', fontWeight: 600 }}>
            {d.label}
            <div>
              <button type="button" onClick={() => clearDay(d.idx)} style={{ marginTop: 4, fontSize: 11, color: '#b91c1c', background: 'transparent', border: 'none', cursor: 'pointer' }}>Xóa ngày</button>
            </div>
          </div>
        ))}
        {times.map(t => (
          <React.Fragment key={t}>
            <div style={{ textAlign: 'right', paddingRight: 6, color: isFullHour(t) ? '#0f172a' : '#64748b', fontWeight: isFullHour(t) ? 600 : 400 }}>{t}</div>
            {DAYS.map(d => {
              const active = selected.has(toKey(d.idx, t));
              return (
                <button
                  type="button"
                  key={`${d.idx}-${t}`}
                  onMouseDown={() => handleMouseDown(d.idx, t)}
                  onMouseEnter={() => handleMouseEnter(d.idx, t)}
                  onMouseUp={handleMouseUp}
                  style={{
                    height: 24,
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    borderTopWidth: isFullHour(t) ? 2 : 1,
                    background: active ? '#a78bfa' : '#fff',
                    color: active ? '#fff' : '#111',
                    cursor: 'pointer',
                    transition: 'background 120ms ease',
                    boxShadow: active ? 'inset 0 0 0 1px #8b5cf6' : 'none'
                  }}
                  onMouseOver={(e) => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseOut={(e) => { if (!active) e.currentTarget.style.background = '#fff'; }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      </div>
      <div style={{ marginTop: 8, color: '#64748b', fontSize: 12 }}>Nhấn để chọn. Giữ chuột và kéo để chọn nhanh. Ô 30 phút; vạch đậm theo đầu giờ.</div>
    </div>
  );
};

export default AvailabilityGrid;


