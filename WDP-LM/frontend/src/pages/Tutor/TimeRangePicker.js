import React, { useMemo } from "react";

function generateTimes(startHour, endHour, stepMinutes) {
  const stepsPerHour = Math.floor(60 / stepMinutes);
  const totalSteps = (endHour - startHour) * stepsPerHour + 1; // inclusive
  return Array.from({ length: totalSteps }, (_, i) => {
    const totalMinutes = startHour * 60 + i * stepMinutes;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  });
}

const TimeRangePicker = ({
  startHour = 7,
  endHour = 23,
  stepMinutes = 30,
  value,
  onChange
}) => {
  const times = useMemo(() => generateTimes(startHour, endHour, stepMinutes), [startHour, endHour, stepMinutes]);

  const set = (patch) => onChange && onChange({ ...value, ...patch });

  const applyDuration = (minutes) => {
    if (!value?.start || !value?.date) return;
    const [sh, sm] = value.start.split(":").map(Number);
    const start = new Date(`${value.date}T${value.start}:00`);
    const endMs = start.getTime() + minutes * 60 * 1000;
    const end = new Date(endMs);
    const eh = end.getHours().toString().padStart(2, '0');
    const em = end.getMinutes().toString().padStart(2, '0');
    set({ end: `${eh}:${em}` });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
      <div>
        <label>Ngày</label>
        <input type="date" value={value?.date || ''} onChange={(e) => set({ date: e.target.value })} />
      </div>
      <div>
        <label>Bắt đầu</label>
        <select value={value?.start || ''} onChange={(e) => set({ start: e.target.value })}>
          <option value="" disabled>Chọn giờ</option>
          {times.map(t => <option key={`s-${t}`} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label>Kết thúc</label>
        <select value={value?.end || ''} onChange={(e) => set({ end: e.target.value })}>
          <option value="" disabled>Chọn giờ</option>
          {times.map(t => <option key={`e-${t}`} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => applyDuration(60)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}>+60'</button>
        <button type="button" onClick={() => applyDuration(90)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}>+90'</button>
        <button type="button" onClick={() => applyDuration(120)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}>+120'</button>
      </div>
    </div>
  );
};

export default TimeRangePicker;


