const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  createNotice,
  getUserNotices,
  getAllNotices,
  deleteNotice,
} = require('../controllers/noticeController');

// User routes
router.get('/', authenticateToken, getUserNotices);

// Admin routes
router.get('/all', authenticateToken, requireAdmin, getAllNotices);
router.post('/', authenticateToken, requireAdmin, createNotice);
router.delete('/:id', authenticateToken, deleteNotice);


module.exports = router;
