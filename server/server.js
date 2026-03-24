const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { generalLimiter } = require('./middleware/rateLimiter');
const { startCronJobs } = require('./cron/taxCron');

// Route imports
const authRoutes = require('./routes/auth');
const taxRoutes = require('./routes/tax');
const paymentRoutes = require('./routes/payment');
const complaintRoutes = require('./routes/complaint');
const noticeRoutes = require('./routes/notice');
const adminRoutes = require('./routes/admin');
const monthlyTaxRoutes = require('./routes/monthlyTax');
const helpRoutes = require('./routes/help');
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();

// ==================== MIDDLEWARE ====================
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// ==================== ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/monthly-tax', monthlyTaxRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 E-TaxPay server running on port ${PORT}`);
  startCronJobs();
});

module.exports = app;
