import React, { useState, useEffect } from "react";

const DAYS = [
  { label: "CN", idx: 0 },
  { label: "T2", idx: 1 },
  { label: "T3", idx: 2 },
  { label: "T4", idx: 3 },
  { label: "T5", idx: 4 },
  { label: "T6", idx: 5 },
  { label: "T7", idx: 6 },
];

const DayTimeBlocks = ({
  defaultAvailability = [],
  onChange,
  morning = { start: "08:00", end: "11:00" },
  afternoon = { start: "13:00", end: "17:00" },
  evening = { start: "18:00", end: "21:00" }
}) => {
  const [blockTimes, setBlockTimes] = useState({
    morning: { ...morning },
    afternoon: { ...afternoon },
    evening: { ...evening }
  });
  // Per-cell custom times (day -> { morning?: {start,end}, ... })
  const [customTimes, setCustomTimes] = useState(new Map());
  const [editing, setEditing] = useState(null); // { day, block } | null
  // Map day -> { morning, afternoon, evening } booleans
  const [selected, setSelected] = useState(() => {
    const init = new Map(DAYS.map(d => [d.idx, { morning: false, afternoon: false, evening: false }]));
    for (const s of defaultAvailability || []) {
      const day = Number(s.dayOfWeek);
      if (!init.has(day)) init.set(day, { morning: false, afternoon: false, evening: false });
      const key = (s.start === morning.start && s.end === morning.end) ? 'morning'
        : (s.start === afternoon.start && s.end === afternoon.end) ? 'afternoon'
        : (s.start === evening.start && s.end === evening.end) ? 'evening'
        : null;
      if (key) init.get(day)[key] = true;
    }
    return init;
  });

  const getTimeFor = (day, block) => {
    const dayCustom = customTimes.get(day);
    if (dayCustom && dayCustom[block]) return dayCustom[block];
    return blockTimes[block];
  };

  const emit = (map) => {
    const items = [];
    for (const [day, v] of map.entries()) {
      if (v.morning) { const t = getTimeFor(day, 'morning'); items.push({ dayOfWeek: day, start: t.start, end: t.end }); }
      if (v.afternoon) { const t = getTimeFor(day, 'afternoon'); items.push({ dayOfWeek: day, start: t.start, end: t.end }); }
      if (v.evening) { const t = getTimeFor(day, 'evening'); items.push({ dayOfWeek: day, start: t.start, end: t.end }); }
    }
    onChange && onChange(items);
  };

  useEffect(() => { emit(selected); }, [selected, blockTimes, customTimes]);

  const toggle = (day, block) => {
    setSelected(prev => {
      const next = new Map(prev);
      next.set(day, { ...next.get(day), [block]: !next.get(day)[block] });
      return next;
    });
  };

  const setColumn = (block, value) => {
    setSelected(prev => {
      const next = new Map(prev);
      for (const d of DAYS) next.set(d.idx, { ...next.get(d.idx), [block]: value });
      return next;
    });
  };

  const clearDay = (day) => setSelected(prev => { const n = new Map(prev); n.set(day, { morning: false, afternoon: false, evening: false }); return n; });
  const clearAll = () => setSelected(new Map(DAYS.map(d => [d.idx, { morning: false, afternoon: false, evening: false }])));

  const saveCellTime = (day, block, start, end) => {
    if (!start || !end || start >= end) return setEditing(null);
    setCustomTimes(prev => {
      const next = new Map(prev);
      const cur = { ...(next.get(day) || {}) };
      cur[block] = { start, end };
      next.set(day, cur);
      return next;
    });
    setEditing(null);
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700 }}>Chọn theo buổi (Sáng/Chiều/Tối)</div>
        <button type="button" onClick={clearAll} style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 6, border: '1px solid #ef4444', color: '#b91c1c' }}>Xóa tất cả</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(3, 1fr)', gap: 8 }}>
        <div />
        <div style={{ textAlign: 'center', fontWeight: 600 }}>
          Sáng
          <div>
            <button type="button" onClick={() => setColumn('morning', true)} style={{ fontSize: 11, background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer' }}>Chọn hết</button>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontWeight: 600 }}>
          Chiều
          <div>
            <button type="button" onClick={() => setColumn('afternoon', true)} style={{ fontSize: 11, background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer' }}>Chọn hết</button>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontWeight: 600 }}>
          Tối
          <div>
            <button type="button" onClick={() => setColumn('evening', true)} style={{ fontSize: 11, background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer' }}>Chọn hết</button>
          </div>
        </div>

        {DAYS.map(d => {
          const v = selected.get(d.idx) || { morning: false, afternoon: false, evening: false };
          return (
            <React.Fragment key={d.idx}>
              <div style={{ textAlign: 'right', paddingRight: 6, fontWeight: 600 }}>
                {d.label}
                <div>
                  <button type="button" onClick={() => clearDay(d.idx)} style={{ fontSize: 11, background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer' }}>Xóa ngày</button>
                </div>
              </div>
              {["morning","afternoon","evening"].map((block, bi) => {
                const times = getTimeFor(d.idx, block);
                const active = v[block];
                const isEditing = editing && editing.day === d.idx && editing.block === block;
                const bg = block === 'morning' ? '#a7f3d0' : block === 'afternoon' ? '#fde68a' : '#bfdbfe';
                return (
                  <div key={`${d.idx}-${block}`} style={{ height: 44, borderRadius: 8, border: '1px solid #e5e7eb', background: active ? bg : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 6 }}>
                    {!isEditing ? (
                      <>
                        <button type="button" onClick={() => toggle(d.idx, block)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>{times.start}–{times.end}</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setEditing({ day: d.idx, block }); }} title="Sửa giờ" style={{ position: 'absolute', right: 6, top: 6, background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>✎</button>
                      </>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="time" defaultValue={times.start} onChange={(e) => (editing.start = e.target.value)} />
                        <span>–</span>
                        <input type="time" defaultValue={times.end} onChange={(e) => (editing.end = e.target.value)} />
                        <button type="button" onClick={() => saveCellTime(d.idx, block, editing.start || times.start, editing.end || times.end)} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid #e5e7eb' }}>Lưu</button>
                        <button type="button" onClick={() => setEditing(null)} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid #e5e7eb' }}>Hủy</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default DayTimeBlocks;


