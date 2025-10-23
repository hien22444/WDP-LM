import React, { useMemo, useState, useEffect, useRef } from "react";

const DAYS = [
  { label: "CN", idx: 0 },
  { label: "T2", idx: 1 },
  { label: "T3", idx: 2 },
  { label: "T4", idx: 3 },
  { label: "T5", idx: 4 },
  { label: "T6", idx: 5 },
  { label: "T7", idx: 6 },
];

function generateTimes(startHour, endHour, stepMinutes) {
  const stepsPerHour = Math.floor(60 / stepMinutes);
  const totalSteps = (endHour - startHour) * stepsPerHour + 1;
  return Array.from({ length: totalSteps }, (_, i) => {
    const totalMinutes = startHour * 60 + i * stepMinutes;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  });
}

const DayTimeRanges = ({
  startHour = 7,
  endHour = 23,
  stepMinutes = 30,
  defaultAvailability = [],
  onChange
}) => {
  const times = useMemo(() => generateTimes(startHour, endHour, stepMinutes), [startHour, endHour, stepMinutes]);

  // State: map dayIdx -> [{start,end}]
  const [rangesByDay, setRangesByDay] = useState(() => {
    const init = new Map();
    for (const d of DAYS) init.set(d.idx, []);
    for (const s of defaultAvailability || []) {
      const day = Number(s.dayOfWeek);
      if (!init.has(day)) init.set(day, []);
      init.get(day).push({ start: s.start, end: s.end });
    }
    for (const d of DAYS) {
      const list = init.get(d.idx);
      list.sort((a, b) => a.start.localeCompare(b.start));
    }
    return init;
  });

  useEffect(() => {
    const items = [];
    for (const [day, list] of rangesByDay.entries()) {
      for (const r of list) items.push({ dayOfWeek: day, start: r.start, end: r.end });
    }
    onChange && onChange(items);
  }, [rangesByDay, onChange]);

  const addRange = (day, start, end) => {
    if (!start || !end || start >= end) return;
    setRangesByDay(prev => {
      const next = new Map(prev);
      const list = [...(next.get(day) || [])];
      // merge overlaps
      list.push({ start, end });
      list.sort((a, b) => a.start.localeCompare(b.start));
      const merged = [];
      for (const cur of list) {
        if (!merged.length) { merged.push(cur); continue; }
        const last = merged[merged.length - 1];
        if (cur.start <= last.end) {
          if (cur.end > last.end) last.end = cur.end;
        } else {
          merged.push(cur);
        }
      }
      next.set(day, merged);
      return next;
    });
  };

  const removeRange = (day, idx) => {
    setRangesByDay(prev => {
      const next = new Map(prev);
      const list = [...(next.get(day) || [])];
      list.splice(idx, 1);
      next.set(day, list);
      return next;
    });
  };

  const copyTo = (fromDay, to) => {
    const src = rangesByDay.get(fromDay) || [];
    const targets = to === 'weekday' ? [1,2,3,4,5] : to === 'weekend' ? [6,0] : to === 'all' ? [0,1,2,3,4,5,6] : [];
    setRangesByDay(prev => {
      const next = new Map(prev);
      for (const d of targets) next.set(d, src.map(r => ({ ...r })));
      return next;
    });
  };

  // Timetable row interactions (click/drag per 30')
  const dragging = useRef(false);
  const dragMode = useRef('add');
  const startCell = useRef(null);

  const cellToMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const minutesToTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };

  const applyDragSelection = (day, t1, t2) => {
    const a = Math.min(cellToMinutes(t1), cellToMinutes(t2));
    const b = Math.max(cellToMinutes(t1), cellToMinutes(t2)) + stepMinutes; // inclusive end cell
    addRange(day, minutesToTime(a), minutesToTime(b));
  };

  const onCellMouseDown = (day, time) => {
    dragging.current = true;
    dragMode.current = 'add';
    startCell.current = { day, time };
  };
  const onCellMouseEnter = (e) => {
    if (!dragging.current || !startCell.current) return;
    const day = Number(e.currentTarget.dataset.day);
    const time = e.currentTarget.dataset.time;
    if (day !== startCell.current.day) return;
    // highlight during drag
    e.currentTarget.style.background = '#e0e7ff';
  };
  const onMouseUp = (day, time) => {
    if (!dragging.current || !startCell.current) return;
    applyDragSelection(day, startCell.current.time, time);
    dragging.current = false;
    startCell.current = null;
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Khung giờ theo ngày (kiểu mới)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', rowGap: 12, columnGap: 12 }}>
        {DAYS.map(d => (
          <React.Fragment key={d.idx}>
            <div style={{ fontWeight: 600, textAlign: 'right', paddingTop: 6 }}>{d.label}</div>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ marginLeft: 8, color: '#64748b' }}>|</span>
                <label>Sao chép đến</label>
                <button type="button" onClick={() => copyTo(d.idx, 'weekday')} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}>T2–T6</button>
                <button type="button" onClick={() => copyTo(d.idx, 'weekend')} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}>T7–CN</button>
                <button type="button" onClick={() => copyTo(d.idx, 'all')} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Tất cả</button>
                <button type="button" onClick={() => setRangesByDay(prev => { const next = new Map(prev); next.set(d.idx, []); return next; })} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ef4444', color: '#b91c1c' }}>Xóa ngày</button>
              </div>
              {/* Compact timetable row for this day */}
              <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${times.length - 1}, 1fr)`, columnGap: 4, alignItems: 'center', marginTop: 10 }} onMouseLeave={() => { dragging.current = false; startCell.current = null; }}>
                <div style={{ color: '#64748b', fontSize: 12 }}></div>
                {times.slice(0, -1).map((t, idx) => (
                  <div
                    key={`${d.idx}-${t}`}
                    data-day={d.idx}
                    data-time={t}
                    onMouseDown={() => onCellMouseDown(d.idx, t)}
                    onMouseEnter={onCellMouseEnter}
                    onMouseUp={() => onMouseUp(d.idx, t)}
                    title={t}
                    style={{
                      height: 20,
                      borderRadius: 4,
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                      cursor: 'crosshair'
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {(rangesByDay.get(d.idx) || []).map((r, idx) => (
                  <span key={`${d.idx}-${idx}`} style={{ padding: '4px 8px', borderRadius: 999, background: '#eef2ff', border: '1px solid #c7d2fe', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {r.start}–{r.end}
                    <button type="button" onClick={() => removeRange(d.idx, idx)} style={{ background: 'transparent', border: 'none', color: '#1f2937', cursor: 'pointer' }}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default DayTimeRanges;


