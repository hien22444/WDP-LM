# ✅ THÊM NÚT "THÊM MÔN KHÁC" VÀO ONBOARDING

> Ngày: 11/11/2025
> Yêu cầu: Giữ list hardcoded + thêm input để add môn tự do

---

## 📋 YÊU CẦU

1. ✅ Giữ nguyên danh sách 9 môn hardcoded (Toán, Lý, Hóa...)
2. ✅ Thêm nút "Thêm môn khác" để nhập môn/kỹ năng không có trong list
3. ✅ Lưu tất cả môn (hardcoded + custom) vào database

---

## 🛠️ THAY ĐỔI

### 1. State mới (OnboardingWizard.js line 16)

```javascript
const [customSubjectInput, setCustomSubjectInput] = useState(""); // Input cho môn tự thêm
```

### 2. Function thêm môn tùy chỉnh (line 85-108)

```javascript
// Thêm môn học tự nhập
const handleAddCustomSubject = () => {
  const trimmedInput = customSubjectInput.trim();
  
  if (!trimmedInput) {
    toast.warning("⚠️ Vui lòng nhập tên môn học hoặc kỹ năng");
    return;
  }

  // Kiểm tra trùng
  if (formData.subjects.some((s) => s.name.toLowerCase() === trimmedInput.toLowerCase())) {
    toast.warning("⚠️ Môn học này đã có trong danh sách");
    return;
  }

  // Thêm vào danh sách
  setFormData((prev) => ({
    ...prev,
    subjects: [
      ...prev.subjects,
      { name: trimmedInput },
    ],
  }));

  // Clear input
  setCustomSubjectInput("");
  toast.success(`✅ Đã thêm "${trimmedInput}"`);
};
```

**Tính năng:**
- ✅ Trim whitespace
- ✅ Kiểm tra rỗng
- ✅ Kiểm tra trùng (case-insensitive)
- ✅ Thêm vào `formData.subjects`
- ✅ Clear input sau khi thêm
- ✅ Hiện toast thông báo

### 3. UI mới (line 530-599)

**Phần 1: Input + Button**
```jsx
{/* Thêm môn học tự nhập */}
<div className="custom-subject-input">
  <label>
    ➕ Môn học/Kỹ năng khác không có trong danh sách?
  </label>
  <div className="input-with-button">
    <input
      type="text"
      value={customSubjectInput}
      onChange={(e) => setCustomSubjectInput(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleAddCustomSubject();
        }
      }}
      placeholder="Ví dụ: Tiếng Nhật, Guitar, Vẽ, Lập trình Python..."
    />
    <button
      type="button"
      className="btn-add-subject"
      onClick={handleAddCustomSubject}
    >
      ➕ Thêm
    </button>
  </div>
  <small className="hint">
    💡 Nhập tên môn học hoặc kỹ năng và nhấn "Thêm"
  </small>
</div>
```

**Tính năng:**
- ✅ Input với placeholder hướng dẫn
- ✅ Enter để thêm nhanh
- ✅ Button "➕ Thêm"
- ✅ Hint text

**Phần 2: Hiển thị môn đã chọn**
```jsx
{/* Hiển thị môn đã chọn */}
{formData.subjects.length > 0 && (
  <div className="selected-subjects">
    <label>📚 Các môn đã chọn ({formData.subjects.length}):</label>
    <div className="subject-tags">
      {formData.subjects.map((subject, index) => (
        <div key={index} className="subject-tag">
          <span>{subject.name}</span>
          <button
            type="button"
            className="remove-tag"
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                subjects: prev.subjects.filter(
                  (_, i) => i !== index
                ),
              }));
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  </div>
)}
```

**Tính năng:**
- ✅ Hiển thị tất cả môn đã chọn (hardcoded + custom)
- ✅ Tag với gradient đẹp
- ✅ Nút ✕ để xóa từng môn
- ✅ Đếm số môn đã chọn
- ✅ Animation fadeIn

### 4. CSS mới (OnboardingWizard.scss)

**Custom subject input:**
```scss
.custom-subject-input {
  margin-top: 24px;
  padding: 20px;
  background: #f0f9ff; // Xanh nhạt
  border: 2px dashed #60a5fa;
  border-radius: 8px;

  .input-with-button {
    display: flex;
    gap: 12px;

    input {
      flex: 1;
      padding: 10px 14px;
      border: 2px solid #bfdbfe;
      border-radius: 6px;
      
      &:focus {
        border-color: #3b82f6;
      }
    }

    .btn-add-subject {
      padding: 10px 20px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
    }
  }
}
```

