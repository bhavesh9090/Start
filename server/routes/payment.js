const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  downloadReceipt,
  getAllPayments,
} = require('../controllers/paymentController');

// User routes
router.post('/create-order', authenticateToken, createOrder);
router.post('/verify', authenticateToken, verifyPayment);
router.get('/history', authenticateToken, getPaymentHistory);
router.get('/receipt/:id', authenticateToken, downloadReceipt);

// Admin routes
router.get('/all', authenticateToken, requireAdmin, getAllPayments);

module.exports = router;
