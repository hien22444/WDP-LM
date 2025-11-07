/**
 * In-memory cache for pending user registrations
 * Stores temporary user data before OTP verification
 * Auto-cleanup expired entries every 2 minutes
 */

const pendingRegistrations = new Map();

// Auto-cleanup expired entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of pendingRegistrations.entries()) {
    if (data.otp_expires < now) {
      pendingRegistrations.delete(email);
      console.log(`[PendingReg] Cleaned up expired registration for: ${email}`);
    }
  }
}, 120000); // 2 minutes

/**
 * Store pending registration data
 * @param {string} email 
 * @param {object} data - { full_name, password_hash, otp_code, otp_expires }
 */
const setPendingRegistration = (email, data) => {
  pendingRegistrations.set(email.toLowerCase(), {
    ...data,
    createdAt: Date.now(),
  });
  console.log(`[PendingReg] Stored registration for: ${email}`);
};

/**
 * Get pending registration data
 * @param {string} email 
 * @returns {object|null}
 */
const getPendingRegistration = (email) => {
  return pendingRegistrations.get(email.toLowerCase()) || null;
};

/**
 * Remove pending registration data
 * @param {string} email 
 */
const removePendingRegistration = (email) => {
  const deleted = pendingRegistrations.delete(email.toLowerCase());
  if (deleted) {
    console.log(`[PendingReg] Removed registration for: ${email}`);
  }
  return deleted;
};

/**
 * Check if email has pending registration
 * @param {string} email 
 * @returns {boolean}
 */
const hasPendingRegistration = (email) => {
  return pendingRegistrations.has(email.toLowerCase());
};

/**
 * Get count of pending registrations
 * @returns {number}
 */
const getPendingCount = () => {
  return pendingRegistrations.size;
};

module.exports = {
  setPendingRegistration,
  getPendingRegistration,
  removePendingRegistration,
  hasPendingRegistration,
  getPendingCount,
};
