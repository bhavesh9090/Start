const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
  registerUser,
  requestOTP,
  loginUser,
  loginAdmin,
  forgotPassword,
  getProfile,
  updateProfile,
  getDistricts,
} = require('../controllers/authController');

// Public routes
router.get('/districts', getDistricts);
router.post('/register', authLimiter, registerUser);
router.post('/send-otp', otpLimiter, requestOTP);
router.post('/login', authLimiter, loginUser);
router.post('/admin/login', authLimiter, loginAdmin);
router.post('/forgot-password', authLimiter, forgotPassword);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