**Selected subjects tags:**
```scss
.selected-subjects {
  margin-top: 20px;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;

  .subject-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    .subject-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: linear-gradient(135deg, #5b7cff, #7a5af8);
      color: white;
      border-radius: 20px;
      animation: fadeIn 0.3s ease;

      .remove-tag {
        background: rgba(255, 255, 255, 0.2);
        width: 20px;
        height: 20px;
        border-radius: 50%;
        
        &:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }
      }
    }
  }
}
```

---

## 💾 LƯU VÀO DATABASE

### Frontend gửi (handleSubmit - line 130-137)

```javascript
// 3. Save subjects and experience info
if (formData.subjects.length > 0) {
  await updateTutorExpertise({
    subjects: formData.subjects.map((s) => ({
      ...s,
      price: parseInt(formData.sessionRate) || 0,
    })),
    experienceYears: parseInt(formData.experience) || 0,
    experiencePlaces: formData.university || null,
    sessionRate: parseInt(formData.sessionRate) || 0,
  });
  toast.success("✅ Đã lưu thông tin môn học và kinh nghiệm");
}
```

**Data gửi lên:**
```json
{
  "subjects": [
    { "name": "Toán", "price": 200000 },
    { "name": "Lý", "price": 200000 },
    { "name": "Tiếng Nhật", "price": 200000 },
    { "name": "Guitar", "price": 200000 }
  ],
  "experienceYears": 2,
  "experiencePlaces": "ĐH FPT",
  "sessionRate": 200000
}
```

### Backend nhận (tutor.js line 648-669)

```javascript
router.patch("/me/expertise", auth(), async (req, res) => {
  try {
    let { subjects, experienceYears, experiencePlaces } = req.body;
    if (!Array.isArray(subjects)) subjects = [];
    experienceYears = Number(experienceYears || 0);

    const profile = await TutorProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          subjects,
          experienceYears,
          experiencePlaces: experiencePlaces || null,
        },
      },
      { new: true, upsert: true }
    );
    res.json({ profile });
  } catch (e) {
    console.error("/tutors/me/expertise error:", e?.message);
    res.status(500).json({ message: "Failed to update expertise" });
  }
});
```

**Lưu vào:**
```javascript
TutorProfile {
  user: ObjectId,
  subjects: [
    { name: "Toán", price: 200000 },
    { name: "Lý", price: 200000 },
    { name: "Tiếng Nhật", price: 200000 },
    { name: "Guitar", price: 200000 }
  ],
  experienceYears: 2,
  experiencePlaces: "ĐH FPT"
}
```

---

## 🎨 GIAO DIỆN

### Desktop View

```
┌────────────────────────────────────────────────────┐
│  Môn dạy và học phí                                │
├────────────────────────────────────────────────────┤
│  ☐ Toán     ☑ Lý     ☑ Hóa                        │
│  ☐ Sinh     ☐ Văn    ☐ Anh                        │
│  ☐ Lịch sử  ☐ Địa lý ☐ Tin học                    │
├────────────────────────────────────────────────────┤
│  ➕ Môn học/Kỹ năng khác không có trong danh sách? │
│  ┌──────────────────────────────────┬───────────┐ │
│  │ Tiếng Nhật, Guitar, Vẽ...        │ ➕ Thêm  │ │
│  └──────────────────────────────────┴───────────┘ │
│  💡 Nhập tên môn học hoặc kỹ năng và nhấn "Thêm"  │
├────────────────────────────────────────────────────┤
│  📚 Các môn đã chọn (4):                           │
│  ┌──────┐ ┌──────┐ ┌────────────┐ ┌────────┐     │
│  │ Lý ✕ │ │ Hóa ✕│ │ Tiếng Nhật✕│ │ Guitar✕│     │
│  └──────┘ └──────┘ └────────────┘ └────────┘     │
└────────────────────────────────────────────────────┘
```

### Mobile View

