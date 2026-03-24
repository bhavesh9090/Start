const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const monthlyTaxController = require('../controllers/monthlyTaxController');

// User routes
router.get('/', authenticateToken, monthlyTaxController.getPayments);
router.post('/order', authenticateToken, monthlyTaxController.createOrder);
router.post('/verify', authenticateToken, monthlyTaxController.verifyPayment);
router.get('/receipt/:id', authenticateToken, monthlyTaxController.downloadReceipt);
router.delete('/:id', authenticateToken, monthlyTaxController.deletePayment);

// Admin routes
router.get('/all', authenticateToken, monthlyTaxController.getAllPayments);

module.exports = router;
