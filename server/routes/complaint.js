const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  updateComplaint,
  deleteComplaint,
} = require('../controllers/complaintController');

// Public / user routes
router.post('/', createComplaint); // Can be called without auth from landing page
router.get('/my', authenticateToken, getUserComplaints);

// Admin routes
router.get('/all', authenticateToken, requireAdmin, getAllComplaints);
router.put('/:id', authenticateToken, requireAdmin, updateComplaint);
router.delete('/:id', authenticateToken, requireAdmin, deleteComplaint);

module.exports = router;
