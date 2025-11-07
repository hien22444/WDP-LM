import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { searchTutors } from "../../services/BookingService";
import "./SearchTutors.scss";

const SearchTutors = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedMode, setSelectedMode] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const navigate = useNavigate();

  // No mock data needed

  const subjects = [
    "Toán học",
    "Vật lý",
    "Hóa học",
    "Sinh học",
    "Tiếng Anh",
    "Văn học",
    "Lịch sử",
    "Địa lý",
    "Tin học",
    "Tiếng Nhật",
  ];

  const locations = [
    "Hà Nội",
    "TP.HCM",
    "Đà Nẵng",
    "Hải Phòng",
    "Cần Thơ",
    "Khác",
  ];

  const teachModes = [
    { value: "online", label: "Trực tuyến" },
    { value: "offline", label: "Trực tiếp" },
  ];

  useEffect(() => {
    // Load once on mount; subsequent loads via the Search button
    loadTutors();
  }, []);

  const loadTutors = async () => {
    try {
      setLoading(true);

      // Chỉ thêm các tham số khi có giá trị
      const searchParams = {
        page,
        limit,
        status: "approved",
        verified: true,
      };

      // Thêm các điều kiện tìm kiếm khi có giá trị
      if (searchTerm?.trim()) {
        searchParams.search = searchTerm.trim();
      }

      if (selectedSubject) {
        searchParams.subject = selectedSubject;
      }

      if (selectedLocation) {
        searchParams.location = selectedLocation;
      }

      if (selectedMode) {
        searchParams.mode = selectedMode;
      }

      if (priceRange.min) {
        searchParams.minPrice = Number(priceRange.min);
      }

      if (priceRange.max) {
        searchParams.maxPrice = Number(priceRange.max);
      }

      if (sortBy) {
        searchParams.sortBy = sortBy;
      }

      console.log("🔍 Searching with params:", searchParams);

      const response = await searchTutors(searchParams);
      const rows = response?.tutors || response?.items || [];
      const pg = response?.pagination;
      if (pg) {
        setTotalPages(pg.total || 1);
        setTotalCount(pg.count || rows.length);
      } else if (
        typeof response?.total === "number" &&
        typeof response?.page === "number"
      ) {
        // support older shape { items, total, page, pageSize }
        setTotalCount(response.total);
        setTotalPages(
          Math.max(1, Math.ceil(response.total / (response.pageSize || limit)))
        );
      }

      // Lọc kết quả dựa trên các tiêu chí tìm kiếm
      let filteredResults = rows.filter(
        (t) =>
          (t.verified === true || t.status === "approved") &&
          !t.pending &&
          !t.rejected
      );

      // Lọc theo tên và môn học
      if (searchTerm?.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        filteredResults = filteredResults.filter((t) => {
          const name = (
            t.name ||
            t.user?.fullName ||
            t.user?.full_name ||
            ""
          ).toLowerCase();
          const subjects = (t.subjects || []).map((s) =>
            typeof s === "string"
              ? s.toLowerCase()
              : (s.name || s.subject || "").toLowerCase()
          );

          const nameMatch = name.includes(searchLower);
          const subjectMatch = subjects.some((s) => s.includes(searchLower));

          return nameMatch || subjectMatch;
        });
      }

      // Lọc theo môn học đã chọn
      if (selectedSubject) {
        filteredResults = filteredResults.filter((t) => {
          const tutorSubjects = t.subjects || [];
          return tutorSubjects.some(
            (s) =>
              (typeof s === "string"
                ? s
                : s.name || s.subject || ""
              ).toLowerCase() === selectedSubject.toLowerCase()
          );
        });
      }

      // Lọc theo địa điểm
      if (selectedLocation) {
        filteredResults = filteredResults.filter((t) => {
          const tutorLocation = (t.location || t.city || "").toLowerCase();
          return tutorLocation === selectedLocation.toLowerCase();
        });
      }

      // Lọc theo hình thức dạy
      if (selectedMode) {
        filteredResults = filteredResults.filter((t) => {
          const teachModes = t.teachModes || [];
          const teachingMode = t.teachingOptions?.mode;
          return (
            teachModes.includes(selectedMode) || teachingMode === selectedMode
          );
        });
      }

      // Lọc theo khoảng giá
      if (priceRange.min || priceRange.max) {
        filteredResults = filteredResults.filter((t) => {
          const price = t.price || t.sessionRate || 0;
          const minOk = !priceRange.min || price >= Number(priceRange.min);
          const maxOk = !priceRange.max || price <= Number(priceRange.max);
          return minOk && maxOk;
        });
      }

      const normalized = filteredResults.map((t) => ({
        id: t.id || t._id,
        name: t.name || t.user?.fullName || t.user?.full_name || "Gia sư",
        avatar:
          t.avatarUrl ||
          t.avatar ||
          t.user?.image ||
          t.user?.avatar ||
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        subjects: Array.isArray(t.subjects)
          ? t.subjects
              .map((s) =>
                typeof s === "string" ? s : s.name || s.subject || ""
              )
              .filter(Boolean)
          : [],
        location: t.location || t.city || "Chưa cập nhật",
        rating: t.rating || 0,
        reviewCount: t.reviewCount || 0,
        experience: t.experience || `${t.experienceYears || 0} năm`,
        price: t.price || t.sessionRate || 0,
        teachModes:
          t.teachModes ||
          (t.teachingOptions?.mode ? [t.teachingOptions.mode] : []),
        bio: t.bio || "Chưa có giới thiệu",
        verified: true,
      }));

      setTutors(normalized);
      setTotalCount(normalized.length); // Cập nhật lại số lượng kết quả thực tế
    } catch (error) {
      console.error("Error loading tutors:", error);
      setTutors([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadTutors();
  };

  const handleTutorClick = (tutorId) => {
    navigate(`/tutor/${tutorId}`);
  };

  // Additional client-side filtering for verified tutors
  const filteredTutors = tutors.filter((tutor) => tutor.verified);

  return (
    <div className="search-tutors">
      <div className="search-tutors-header">
        <div className="container">
          <h1>Tìm gia sư phù hợp</h1>
          <p>Kết nối với hàng nghìn gia sư chất lượng cao</p>
        </div>
      </div>

      <div className="container search-tutors-content">
        <div className="search-tutors-sidebar">
          <div className="search-filters">
            <h3>Bộ lọc</h3>

            <div className="filter-group">
              <label>Tìm kiếm</label>
              <input
                type="text"
                placeholder="Tên gia sư, môn học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <label>Môn học</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả môn học</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Địa điểm</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả địa điểm</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Hình thức dạy</label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả hình thức</option>
                {teachModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Giá (VNĐ/buổi)</label>
              <div className="price-range">
                <input
                  type="number"
                  placeholder="Từ"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, min: e.target.value })
                  }
                  className="price-input"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Đến"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: e.target.value })
                  }
                  className="price-input"
                />
              </div>
            </div>

            <button onClick={handleSearch} className="search-btn">
              Tìm kiếm
            </button>
          </div>
        </div>

        <div className="search-tutors-main">
          <div className="search-results-header">
            <div className="results-count">
              Tìm thấy {filteredTutors.length} gia sư đã xác minh
            </div>
            <div className="sort-options">
              <label>Sắp xếp theo:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="rating">Đánh giá cao</option>
                <option value="price-low">Giá thấp đến cao</option>
                <option value="price-high">Giá cao đến thấp</option>
                <option value="experience">Kinh nghiệm</option>
              </select>
            </div>
          </div>

          <div className="tutors-grid">
            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : filteredTutors.length > 0 ? (
              filteredTutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className="tutor-card"
                  onClick={() => handleTutorClick(tutor.id)}
                >
                  <div className="tutor-avatar">
                    <img src={tutor.avatar} alt={tutor.name} />
                    {tutor.verified && (
                      <div className="verified-badge">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    )}
                    {!tutor.verified && (
                      <div
                        className="verified-badge"
                        style={{ background: "#F59E0B" }}
                        title="Hồ sơ chưa duyệt"
                      >
                        <i className="fas fa-hourglass-half"></i>
                      </div>
                    )}
                  </div>

                  <div className="tutor-info">
                    <h3 className="tutor-name">{tutor.name}</h3>
                    <div className="tutor-rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`fas fa-star ${
                              i < Math.floor(tutor.rating) ? "filled" : ""
                            }`}
                          />
                        ))}
                      </div>
                      <span className="rating-text">
                        {tutor.rating} ({tutor.reviewCount} đánh giá)
                      </span>
                    </div>

                    <div className="tutor-subjects">
                      {tutor.subjects.map((subject) => (
                        <span key={subject} className="subject-tag">
                          {subject}
                        </span>
                      ))}
                    </div>

                    <div className="tutor-details">
                      <div className="detail-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{tutor.location}</span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-clock"></i>
                        <span>{tutor.experience} kinh nghiệm</span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-video"></i>
                        <span>
                          {tutor.teachModes.includes("online") && "Trực tuyến"}
                          {tutor.teachModes.includes("online") &&
                            tutor.teachModes.includes("offline") &&
                            ", "}
                          {tutor.teachModes.includes("offline") && "Trực tiếp"}
                        </span>
                      </div>
                    </div>

                    <div className="tutor-price">
                      <span className="price-label">Từ</span>
                      <span className="price-value">
                        {tutor.price.toLocaleString()}đ
                      </span>
                      <span className="price-unit">/buổi</span>
                    </div>

                    <p className="tutor-bio">{tutor.bio}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <i className="fas fa-search"></i>
                <h3>Không tìm thấy gia sư nào</h3>
                <p>Thử thay đổi bộ lọc để tìm kiếm tốt hơn</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <div style={{ color: "#666" }}>Tổng: {totalCount}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  setTimeout(loadTutors, 0);
                }}
                className="search-btn"
                style={{ padding: "8px 12px" }}
              >
                Trang trước
              </button>
              <span style={{ color: "#666" }}>
                {page}/{totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  setTimeout(loadTutors, 0);
                }}
                className="search-btn"
                style={{ padding: "8px 12px" }}
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchTutors;
