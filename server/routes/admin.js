const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getDashboardStats,
  getAllUsers,
  unlockUser,
  getAuditLogs,
  createUpdate,
  getUpdates,
  getNotifications,
  markNotificationRead,
  getAdvancedAnalytics,
  getAdminProfile,
  updateAdminProfile,
  updateUser
} = require('../controllers/adminController');

// Admin routes
router.get('/dashboard', authenticateToken, requireAdmin, getDashboardStats);
router.get('/analytics/advanced', authenticateToken, requireAdmin, getAdvancedAnalytics);
router.get('/users', authenticateToken, requireAdmin, getAllUsers);
router.put('/users/:id/unlock', authenticateToken, requireAdmin, unlockUser);
router.put('/users/:id', authenticateToken, requireAdmin, updateUser);
router.get('/audit-logs', authenticateToken, requireAdmin, getAuditLogs);

// Government updates (public read, admin write)
router.get('/updates', getUpdates);
router.post('/updates', authenticateToken, requireAdmin, createUpdate);

// Notifications (user)
router.get('/notifications', authenticateToken, getNotifications);
router.put('/notifications/:id/read', authenticateToken, markNotificationRead);

// Admin Profile
router.get('/profile', authenticateToken, requireAdmin, getAdminProfile);
router.put('/profile', authenticateToken, requireAdmin, updateAdminProfile);

module.exports = router;
