const express = require('express');
const router = express.Router();
const { queryChatbot, getChatHistory, clearChatHistory } = require('../controllers/chatbotController');
const { authenticateToken } = require('../middleware/auth');

// Public route (optional: might want to check token if available)
router.post('/query', (req, res, next) => {
  // Optional Auth: If authorization header is present, authenticate it
  if (req.headers['authorization']) {
    return authenticateToken(req, res, next);
  }
  next();
}, queryChatbot);

// Protected routes
router.get('/history', authenticateToken, getChatHistory);
router.delete('/history', authenticateToken, clearChatHistory);

module.exports = router;
