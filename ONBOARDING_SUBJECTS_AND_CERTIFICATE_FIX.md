# 📚 HỆ THỐNG MÔN HỌC TRONG ONBOARDING

> Ngày tạo: 11/11/2025
> File: `frontend/src/pages/Tutor/OnboardingWizard.js`

---

## ❓ CÂU HỎI: "Môn học ở đâu ra?"

### 🎯 Trả lời:

Danh sách môn học **ĐƯỢC HARDCODED** trong file `OnboardingWizard.js` tại **line 484-492**:

```javascript
{[
  "Toán",
  "Lý",
  "Hóa",
  "Sinh",
  "Văn",
  "Anh",
  "Lịch sử",
  "Địa lý",
  "Tin học",
].map((subject) => (
  <div key={subject} className="subject-item">
    // ... render checkbox
  </div>
))}
```

### ⚠️ VẤN ĐỀ:

1. **Không linh hoạt** - Muốn thêm môn phải sửa code
2. **Không lấy từ database** - Nếu có thêm môn mới phải deploy lại
3. **Hardcoded** - Không có API quản lý môn học

---

## 🛠️ CÁCH SỬA (2 PHƯƠNG ÁN)

### Phương án 1: Giữ nguyên hardcoded (Đơn giản - Khuyến nghị)

**Ưu điểm:**
- Đơn giản, không cần backend
- Tốc độ nhanh (không cần API call)
- Danh sách môn học ít thay đổi

**Nhược điểm:**
- Muốn thêm môn phải sửa code

**Khi nào dùng:**
- Danh sách môn học cố định (như hệ thống THPT hiện tại)
- Không cần quản lý môn học động

---

### Phương án 2: Lưu môn học vào Database (Linh hoạt)

#### Bước 1: Tạo Model `Subject`

**File:** `backend/src/models/Subject.js`

```javascript
const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      enum: ["khtn", "khxh", "ngonngu", "kythuat", "khac"],
      default: "khac",
    },
    icon: {
      type: String,
      default: "📚",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", SubjectSchema);
```

#### Bước 2: Tạo API

**File:** `backend/src/routes/subject.js`

```javascript
const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");

// GET /api/subjects - Lấy danh sách môn học active
router.get("/", async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 });
    
    res.json({
      success: true,
      subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách môn học",
    });
  }
});

module.exports = router;
```

#### Bước 3: Seed data

**File:** `backend/scripts/seedSubjects.js`

```javascript
const mongoose = require("mongoose");
require("dotenv").config();
const Subject = require("../src/models/Subject");

const subjects = [
  { name: "Toán", category: "khtn", icon: "🔢", displayOrder: 1 },
  { name: "Lý", category: "khtn", icon: "⚛️", displayOrder: 2 },
  { name: "Hóa", category: "khtn", icon: "🧪", displayOrder: 3 },
  { name: "Sinh", category: "khtn", icon: "🧬", displayOrder: 4 },
  { name: "Văn", category: "khxh", icon: "📖", displayOrder: 5 },
  { name: "Anh", category: "ngonngu", icon: "🇬🇧", displayOrder: 6 },
  { name: "Lịch sử", category: "khxh", icon: "📜", displayOrder: 7 },
  { name: "Địa lý", category: "khxh", icon: "🌍", displayOrder: 8 },
  { name: "Tin học", category: "kythuat", icon: "💻", displayOrder: 9 },
];

async function seedSubjects() {
  try {
    await mongoose.connect(process.env.URI_DB);
    console.log("✅ Connected to MongoDB");

    // Xóa dữ liệu cũ
    await Subject.deleteMany({});
    console.log("🗑️ Deleted old subjects");

    // Thêm môn học mới
    await Subject.insertMany(subjects);
    console.log(`✅ Inserted ${subjects.length} subjects`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedSubjects();
```

#### Bước 4: Update Frontend

**File:** `frontend/src/pages/Tutor/OnboardingWizard.js`

```javascript
import { useState, useEffect } from "react";

const OnboardingWizard = () => {
  const [subjects, setSubjects] = useState([]); // Thay vì hardcoded

  // Fetch subjects từ API
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch("/api/subjects");
        const data = await response.json();
        if (data.success) {
          setSubjects(data.subjects);
        }
      } catch (error) {
        console.error("Lỗi khi lấy môn học:", error);
        // Fallback về hardcoded nếu API lỗi
        setSubjects([
          { name: "Toán", icon: "🔢" },
          { name: "Lý", icon: "⚛️" },
          // ...
        ]);
      }
    };

    fetchSubjects();
  }, []);

  // Render
  return (
    <div className="subjects-list">
      {subjects.map((subject) => (
        <div key={subject._id || subject.name} className="subject-item">
          <label className="checkbox-item">
            <span className="subject-icon">{subject.icon}</span>
            <input
              type="checkbox"
              checked={formData.subjects.some(
                (s) => s.name === subject.name
              )}
              onChange={(e) => {
                // ... logic
              }}
            />
            {subject.name}
          </label>
        </div>
      ))}
    </div>
  );
};
```

