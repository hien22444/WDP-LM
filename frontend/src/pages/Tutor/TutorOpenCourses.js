import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BackHomeButton from "../../components/Common/BackHomeButton";
import TutorHero from "../../components/Tutor/TutorHero";
import TutorFooter from "../../components/Tutor/TutorFooter";
import BookingService from "../../services/BookingService";

const TutorOpenCourses = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [params] = useSearchParams();
  const tutorId = params.get('tutorId') || undefined;
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError("");
      try {
        const data = await BookingService.listPublicTeachingSlots({ tutorId });
        setItems(data || []);
      } catch (e) {
        setError("Không tải được danh sách khóa học");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tutorId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = (items || []).filter(s => {
      if (mode && s.mode !== mode) return false;
      if (q && !(s.courseName || '').toLowerCase().includes(q)) return false;
      if (minPrice && (s.price || 0) < Number(minPrice)) return false;
      if (maxPrice && (s.price || 0) > Number(maxPrice)) return false;
      if (fromDate && new Date(s.start) < new Date(fromDate)) return false;
      if (toDate && new Date(s.start) > new Date(toDate)) return false;
      return true;
    });
    // Reset to first page if current page exceeds new total
    const totalPages = Math.max(1, Math.ceil(result.length / pageSize));
    if (page > totalPages) setPage(1);
    return result;
  }, [items, query, mode, minPrice, maxPrice, fromDate, toDate]);

  const paged = useMemo(() => {
    const startIdx = (page - 1) * pageSize;
    return filtered.slice(startIdx, startIdx + pageSize);
  }, [filtered, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered]);

  // Danh sách môn/khóa để gợi ý tìm kiếm
  const courseOptions = useMemo(() => {
    const set = new Set();
    (items || []).forEach(s => { if (s.courseName) set.add(s.courseName); });
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  }, [items]);

  return (
    <div className="container py-4">
      {/* Local styles for prettier cards */}
      <style>{`
        .course-card{transition:transform .2s ease, box-shadow .2s ease}
        .course-card:hover{transform:translateY(-2px); box-shadow:0 12px 30px rgba(2,8,23,.12)}
        .course-cover{height:96px; background-size:cover; background-position:center;}
        .tutor-avatar-xl{width:76px; height:76px; border-radius:50%; object-fit:cover; border:4px solid #fff; box-shadow:0 4px 16px rgba(2,8,23,.18)}
        .avatar-overlap{margin-top:-38px}
        @media(max-width:576px){.tutor-avatar-xl{width:64px;height:64px}.avatar-overlap{margin-top:-32px}}
      `}</style>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0 fw-bold">Tất cả khóa học mở</h2>
        <BackHomeButton />
      </div>
      <TutorHero />

      {/* Horizontal filters on top */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body">
          <h5 className="fw-bold mb-3">Bộ lọc</h5>
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4 col-xl-3">
              <label className="form-label small text-secondary">Tìm kiếm</label>
              <input className="form-control" list="course-options" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Tên khóa học..." />
              <datalist id="course-options">
                {courseOptions.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div className="col-6 col-md-2 col-xl-2">
              <label className="form-label small text-secondary">Hình thức</label>
              <select className="form-select" value={mode} onChange={(e)=>setMode(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="online">Trực tuyến</option>
                <option value="offline">Tại nhà</option>
              </select>
            </div>
            <div className="col-6 col-md-2 col-xl-2">
              <label className="form-label small text-secondary">Từ ngày</label>
              <input className="form-control" type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
            </div>
            <div className="col-6 col-md-2 col-xl-2">
              <label className="form-label small text-secondary">Đến ngày</label>
              <input className="form-control" type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
            </div>
            <div className="col-6 col-md-2 col-xl-1">
              <label className="form-label small text-secondary">Giá từ</label>
              <input className="form-control" type="number" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} placeholder="0" />
            </div>
            <div className="col-6 col-md-2 col-xl-1">
              <label className="form-label small text-secondary">Giá đến</label>
              <input className="form-control" type="number" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} placeholder="500000" />
            </div>
          </div>
        </div>
      </div>

      {/* Courses list below */}
      {loading && <div>Đang tải...</div>}
      {error && <div className="text-danger">{error}</div>}
      {!loading && !error && (
        <div className="row g-3">
          {paged.map(slot => (
            <div key={slot._id} className="col-12">
              <div className="card course-card border-0 shadow rounded-4 h-100 animate__animated animate__fadeInUp overflow-hidden">
                {/* Cover with gradient fallback */}
                <div
                  className="course-cover"
                  style={(() => {
                    const hasImage = Boolean(slot.image);
                    return hasImage
                      ? { backgroundImage: `url(${slot.image})` }
                      : { background: 'linear-gradient(90deg,#eef2ff,#e0f2fe)' };
                  })()}
                />
                <div className="card-body p-4">
                  {/* Tutor avatar + title row */}
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3 avatar-overlap">
                      {slot.tutorProfile?.user && (
                        <img
                          className="tutor-avatar-xl"
                          src={slot.tutorProfile.avatarUrl || slot.tutorProfile.user.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face'}
                          alt={slot.tutorProfile.user.full_name || 'Tutor'}
                        />
                      )}
                      <h4 className="card-title fw-bold mb-0">{slot.courseName}</h4>
                    </div>
                    <span className={`badge rounded-pill ${slot.mode === 'online' ? 'text-bg-info' : 'text-bg-warning'}`}>{slot.mode === 'online' ? 'Online' : 'Offline'}</span>
                  </div>

                  {slot.tutorProfile?.user && (
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div className="small text-uppercase text-muted">Giảng viên</div>
                      <Link to={`/tutor/${slot.tutorProfile._id}`} className="link-primary fw-semibold fs-6">
                        {slot.tutorProfile.user.full_name || 'Gia sư'}
                      </Link>
                    </div>
                  )}

                  <div className="d-flex flex-wrap gap-2 mb-2">
                    <span className="badge text-bg-light border">
                      <i className="fa-regular fa-calendar me-1"/> {new Date(slot.start).toLocaleDateString()}
                    </span>
                    <span className="badge text-bg-light border">
                      <i className="fa-regular fa-clock me-1"/> {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {slot.location && (
                      <span className="badge text-bg-light border">
                        <i className="fa-solid fa-location-dot me-1"/> {slot.location}
                      </span>
                    )}
                  </div>
                  {slot.notes && <p className="mb-2">{slot.notes}</p>}
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <div className="text-secondary small">Học phí</div>
                      <div className="fw-bold fs-5">{slot.price ? `${slot.price.toLocaleString()}đ` : 'Liên hệ'}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Link className="btn btn-outline-primary btn-lg" to={`/courses/${slot._id}`}>Chi tiết</Link>
                      <button className="btn btn-primary btn-lg" onClick={() => window.location.assign(`/tutor/${slot.tutorProfile?._id || ''}`)}>Đặt ngay</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Pagination */}
          <div className="col-12 mt-2">
            <nav className="d-flex justify-content-center" aria-label="Pagination">
              <ul className="pagination mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={()=>setPage(p=>Math.max(1,p-1))}>Trước</button>
                </li>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <li key={idx} className={`page-item ${page === idx+1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={()=>setPage(idx+1)}>{idx+1}</button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Sau</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      <TutorFooter />
    </div>
  );
};

export default TutorOpenCourses;