```
┌──────────────────────────┐
│ Môn dạy và học phí       │
├──────────────────────────┤
│ ☑ Toán                   │
│ ☑ Lý                     │
│ ☐ Hóa                    │
│ ...                      │
├──────────────────────────┤
│ ➕ Môn khác?             │
│ ┌──────────────────────┐ │
│ │ Tiếng Nhật...        │ │
│ └──────────────────────┘ │
│      [➕ Thêm]           │
├──────────────────────────┤
│ 📚 Đã chọn (2):          │
│ [Toán ✕] [Lý ✕]         │
└──────────────────────────┘
```

---

## 🧪 TEST CASES

### Test 1: Thêm môn custom thành công

**Steps:**
1. Vào Step 3 "Kinh nghiệm giảng dạy"
2. Nhập "Tiếng Nhật" vào input
3. Click "➕ Thêm"

**Kết quả:**
- ✅ Toast: "✅ Đã thêm 'Tiếng Nhật'"
- ✅ Input cleared
- ✅ Tag "Tiếng Nhật" xuất hiện trong "Các môn đã chọn"

### Test 2: Thêm môn trùng

**Steps:**
1. Chọn checkbox "Toán"
2. Nhập "Toán" vào input
3. Click "➕ Thêm"

**Kết quả:**
- ⚠️ Toast: "⚠️ Môn học này đã có trong danh sách"
- ❌ Không thêm

### Test 3: Thêm môn rỗng

**Steps:**
1. Để input trống
2. Click "➕ Thêm"

**Kết quả:**
- ⚠️ Toast: "⚠️ Vui lòng nhập tên môn học hoặc kỹ năng"

### Test 4: Enter để thêm nhanh

**Steps:**
1. Nhập "Guitar"
2. Nhấn Enter

**Kết quả:**
- ✅ Thêm môn "Guitar"
- ✅ Input cleared

### Test 5: Xóa môn đã chọn

**Steps:**
1. Chọn "Toán" và "Lý"
2. Click nút ✕ trên tag "Toán"

**Kết quả:**
- ✅ Tag "Toán" biến mất
- ✅ Chỉ còn tag "Lý"

### Test 6: Submit và lưu vào DB

**Steps:**
1. Chọn: Toán, Lý, Tiếng Nhật, Guitar
2. Nhập experience: 2
3. Nhập sessionRate: 200000
4. Submit form

**Kết quả:**
- ✅ API call: `PATCH /api/tutors/me/expertise`
- ✅ Body:
  ```json
  {
    "subjects": [
      { "name": "Toán", "price": 200000 },
      { "name": "Lý", "price": 200000 },
      { "name": "Tiếng Nhật", "price": 200000 },
      { "name": "Guitar", "price": 200000 }
    ],
    "experienceYears": 2,
    "sessionRate": 200000
  }
  ```
- ✅ Lưu vào `TutorProfile.subjects` trong MongoDB

---

## ✅ XÁC NHẬN

### 1. Môn học hardcoded có lưu vào DB không?

**Có! ✅**

Khi checkbox "Toán" được chọn → Thêm `{ name: "Toán" }` vào `formData.subjects` → Submit → API `updateTutorExpertise` → Lưu vào `TutorProfile.subjects`

### 2. Môn học custom có lưu vào DB không?

**Có! ✅**

Khi nhập "Tiếng Nhật" và click "Thêm" → Thêm `{ name: "Tiếng Nhật" }` vào `formData.subjects` → Submit → API `updateTutorExpertise` → Lưu vào `TutorProfile.subjects`

### 3. Data format giống nhau không?

**Giống! ✅**

Cả hardcoded và custom đều có format:
```javascript
{ name: "Tên môn", price: sessionRate }
```

Backend không phân biệt môn nào hardcoded, môn nào custom.

---

## 📝 TÓM TẮT

| Feature | Status |
|---------|--------|
| Giữ list hardcoded (Toán, Lý, Hóa...) | ✅ |
| Thêm input "Môn khác" | ✅ |
| Button "➕ Thêm" | ✅ |
| Enter để thêm nhanh | ✅ |
| Validation (rỗng, trùng) | ✅ |
| Hiển thị môn đã chọn dạng tags | ✅ |
| Nút xóa từng môn | ✅ |
| Lưu vào DB qua API | ✅ |
| Toast notification | ✅ |
| Animation fadeIn | ✅ |
| Responsive design | ✅ |

---

**📅 Ngày hoàn thành:** 11/11/2025
**🎯 Status:** ✅ Hoàn thành - Sẵn sàng test
