# Tính năng chọn giờ học tùy chỉnh (Custom Time Booking)

## 📌 Tổng quan
Tính năng này cho phép học viên chọn giờ bắt đầu và kết thúc tùy chỉnh trong mỗi buổi học (sáng/chiều), thay vì chỉ chọn khung giờ cố định.

## ⏰ Quy tắc thời gian

### Khung giờ
- **Buổi sáng**: 07:00 - 11:30
- **Buổi chiều**: 13:00 - 16:30

### Ràng buộc
- ✅ Thời lượng tối thiểu: **2 giờ**
- ✅ Thời lượng tối đa: **8 giờ** (kiểm tra ở backend)
- ✅ Giờ bắt đầu và kết thúc phải nằm trong khung giờ của buổi học

## 🎨 Luồng hoạt động (User Flow)

### 1. Chọn buổi học trên lịch
- Học viên click vào ô lịch (buổi sáng hoặc buổi chiều)
- Chỉ có thể click vào buổi học mà gia sư có rảnh (hiển thị ✓)
- Khi click, modal chọn giờ sẽ xuất hiện

### 2. Modal chọn giờ học
Modal hiển thị:
- **Thông tin buổi học**: Ngày (T2-CN) và buổi (Sáng/Chiều)
- **Input giờ bắt đầu**: Time picker với giới hạn theo buổi học
- **Input giờ kết thúc**: Time picker với giới hạn theo buổi học
- **Hiển thị thời lượng**: Tự động tính toán và cảnh báo nếu < 2 giờ

### 3. Lưu hoặc xóa
- **Nút "Lưu"**: Lưu thời gian đã chọn (nếu hợp lệ)
- **Nút "Xóa"**: Xóa buổi học đã chọn
- **Nút "✕"**: Đóng modal mà không lưu thay đổi

### 4. Hiển thị slots đã chọn
Sau khi lưu, buổi học được hiển thị:
- Trên lịch: Ô có dấu ✓ màu xanh + hiển thị giờ bên dưới
- Trong danh sách: Card hiển thị ngày, buổi, và giờ cụ thể (ví dụ: "T2 - 🌅 Sáng | ⏰ 08:00 - 10:00")

## 💻 Cấu trúc dữ liệu

### State: `selectedSlots`
```javascript
[
  {
    dayOfWeek: 1,           // 0=CN, 1=T2, ..., 6=T7
    session: 'morning',      // 'morning' | 'afternoon'
    start: '08:00',          // HH:MM format
    end: '10:00'             // HH:MM format
  },
  // ...more slots
]
```

### State: `currentEditSlot`
Slot đang được chỉnh sửa trong modal (cùng structure với selectedSlots item)

### State: `showTimeModal`
Boolean để hiển thị/ẩn modal

## 🔧 Các hàm chính

### `toggleSlot(dayOfWeek, session)`
- **Mục đích**: Xử lý khi click vào ô lịch
- **Hành động**:
  - Nếu slot đã tồn tại → Mở modal để edit
  - Nếu slot chưa tồn tại → Tạo slot mới với giờ mặc định, thêm vào selectedSlots, mở modal

```javascript
const toggleSlot = (dayOfWeek, session) => {
  const exists = selectedSlots.find(s => s.dayOfWeek === dayOfWeek && s.session === session);
  if (exists) {
    setCurrentEditSlot(exists);
    setShowTimeModal(true);
  } else {
    const newSlot = {
      dayOfWeek, 
      session, 
      start: defaultTimes[session].start, 
      end: defaultTimes[session].end
    };
    setSelectedSlots(prev => [...prev, newSlot]);
    setCurrentEditSlot(newSlot);
    setShowTimeModal(true);
  }
};
```

### `saveSlotTime(slotData)`
- **Mục đích**: Lưu thời gian đã chọn
- **Validation**:
  - Kiểm tra start/end có giá trị
  - Tính thời lượng
  - Kiểm tra tối thiểu 2 giờ
  - Kiểm tra giờ nằm trong khung giờ cho phép

```javascript
const saveSlotTime = (slotData) => {
  if (!slotData.start || !slotData.end) {
    toast.error("Vui lòng chọn giờ bắt đầu và kết thúc");
    return;
  }

  // Tính duration
  const [startH, startM] = slotData.start.split(':').map(Number);
  const [endH, endM] = slotData.end.split(':').map(Number);
  const duration = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;

  // Validate minimum 2 hours
  if (duration < 2) {
    toast.error("Buổi học phải có thời lượng tối thiểu 2 giờ");
    return;
  }

  // Validate time range
  const timeRanges = {
    morning: {min: '07:00', max: '11:30'},
    afternoon: {min: '13:00', max: '16:30'}
  };
  const range = timeRanges[slotData.session];
  
  if (slotData.start < range.min || slotData.end > range.max) {
    toast.error(`Giờ học phải trong khung ${range.min} - ${range.max}`);
    return;
  }

  // Update selectedSlots
  setSelectedSlots(prev => prev.map(s => 
    s.dayOfWeek === slotData.dayOfWeek && s.session === slotData.session 
      ? slotData 
      : s
  ));
  
  toast.success("Đã lưu giờ học!");
};
```

