const crypto = require('crypto');
const { supabase } = require('../config/supabase');
const razorpay = require('../config/razorpay');
const { generateReceipt } = require('../utils/receipt');
const { logAudit } = require('../utils/audit');
require('dotenv').config();

const TAX_AMOUNTS = {
  'Grocery & Retail': 200,
  'Restaurant & Cafe': 500,
  'Electronics & Hardware': 600,
  'Medical & Pharmacy': 400,
  'Clothing & Apparels': 300,
  'Services & Consultancy': 250,
  'Small Kiosk / Vendor': 100,
};

// ==================== GET PAYMENTS ====================
const getPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    // Get monthly payments
    const { data: payments, error } = await supabase
      .from('monthly_payments')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (error) throw error;
    res.json({ payments });
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ error: 'Failed to fetch monthly payments' });
  }
};

// ==================== CREATE ORDER ====================
const createOrder = async (req, res) => {
  try {
    const { month, year } = req.body;
    const userId = req.user.id;

    if (!month || !year) return res.status(400).json({ error: 'Month and year are required' });

    const targetMonth = parseInt(month, 10);
    const targetYear = parseInt(year, 10);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // ❌ No future payment
    if (targetYear > currentYear || (targetYear === currentYear && targetMonth > currentMonth)) {
      return res.status(400).json({ error: 'Cannot pay future tax months' });
    }

    // Get user details and business type for tax calculation
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, business_type')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User fetch error:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    const monthlyTaxAmount = TAX_AMOUNTS[user.business_type] || 500;
    console.log('Tax calculation:', { businessType: user.business_type, monthlyTaxAmount, userId });

    // Fetch existing payments to enforce sequential rules
    const { data: existing, error: existError } = await supabase
      .from('monthly_payments')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (existError) {
      console.error('Fetch payments error:', existError);
      throw existError;
    }

    // Check if requested month is already paid
    const requestedRecord = existing.find(p => p.year === targetYear && p.month === targetMonth);
    if (requestedRecord && requestedRecord.status === 'PAID') {
      return res.status(400).json({ error: 'This month is already paid' });
    }

    // Allow retry: If the user previously started payment but cancelled, 
    // it will be PENDING in DB. We allow generating a new Razorpay order.

    // ❌ Sequential payment only: find oldest unpaid month
    // We assume tax collection starts from this year or a specific past year. 
    // To implement "Sequential payment only", we need to know the starting point.
    // If we only enforce sequence based on what is in the DB, it's tricky.
    // Let's assume tax starts Jan of current year, or just look back for unpaid past months before current/selected.
    
    // For sequential exact rule: We check if there are any strictly older months that are not PAID.
    // However, since we might not pre-generate rows for all past months in `monthly_payments`,
    // we determine missing past months by checking all months BEFORE the requested month,
    // back to the start of the year (or previous year if applicable).
    
    // Simplified Sequential check:
    // User cannot pay Month N if Month N-1 is unpaid (assuming it is <= current date).
    let oldestUnpaidYear = targetYear;
    let oldestUnpaidMonth = currentMonth;
    
    let foundOldestUnpaid = false;
    let startM = 1; // Always start from January
    let endM = (targetYear === currentYear) ? currentMonth : 12;

    for (let m = startM; m <= endM; m++) {
       const isPaid = existing.some(p => p.year === targetYear && p.month === m && p.status === 'PAID');
       if (!isPaid && !foundOldestUnpaid) {
          oldestUnpaidYear = targetYear;
          oldestUnpaidMonth = m;
          foundOldestUnpaid = true;
       }
    }

    if (foundOldestUnpaid) {
       if (targetYear !== oldestUnpaidYear || targetMonth !== oldestUnpaidMonth) {
          return res.status(400).json({ error: `Sequential payment required. Please pay for Month ${oldestUnpaidMonth}, Year ${oldestUnpaidYear} first.` });
       }
    }

    // ❌ Penalty rules
    // If the due date was last month
    let penalty = 0;
    // A month is "missed" if we are in a strictly later month/year than the target month/year
    if (currentYear > targetYear || (currentYear === targetYear && currentMonth > targetMonth)) {
       penalty = monthlyTaxAmount * 0.10; // 10%
    }

    const totalAmount = monthlyTaxAmount + penalty;
    const receiptNo = `MTX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    console.log('Creating order:', { totalAmount, receiptNo });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: receiptNo,
      notes: {
        user_id: userId,
        month: targetMonth,
        year: targetYear,
      },
    });

    // Save PENDING record in DB
    const { error: insertError } = await supabase
      .from('monthly_payments')
      .insert({
        user_id: userId,
        month: targetMonth,
        year: targetYear,
        amount: monthlyTaxAmount,
        penalty: penalty,
        status: 'PENDING',
        razorpay_payment_id: null
      });

    // If duplicate throws error because of UNIQUE constraint
    if (insertError) {
       console.log('Insert error (likely duplicate):', insertError.message);
       // Maybe it's already there as PENDING but Razorpay failed. We can update it instead.
       await supabase.from('monthly_payments').update({
         amount: monthlyTaxAmount,
         penalty: penalty,
         status: 'PENDING'
       }).eq('user_id', userId).eq('month', targetMonth).eq('year', targetYear);
    }

    res.json({
      order_id: order.id,
      amount: totalAmount,
      currency: 'INR',
      receipt_no: receiptNo,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Detailed Create order error:', err);
    res.status(500).json({ 
      error: 'Failed to create payment order',
      details: err.message || JSON.stringify(err)
    });
  }
};

// ==================== VERIFY PAYMENT ====================
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, month, year } = req.body;
    const userId = req.user.id;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment data' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { data: payment, error: updateError } = await supabase
      .from('monthly_payments')
      .update({
        status: 'PAID',
        razorpay_payment_id,
        // we can set a paid_at if we had a column, but created_at is there or we just use status
      })
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ success: true, payment });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// ==================== DOWNLOAD RECEIPT ====================
const downloadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: payment, error } = await supabase
      .from('monthly_payments')
      .select('*, users(username, gst_id, photo_url)')
      .eq('id', id)
      .single();

    if (error || !payment) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'user' && payment.user_id !== userId) return res.status(403).json({ error: 'Denied' });

    const total = Number(payment.amount) + Number(payment.penalty);
    
    // Using existing receipt utility
    const receiptData = {
      receipt_no: `MTX-${payment.id.split('-')[0]}`,
      username: payment.users?.username,
      gst_id: payment.users?.gst_id,
      photo_url: payment.users?.photo_url,
      month: payment.month,
      year: payment.year,
      amount: payment.amount,
      penalty: payment.penalty,
      razorpay_payment_id: payment.razorpay_payment_id,
      paid_at: payment.created_at, // approximated
      total_paid: total
    };

    const pdfBuffer = await generateReceipt(receiptData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=tax-receipt-${payment.month}-${payment.year}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Receipt generation error:', err);
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
};

// ==================== ADMIN: GET ALL PAYMENTS ====================
const getAllPayments = async (req, res) => {
  try {
    const { user_id, block, status, month, year } = req.query;
    const district_id = req.user.district_id;

    let query = supabase
      .from('monthly_payments')
      .select('*, users!inner(username, gst_id, district_id, block)')
      .order('created_at', { ascending: false });

    // Strict District Filtering for admins
    if (district_id) {
      query = query.eq('users.district_id', district_id);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (block) {
      query = query.eq('users.block', block);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (month) {
      query = query.eq('month', parseInt(month, 10));
    }

    if (year) {
      query = query.eq('year', parseInt(year, 10));
    }

    const { data: payments, error } = await query;

    if (error) throw error;
    res.json({ payments });
  } catch (err) {
    console.error('Get all payments error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

// ==================== DELETE PAYMENT ====================
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the payment
    const { data: payment, error: findError } = await supabase
      .from('monthly_payments')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !payment) return res.status(404).json({ error: 'Payment record not found' });

    // Check ownership
    // Allow users to delete their own records? 
    // In a real app, you might only allow deleting PENDING ones or only admins.
    // But since the user explicitly asked for this feature in history, I'll allow it for their own records.
    if (payment.user_id !== userId && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error: deleteError } = await supabase
      .from('monthly_payments')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Audit log
    await logAudit({
      actorId: userId,
      actorType: req.user.role,
      action: 'PAYMENT_DELETED',
      targetTable: 'monthly_payments',
      targetId: id,
      details: { month: payment.month, year: payment.year, status: payment.status },
      ipAddress: req.ip,
    });

    res.json({ message: 'Payment record deleted successfully' });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: 'Failed to delete payment record' });
  }
};

module.exports = {
  getPayments,
  createOrder,
  verifyPayment,
  downloadReceipt,
  getAllPayments,
  deletePayment
};
