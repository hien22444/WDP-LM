import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TutorService from "../../services/TutorService";
// Availability step removed
import "./OnboardingWizard.scss";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [idPreviews, setIdPreviews] = useState([]);
  const [idFrontPreview, setIdFrontPreview] = useState(null);
  const [idBackPreview, setIdBackPreview] = useState(null);
  const [degreePreviews, setDegreePreviews] = useState([]);
  const [uploadingIdDocs, setUploadingIdDocs] = useState(false);
  const [uploadingDegreeDocs, setUploadingDegreeDocs] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await TutorService.getMyTutorProfile();
        setProfile(p);
        setAvatarUrl(p?.avatarUrl || "");
        setAvatarPreview(p?.avatarUrl || "");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const saveBasic = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      avatarUrl: avatarUrl || undefined,
      gender: form.get("gender") || undefined,
      dateOfBirth: form.get("dateOfBirth") || undefined,
      city: form.get("city") || undefined,
      district: form.get("district") || undefined,
      bio: form.get("bio") || undefined,
    };
    try {
      const p = await TutorService.updateTutorBasic(payload);
      setProfile(p);
    } catch (err) {
      console.warn("updateTutorBasic failed, continue onboarding:", err?.response?.status);
      // Fallback: lưu tạm trên client để tiếp tục quy trình
      setProfile((prev) => ({ ...(prev || {}), ...payload }));
      toast.warn("Không lưu được lên máy chủ lúc này. Tiếp tục bước kế tiếp.");
    } finally {
      setLoading(false);
      next();
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    try {
      setAvatarUploading(true);
      // preview tạm thời trước khi upload
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);

      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";
      const accessToken = Cookies.get("accessToken");

      const formData = new FormData();
      formData.append("avatar", file);

      const resp = await axios.post(`${API_BASE_URL}/users/upload-avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      });

      if (resp.data?.imageUrl) {
        setAvatarUrl(resp.data.imageUrl);
        setAvatarPreview(resp.data.imageUrl);
        toast.success("Tải ảnh đại diện thành công!");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể tải ảnh, thử lại!");
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveExpertise = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const subjects = (form.get("subjects") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
    const payload = {
      subjects,
      experienceYears: Number(form.get("experienceYears") || 0),
      experiencePlaces: form.get("experiencePlaces") || undefined,
    };
    const p = await TutorService.updateTutorExpertise(payload);
    setProfile(p);
    setLoading(false);
    next();
  };

  // Preferences step removed

  // Availability step removed

  const submitProfile = async () => {
    setLoading(true);
    await TutorService.submitTutorProfile();
    setLoading(false);
    navigate("/dashboard");
  };

  if (loading && !profile) return <div style={{ padding: 24 }}>Đang tải...</div>;

  return (
    <div className="onboarding-wizard">
      <div className="wizard-header" aria-live="polite">
        <h1>Đăng ký trở thành gia sư</h1>
        <div className="progress-bar" aria-label={`Tiến độ: bước ${step} trên 4`}>
          <div
            className="progress-fill"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
        <div className="step-indicator" role="tablist" aria-label="Các bước đăng ký">
          {[1, 2, 3, 4].map((stepNum) => (
            <div
              key={stepNum}
              className={`step ${
                stepNum < step
                  ? "completed"
                  : stepNum === step
                  ? "active"
                  : "pending"
              }`}
              role="tab"
              aria-selected={stepNum === step}
              aria-current={stepNum === step ? "step" : undefined}
              tabIndex={stepNum <= step ? 0 : -1}
              aria-disabled={stepNum > step}
              onClick={() => {
                if (stepNum <= step) setStep(stepNum);
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && stepNum <= step) {
                  e.preventDefault();
                  setStep(stepNum);
                }
              }}
            >
              {stepNum}
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className="wizard-content">
        {step === 1 && (
          <div className="step-content" aria-labelledby="step1-title">
            <h2 id="step1-title">Thông tin cơ bản</h2>
            <p>
              Hãy cung cấp thông tin cá nhân cơ bản để học viên có thể hiểu rõ hơn về bạn.
            </p>

            <form onSubmit={saveBasic}>
              <div className="form-group">
                <label htmlFor="avatarFile">Ảnh đại diện</label>
                <input id="avatarFile" type="file" accept="image/*" onChange={handleAvatarUpload} />
              </div>
              {avatarPreview && (
                <div className="form-group" aria-live="polite">
                  <img src={avatarPreview} alt="Xem trước ảnh đại diện" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid #e9ecef" }} />
                  {avatarUploading && <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>Đang tải ảnh...</div>}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="gender">Giới tính</label>
                <select id="gender" name="gender" defaultValue={profile?.gender || ""}>
                  <option value="">--</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Ngày sinh</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  name="dateOfBirth"
                  defaultValue={
                    profile?.dateOfBirth
                      ? profile.dateOfBirth.substring(0, 10)
                      : ""
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">Thành phố</label>
                <input id="city" name="city" defaultValue={profile?.city || ""} />
              </div>

              <div className="form-group">
                <label htmlFor="district">Quận/Huyện</label>
                <input id="district" name="district" defaultValue={profile?.district || ""} />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Mô tả ngắn về bản thân</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  defaultValue={profile?.bio || ""}
                  placeholder="Giới thiệu về bản thân, sở thích, phong cách giảng dạy..."
                />
              </div>

              <div className="wizard-actions">
                <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Lưu & tiếp tục
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="step-content" aria-labelledby="step2-title">
            <h2 id="step2-title">Chuyên môn giảng dạy</h2>
            <p>Thêm các môn/khóa có thể dạy và kinh nghiệm của bạn.</p>
            <form onSubmit={saveExpertise}>
              <div className="form-group">
                <label htmlFor="subjects">Môn/khóa có thể dạy (ngăn cách bởi dấu phẩy)</label>
                <input
                  id="subjects"
                  name="subjects"
                  placeholder="Toán cấp 2, Python, IELTS Speaking"
                  defaultValue={(profile?.subjects || []).map((s) => s.name).join(", ")}
                />
              </div>

              <div className="form-group">
                <label htmlFor="experienceYears">Kinh nghiệm (năm)</label>
                <input
                  id="experienceYears"
                  type="number"
                  name="experienceYears"
                  min={0}
                  defaultValue={profile?.experienceYears || 0}
                  inputMode="numeric"
                />
              </div>

              <div className="form-group">
                <label htmlFor="experiencePlaces">Nơi từng dạy</label>
                <input id="experiencePlaces" name="experiencePlaces" defaultValue={profile?.experiencePlaces || ""} />
              </div>

              <div className="wizard-actions">
                <button type="button" className="btn-secondary" onClick={back}>Quay lại</button>
                <button type="submit" className="btn-primary">Lưu & tiếp tục</button>
              </div>
            </form>
          </div>
        )}
        
        {step === 3 && (
          <div className="step-content" aria-labelledby="step5-title">
            <h2 id="step5-title">Tài liệu xác minh</h2>
            <p>Tải ảnh CMND/CCCD/Hộ chiếu và bằng cấp/chứng chỉ. Hỗ trợ JPG/PNG/WebP (PDF cho bằng cấp).</p>

            <div className="file-upload">
              <div className="upload-group">
                <label className="upload-label" htmlFor="idFront">Giấy tờ tùy thân - Mặt trước</label>
                <input id="idFront" type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  setUploadingIdDocs(true);
                  setIdFrontPreview(URL.createObjectURL(file));
                  try {
                    await TutorService.uploadIdDocuments([file]);
                    toast.success("Đã tải mặt trước");
                  } catch (err) {
                    toast.error(err?.response?.data?.message || "Không thể tải mặt trước, thử lại!");
                  } finally {
                    setUploadingIdDocs(false);
                  }
                }} />

                <label className="upload-label" htmlFor="idBack" style={{ marginTop: 8 }}>Giấy tờ tùy thân - Mặt sau</label>
                <input id="idBack" type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  setUploadingIdDocs(true);
                  setIdBackPreview(URL.createObjectURL(file));
                  try {
                    await TutorService.uploadIdDocuments([file]);
                    toast.success("Đã tải mặt sau");
                  } catch (err) {
                    toast.error(err?.response?.data?.message || "Không thể tải mặt sau, thử lại!");
                  } finally {
                    setUploadingIdDocs(false);
                  }
                }} />

                {(idFrontPreview || idBackPreview) && (
                  <div className="upload-grid">
                    {idFrontPreview && (
                      <div className="preview-item" title="Mặt trước">
                        <img src={idFrontPreview} alt="Mặt trước" />
                        <button type="button" className="remove" onClick={() => setIdFrontPreview(null)}>×</button>
                      </div>
                    )}
                    {idBackPreview && (
                      <div className="preview-item" title="Mặt sau">
                        <img src={idBackPreview} alt="Mặt sau" />
                        <button type="button" className="remove" onClick={() => setIdBackPreview(null)}>×</button>
                      </div>
                    )}
                  </div>
                )}
                {uploadingIdDocs && <div className="uploading-hint">Đang tải lên...</div>}
              </div>

              <div className="upload-group">
                <label className="upload-label" htmlFor="degreeDocs">Bằng cấp/Chứng chỉ</label>
                <input id="degreeDocs" type="file" multiple accept="image/*,application/pdf" onChange={async (e) => {
                  if (!e.target.files?.length) return;
                  setUploadingDegreeDocs(true);
                  const previews = Array.from(e.target.files).map(f => ({ name: f.name, url: f.type === 'application/pdf' ? null : URL.createObjectURL(f) }));
                  setDegreePreviews(prev => [...prev, ...previews]);
                  try {
                    await TutorService.uploadDegreeDocuments(e.target.files);
                    toast.success("Tải bằng cấp/chứng chỉ thành công");
                  } catch (err) {
                    toast.error(err?.response?.data?.message || "Không thể tải bằng cấp, thử lại!");
                  } finally {
                    setUploadingDegreeDocs(false);
                  }
                }} />

                {degreePreviews.length > 0 && (
                  <div className="upload-grid">
                    {degreePreviews.map((p, idx) => (
                      <div className="preview-item" key={idx} title={p.name}>
                        {p.url ? (
                          <img src={p.url} alt={p.name} />
                        ) : (
                          <div className="pdf-chip">PDF</div>
                        )}
                        <button type="button" className="remove" onClick={() => setDegreePreviews(prev => prev.filter((_, i) => i !== idx))}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                {uploadingDegreeDocs && <div className="uploading-hint">Đang tải lên...</div>}
              </div>
            </div>
            <div className="wizard-actions">
              <button className="btn-secondary" onClick={back}>Quay lại</button>
              <button className="btn-primary" onClick={next}>Tiếp tục</button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="step-content" aria-labelledby="step6-title">
            <h2 id="step6-title">Xem lại & gửi duyệt</h2>
            <p>
              Xem lại và gửi hồ sơ để Admin duyệt. Bạn có thể tải tài liệu ở
              phần hồ sơ sau.
            </p>
            <div className="wizard-actions">
              <button className="btn-secondary" onClick={back}>Quay lại</button>
              <button className="btn-success" onClick={submitProfile}>Gửi duyệt</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;