### `removeSlot(dayOfWeek, session)`
- **Mục đích**: Xóa slot khỏi selectedSlots
- **Hành động**: Filter bỏ slot có cùng dayOfWeek và session

```javascript
const removeSlot = (dayOfWeek, session) => {
  setSelectedSlots(prev => prev.filter(
    s => !(s.dayOfWeek === dayOfWeek && s.session === session)
  ));
};
```

## 🎨 UI Components

### TimeModal Component (inline)
Modal được render trong BookingPage với structure:
```jsx
{showTimeModal && currentEditSlot && (
  <div className="time-modal-overlay">
    <div className="time-modal">
      <div className="time-modal-header">...</div>
      <div className="time-modal-body">
        {/* Time info */}
        {/* Time inputs */}
        {/* Duration display */}
      </div>
      <div className="time-modal-footer">
        <button className="btn-cancel">Xóa</button>
        <button className="btn-save">Lưu</button>
      </div>
    </div>
  </div>
)}
```

### Calendar Grid
- Morning row: Click → `toggleSlot(dayIndex, 'morning')`
- Afternoon row: Click → `toggleSlot(dayIndex, 'afternoon')`
- Selected cells hiển thị: dấu ✓ + thời gian bên dưới

### Selected Slots Display
```jsx
{selectedSlots.map((slot, idx) => (
  <div key={idx} className="selected-slot-card">
    <div>{dayNames[slot.dayOfWeek]} - {sessionLabel}</div>
    {slot.start && slot.end && (
      <div>⏰ {slot.start} - {slot.end}</div>
    )}
  </div>
))}
```

## 🔄 Backend Integration

### Payload gửi lên backend
```javascript
{
  tutorProfileId: "...",
  startDate: "2024-01-15",
  selectedSlots: [
    {
      dayOfWeek: 1,     // Backend expects number
      start: "08:00",   // Backend expects HH:MM string
      end: "10:00"      // Backend expects HH:MM string
    }
  ],
  numberOfWeeks: 4,
  mode: "online",
  pricePerSession: 200000,
  notes: "..."
}
```

### Backend validation (backend/src/routes/booking.js)
```javascript
// Kiểm tra duration tối thiểu 2 giờ
const [startH, startM] = slot.start.split(':').map(Number);
const [endH, endM] = slot.end.split(':').map(Number);
const duration = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;

if (duration < 2) {
  return res.status(400).json({
    success: false,
    message: `Buổi học phải có thời lượng tối thiểu 2 giờ. Slot hiện tại: ${duration} giờ`
  });
}
```

## ✅ Validation Checklist

### Frontend Validation
- [x] Giờ bắt đầu và kết thúc phải được chọn
- [x] Thời lượng tối thiểu 2 giờ
- [x] Giờ nằm trong khung giờ cho phép (07:00-11:30 hoặc 13:00-16:30)
- [x] Hiển thị warning realtime khi < 2 giờ

### Backend Validation
- [x] Thời lượng tối thiểu 2 giờ
- [x] Thời lượng tối đa 8 giờ
- [x] dayOfWeek là số từ 0-6
- [x] start/end là string HH:MM format

## 📝 Ví dụ sử dụng

### Kịch bản 1: Tạo booking mới
1. Học viên mở trang booking tutor
2. Click vào ô "Thứ 2 - Buổi sáng"
3. Modal hiện lên với giờ mặc định 07:00 - 09:00
4. Học viên đổi thành 08:00 - 10:30 (2.5 giờ)
5. Click "Lưu" → Modal đóng, lịch hiển thị "T2 - 🌅 Sáng | ⏰ 08:00 - 10:30"
6. Tiếp tục chọn thêm buổi khác nếu muốn
7. Điền thông tin còn lại (môn học, số tuần, ghi chú)
8. Submit → Backend tạo bookings theo lịch đã chọn

### Kịch bản 2: Sửa slot đã chọn
1. Click lại vào ô đã chọn màu xanh
2. Modal hiện lên với giờ hiện tại
3. Chỉnh sửa giờ
4. Click "Lưu" để cập nhật hoặc "Xóa" để bỏ buổi học này

## 🐛 Known Issues & Solutions

### Issue 1: Modal không mở
**Nguyên nhân**: `showTimeModal` state không được set true  
**Giải pháp**: Kiểm tra toggleSlot có gọi `setShowTimeModal(true)`

### Issue 2: Giờ không được lưu
**Nguyên nhân**: Không update selectedSlots sau khi edit  
**Giải pháp**: Trong saveSlotTime, dùng map để update slot đúng

### Issue 3: Backend trả về 400 "duration < 2"
**Nguyên nhân**: Frontend cho phép lưu < 2 giờ  
**Giải pháp**: Thêm validation trong saveSlotTime

## 📊 Performance Notes
- Modal render conditionally: `{showTimeModal && ...}`
- Không re-render toàn bộ calendar khi chỉ 1 slot thay đổi
- Time input native HTML5 → không cần external library

## 🔮 Future Improvements
- [ ] Drag to select multiple slots at once
- [ ] Copy/paste slot times across days
- [ ] Preset templates (ví dụ: "T2-T6 sáng 08:00-10:00")
- [ ] Visual timeline view thay vì grid
- [ ] Conflict detection khi gia sư có lịch đã book