---

## ✅ ĐÃ SỬA: VẤN ĐỀ CHỨNG CHỈ KHÔNG HIỂN THỊ

### Vấn đề:

**Trước đây (line 676-690):**
```javascript
<div className="form-group">
  <label>Tài liệu chứng chỉ</label>
  <div className="file-upload-area">
    <input
      type="file"
      accept="image/*,.pdf"
      onChange={(e) =>
        handleFileChange("certificateDocument", e.target.files[0])
      }
    />
    <div className="upload-placeholder">
      <div className="upload-icon">🏆</div>
      <p>Kéo thả tài liệu vào đây hoặc nhấn để chọn</p>
    </div>
  </div>
  {/* ❌ THIẾU PREVIEW! */}
</div>
```

### Giải pháp:

**Đã thêm preview (FIXED):**
```javascript
<div className="form-group">
  <label>Tài liệu chứng chỉ</label>
  <div className="file-upload-area">
    <input
      type="file"
      accept="image/*,.pdf"
      onChange={(e) =>
        handleFileChange("certificateDocument", e.target.files[0])
      }
    />
    <div className="upload-placeholder">
      <div className="upload-icon">🏆</div>
      <p>Kéo thả tài liệu vào đây hoặc nhấn để chọn</p>
    </div>
  </div>
  
  {/* ✅ ĐÃ THÊM PREVIEW */}
  {formData.certificateDocument && (
    <div className="file-preview">
      {/* Nếu là ảnh → hiện ảnh */}
      {formData.certificateDocument.type.startsWith("image/") ? (
        <div className="preview-image">
          <img
            src={URL.createObjectURL(formData.certificateDocument)}
            alt="Chứng chỉ"
          />
        </div>
      ) : (
        /* Nếu là PDF → hiện icon PDF */
        <div className="preview-pdf">
          <div className="pdf-icon">📄</div>
          <p>File PDF đã chọn</p>
        </div>
      )}
      
      {/* Thông tin file */}
      <div className="file-info">
        <div className="file-name">
          {formData.certificateDocument.name}
        </div>
        <div className="file-size">
          {formatBytes(formData.certificateDocument.size)}
        </div>
        <button
          type="button"
          className="remove-btn"
          onClick={() => removeSelectedFile("certificateDocument")}
        >
          Xóa
        </button>
      </div>
    </div>
  )}
</div>
```

### Tính năng mới:

1. ✅ **Hiển thị ảnh** nếu upload file ảnh (jpg, png...)
2. ✅ **Hiển thị icon PDF** nếu upload file PDF
3. ✅ **Hiển thị tên file** và kích thước
4. ✅ **Nút xóa** để chọn lại file khác

---

## 🧪 TEST

### Test 1: Upload ảnh chứng chỉ

1. Vào Step 5: "Chứng chỉ & thành tích"
2. Click vào "Tài liệu chứng chỉ"
3. Chọn file ảnh (IELTS_certificate.jpg)
4. **Kết quả mong đợi:**
   ```
   ┌─────────────────────────────┐
   │  [Ảnh preview của IELTS]   │
   │                             │
   │  📄 IELTS_certificate.jpg   │
   │  💾 2.3 MB                  │
   │  [Xóa]                      │
   └─────────────────────────────┘
   ```

### Test 2: Upload PDF chứng chỉ

1. Chọn file PDF (certificate.pdf)
2. **Kết quả mong đợi:**
   ```
   ┌─────────────────────────────┐
   │         📄                  │
   │   File PDF đã chọn          │
   │                             │
   │  📄 certificate.pdf         │
   │  💾 1.5 MB                  │
   │  [Xóa]                      │
   └─────────────────────────────┘
   ```

### Test 3: Xóa file

1. Click nút "Xóa"
2. Preview biến mất
3. Có thể chọn file khác

---

## 📝 TÓM TẮT

### Vấn đề 1: Môn học hardcoded

**Hiện tại:** Danh sách 9 môn hardcoded trong code
**Giải pháp:**
- **Tạm thời:** Giữ nguyên (đơn giản, đủ dùng)
- **Tương lai:** Chuyển sang database (linh hoạt hơn)

### Vấn đề 2: Chứng chỉ không hiển thị ảnh

**Đã sửa:** ✅
- Thêm preview cho ảnh
- Thêm preview cho PDF
- Thêm nút xóa file
- Hiển thị tên file + kích thước

---

**📅 Ngày sửa:** 11/11/2025
**🔧 File đã sửa:** `frontend/src/pages/Tutor/OnboardingWizard.js`
**✅ Status:** Fixed certificate preview, Subject list documented
