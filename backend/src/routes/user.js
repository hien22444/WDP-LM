const router = require("express").Router();
const auth = require("../middlewares/auth");
const { requireRole } = require("../middlewares/auth");
const User = require("../models/User");

// GET current user
router.get("/me", auth(), async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) return res.status(404).json({ message: "User not found" });
		res.json({ user: { account: { email: user.email, role: user.role, status: user.status, status_flag: user.status_flag }, profile: { full_name: user.full_name } } });
	} catch (err) {
		res.status(500).json({ message: "Failed to fetch user" });
	}
});

// PATCH update profile (limited fields)
router.patch("/me", auth(), async (req, res) => {
	try {
		const { full_name, city, gender } = req.body;
		const user = await User.findByIdAndUpdate(
			req.user.id,
			{ $set: { ...(full_name && { full_name }), ...(city && { city }), ...(gender && { gender }) } },
			{ new: true }
		);
		res.json({ user: { account: { email: user.email, role: user.role, status: user.status }, profile: { full_name: user.full_name, city: user.city, gender: user.gender } } });
	} catch (err) {
		res.status(500).json({ message: "Failed to update profile" });
	}
});

// Admin: list users
router.get("/", auth(), requireRole("admin"), async (req, res) => {
  const { page = 1, limit = 20, q = "" } = req.query;
  const filter = q
    ? { $or: [ { email: new RegExp(q, "i") }, { full_name: new RegExp(q, "i") } ] }
    : {};
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    User.find(filter).select("full_name email role status status_flag is_banned created_at").skip(skip).limit(Number(limit)).sort({ created_at: -1 }),
    User.countDocuments(filter),
  ]);
  res.json({ items, total, page: Number(page), limit: Number(limit) });
});

// Admin: block user (send email first, then block)
router.post("/:id/block", auth(), requireRole("admin"), async (req, res) => {
  const { reason } = req.body || {};
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: "Block reason is required" });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  // Do not allow blocking admin accounts
  if (user.role === 'admin') {
    return res.status(403).json({ message: "Cannot block admin user" });
  }
  // Send email using the same helper as registration
  try {
    const { sendMailHelper } = require("../controllers/authController");
    const subject = "[LearnMate] Tài khoản của bạn đã bị khóa";
    const html = `
      <div style=\"background:#f8fafc;padding:32px 0;font-family:Segoe UI,Arial,sans-serif;\">
        <div style=\"max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,0.08);overflow:hidden;\">
          <div style=\"padding:20px 24px;border-bottom:1px solid #e2e8f0;\">
            <h2 style=\"margin:0;color:#0f172a\">LearnMate</h2>
          </div>
          <div style=\"padding:24px;\">
            <p style=\"margin:0 0 12px 0;color:#0f172a;\">Xin chào <b>${user.full_name || user.email}</b>,</p>
            <p style=\"margin:0 0 16px 0;color:#334155\">Tài khoản của bạn đã được <b>tạm khóa</b> bởi quản trị viên.</p>
            <p style=\"margin:0 0 8px 0;color:#0f172a;font-weight:600\">Lý do:</p>
            <blockquote style=\"margin:0 0 16px 0;padding:12px 14px;background:#f1f5f9;border-left:3px solid #3b82f6;border-radius:6px;color:#0f172a;\">${reason.replace(/</g,'&lt;')}</blockquote>
            <p style=\"margin:0;color:#475569\">Nếu bạn cho rằng đây là nhầm lẫn, vui lòng phản hồi email này để được hỗ trợ.</p>
          </div>
          <div style=\"padding:16px 24px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;\">
            © ${new Date().getFullYear()} LearnMate. All rights reserved.
          </div>
        </div>
      </div>`;
    const mailRes = await sendMailHelper({ to: user.email, subject, html });
    if (!mailRes || mailRes.ok === false) {
      return res.status(500).json({ message: "Failed to send notification email before blocking", detail: mailRes?.error || 'sendMail failed' });
    }
  } catch (e) {
    return res.status(500).json({ message: "Failed to send notification email before blocking", detail: e?.message });
  }
  // Only after email is successfully sent, apply block
  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { status_flag: 0, status: "blocked" },
    { new: true }
  );
  res.json({ user: updated });
});

// Admin: unblock user
router.post("/:id/unblock", auth(), requireRole("admin"), async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status_flag: 1, status: "active" },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

// Admin: ban user permanently
router.post("/:id/ban", auth(), requireRole("admin"), async (req, res) => {
  const { reason } = req.body || {};
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: "Ban reason is required" });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role === 'admin') {
    return res.status(403).json({ message: "Cannot ban admin user" });
  }

  try {
    const { sendMailHelper } = require("../controllers/authController");
    const subject = "[LearnMate] Tài khoản của bạn đã bị cấm vĩnh viễn";
    const html = `
      <div style="background:#f8fafc;padding:32px 0;font-family:Segoe UI,Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,0.08);overflow:hidden;">
          <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
            <h2 style="margin:0;color:#0f172a">LearnMate</h2>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px 0;color:#0f172a;">Xin chào <b>${user.full_name || user.email}</b>,</p>
            <p style="margin:0 0 16px 0;color:#334155">Tài khoản của bạn đã được <b>cấm vĩnh viễn</b> bởi quản trị viên.</p>
            <p style="margin:0 0 8px 0;color:#0f172a;font-weight:600">Lý do:</p>
            <blockquote style="margin:0 0 16px 0;padding:12px 14px;background:#fef2f2;border-left:3px solid #ef4444;border-radius:6px;color:#0f172a;">${reason.replace(/</g,'&lt;')}</blockquote>
            <p style="margin:0;color:#475569">Tài khoản này sẽ không thể được khôi phục. Nếu bạn cho rằng đây là nhầm lẫn, vui lòng phản hồi email này để được hỗ trợ.</p>
          </div>
          <div style="padding:16px 24px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">
            © ${new Date().getFullYear()} LearnMate. All rights reserved.
          </div>
        </div>
      </div>`;
    const mailRes = await sendMailHelper({ to: user.email, subject, html });
    if (!mailRes || mailRes.ok === false) {
      return res.status(500).json({ message: "Failed to send notification email before banning", detail: mailRes?.error || 'sendMail failed' });
    }
  } catch (e) {
    return res.status(500).json({ message: "Failed to send notification email before banning", detail: e?.message });
  }
  // Only after email is successfully sent, apply ban
  const updated = await User.findByIdAndUpdate(req.params.id, { is_banned: true, status: "blocked", status_flag: 0 }, { new: true });
  res.json({ user: updated });
});

module.exports = router;
