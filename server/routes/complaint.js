const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, optionalAuthenticateToken } = require('../middleware/auth');
const {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  updateComplaint,
  deleteComplaint,
} = require('../controllers/complaintController');

// Public / user routes
router.post('/', optionalAuthenticateToken, createComplaint); // Correctly handles both guest and user tickets
router.get('/my', authenticateToken, getUserComplaints);

// Admin routes
router.get('/all', authenticateToken, requireAdmin, getAllComplaints);
router.put('/:id', authenticateToken, requireAdmin, updateComplaint);
// Admin / User delete route (permission check inside controller)
router.delete('/:id', authenticateToken, deleteComplaint);

module.exports = router;
