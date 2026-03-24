// OTP utility (mock implementation — replace with real SMS provider)
const otpStore = new Map(); // In production, use Redis

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (mobile, otp) => {
  // Mock: Log to console. Replace with Twilio/MSG91 in production
  console.log(`📱 OTP for ${mobile}: ${otp}`);
  otpStore.set(mobile, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
  return true;
};

const verifyOTP = (mobile, otp) => {
  const stored = otpStore.get(mobile);
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(mobile);
    return false;
  }
  if (stored.otp !== otp) return false;
  otpStore.delete(mobile);
  return true;
};

module.exports = { generateOTP, sendOTP, verifyOTP };
