const crypto = require('crypto');
const { supabase } = require('../config/supabase');
const razorpay = require('../config/razorpay');
const { generateReceipt } = require('../utils/receipt');
const { logAudit } = require('../utils/audit');
require('dotenv').config();

// ==================== CREATE ORDER ====================
const createOrder = async (req, res) => {
  try {
    const { tax_id } = req.body;
    const userId = req.user.id;

    // Get tax record
    const { data: tax, error: taxError } = await supabase
      .from('taxes')
      .select('*')
      .eq('id', tax_id)
      .eq('user_id', userId)
      .single();

    if (taxError || !tax) {
      return res.status(404).json({ error: 'Tax record not found' });
    }

    // Prevent duplicate payment
    if (tax.status === 'paid') {
      return res.status(400).json({ error: 'Tax already paid' });
    }

    // Prevent future tax payment
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (tax.year > currentYear || (tax.year === currentYear && tax.month > currentMonth)) {
      return res.status(400).json({ error: 'Cannot pay future tax' });
    }

    // Check for existing pending payment
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('tax_id', tax_id)
      .eq('status', 'success')
      .single();

    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already completed for this tax' });
    }

    const totalAmount = Number(tax.amount) + Number(tax.penalty || 0);
    const receiptNo = `ETAX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // Razorpay expects paise
      currency: 'INR',
      receipt: receiptNo,
      notes: {
        tax_id,
        user_id: userId,
        month: tax.month,
        year: tax.year,
      },
    });

    // Create pending payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        tax_id,
        razorpay_order_id: order.id,
        amount: totalAmount,
        status: 'pending',
        receipt_no: receiptNo,
      });

    if (paymentError) throw paymentError;

    res.json({
      order_id: order.id,
      amount: totalAmount,
      currency: 'INR',
      receipt_no: receiptNo,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

// ==================== VERIFY PAYMENT ====================
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, tax_id } = req.body;
    const userId = req.user.id;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification data missing' });
    }

    // ===== CRITICAL: Server-side signature verification =====
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('razorpay_order_id', razorpay_order_id);

      await logAudit({
        actorId: userId,
        actorType: 'user',
        action: 'PAYMENT_VERIFICATION_FAILED',
        targetTable: 'payments',
        details: { razorpay_order_id, razorpay_payment_id },
        ipAddress: req.ip,
      });

      return res.status(400).json({ error: 'Payment verification failed — signature mismatch' });
    }

    // Update payment record
    const now = new Date().toISOString();
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'success',
        paid_at: now,
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update tax status to PAID
    const { error: taxError } = await supabase
      .from('taxes')
      .update({ status: 'paid', paid_at: now })
      .eq('id', tax_id)
      .eq('user_id', userId);

    if (taxError) throw taxError;

    // Create notification
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Payment Successful',
      message: `Your tax payment of ₹${payment.amount} has been received. Receipt: ${payment.receipt_no}`,
      type: 'payment',
    });

    // Audit log
    await logAudit({
      actorId: userId,
      actorType: 'user',
      action: 'PAYMENT_SUCCESS',
      targetTable: 'payments',
      targetId: payment.id,
      details: { razorpay_payment_id, amount: payment.amount, receipt_no: payment.receipt_no },
      ipAddress: req.ip,
    });

    res.json({
      message: 'Payment verified successfully',
      payment: {
        id: payment.id,
        receipt_no: payment.receipt_no,
        amount: payment.amount,
        razorpay_payment_id,
        paid_at: now,
      },
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
};

// ==================== GET PAYMENT HISTORY ====================
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*, taxes(year, month)')
      .eq('user_id', userId)
      .eq('status', 'success')
      .order('paid_at', { ascending: false });

    if (error) throw error;
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

// ==================== DOWNLOAD RECEIPT ====================
const downloadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*, taxes(year, month, amount, penalty), users(username, gst_id)')
      .eq('id', id)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check access
    if (req.user.role === 'user' && payment.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const receiptData = {
      receipt_no: payment.receipt_no,
      username: payment.users?.username,
      gst_id: payment.users?.gst_id,
      month: payment.taxes?.month,
      year: payment.taxes?.year,
      amount: payment.taxes?.amount,
      penalty: payment.taxes?.penalty,
      razorpay_payment_id: payment.razorpay_payment_id,
      paid_at: payment.paid_at,
    };

    const pdfBuffer = await generateReceipt(receiptData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment.receipt_no}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Receipt download error:', err);
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
};

// ==================== ADMIN: GET ALL PAYMENTS ====================
const getAllPayments = async (req, res) => {
  try {
    const district_id = req.user.district_id;
    if (!district_id) return res.status(403).json({ error: 'No district assigned' });

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*, taxes(year, month), users!inner(username, gst_id, block, district_id)')
      .eq('users.district_id', district_id)
      .order('paid_at', { ascending: false });

    if (error) throw error;
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  downloadReceipt,
  getAllPayments,
};
