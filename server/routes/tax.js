const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getUserTaxes,
  getTaxById,
  getAllTaxes,
  triggerTaxGeneration,
  getTaxAnalytics,
} = require('../controllers/taxController');

// User routes
router.get('/', authenticateToken, getUserTaxes);
router.get('/analytics', authenticateToken, requireAdmin, getTaxAnalytics);
router.get('/all', authenticateToken, requireAdmin, getAllTaxes);
router.get('/:id', authenticateToken, getTaxById);

// Admin routes
router.post('/generate', authenticateToken, requireAdmin, triggerTaxGeneration);

module.exports = router;
