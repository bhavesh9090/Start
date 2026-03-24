const { supabase } = require('../config/supabase');
const { logAudit } = require('../utils/audit');

// Business type to tax amount mapping (monthly)
const TAX_AMOUNTS = {
  'Grocery & Retail': 200,
  'Restaurant & Cafe': 500,
  'Electronics & Hardware': 600,
  'Medical & Pharmacy': 400,
  'Clothing & Apparels': 300,
  'Services & Consultancy': 250,
  'Small Kiosk / Vendor': 100,
};

// Penalty rate (10% per month overdue)
const PENALTY_RATE = 0.10;

// ==================== GET USER TAXES ====================
const getUserTaxes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year } = req.query;

    let query = supabase
      .from('taxes')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: true });

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    const { data: taxes, error } = await query;
    if (error) throw error;

    res.json({ taxes });
  } catch (err) {
    console.error('Get taxes error:', err);
    res.status(500).json({ error: 'Failed to fetch taxes' });
  }
};

// ==================== GET TAX BY ID ====================
const getTaxById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: tax, error } = await supabase
      .from('taxes')
      .select('*, users(username, gst_id, business_type)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!tax) return res.status(404).json({ error: 'Tax not found' });

    // Check access
    if (req.user.role === 'user' && tax.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ tax });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tax' });
  }
};

// ==================== GENERATE MONTHLY TAXES ====================
const generateMonthlyTaxes = async (year, month) => {
  try {
    console.log(`📋 Generating taxes for ${month}/${year}...`);

    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, business_type');

    if (usersError) throw usersError;

    const taxes = users.map((user) => ({
      user_id: user.id,
      year,
      month,
      amount: TAX_AMOUNTS[user.business_type] || 100,
      penalty: 0,
      status: 'unpaid',
      due_date: new Date(year, month, 0).toISOString().split('T')[0], // Last day of the month
    }));

    // Check existing taxes to avoid duplicates
    const { data: existing } = await supabase
      .from('taxes')
      .select('user_id')
      .eq('year', year)
      .eq('month', month);

    const existingUserIds = new Set((existing || []).map((t) => t.user_id));
    const newTaxes = taxes.filter((t) => !existingUserIds.has(t.user_id));

    if (newTaxes.length > 0) {
      const { error: insertError } = await supabase
        .from('taxes')
        .insert(newTaxes);

      if (insertError) throw insertError;
      console.log(`✅ Generated ${newTaxes.length} tax records for ${month}/${year}`);
    } else {
      console.log(`ℹ️ Taxes already exist for ${month}/${year}`);
    }

    return newTaxes.length;
  } catch (err) {
    console.error('Tax generation error:', err);
    throw err;
  }
};

// ==================== APPLY PENALTIES ====================
const applyPenalties = async () => {
  try {
    const today = new Date();
    
    // Find unpaid taxes past due date
    const { data: overdueTaxes, error } = await supabase
      .from('taxes')
      .select('*')
      .eq('status', 'unpaid')
      .lt('due_date', today.toISOString().split('T')[0]);

    if (error) throw error;

    for (const tax of overdueTaxes || []) {
      const monthsOverdue = Math.max(1, 
        (today.getFullYear() - tax.year) * 12 + (today.getMonth() + 1 - tax.month)
      );
      const penalty = Math.round(tax.amount * PENALTY_RATE * monthsOverdue * 100) / 100;

      await supabase
        .from('taxes')
        .update({ penalty, status: 'due' })
        .eq('id', tax.id);
    }

    console.log(`⚠️ Applied penalties to ${(overdueTaxes || []).length} overdue taxes`);
  } catch (err) {
    console.error('Penalty application error:', err);
  }
};

// ==================== ADMIN: GET ALL TAXES ====================
const getAllTaxes = async (req, res) => {
  try {
    const { year, month, status, block, user_id } = req.query;

    let query = supabase
      .from('taxes')
      .select('*, users!inner(id, username, gst_id, block, business_type, district_id)')
      .order('year', { ascending: false })
      .order('month', { ascending: true });

    // Strict District Filtering
    if (req.user.role === 'admin') {
      query = query.eq('users.district_id', req.user.district_id);
    }

    if (year) query = query.eq('year', parseInt(year));
    if (month) query = query.eq('month', parseInt(month));
    if (status) query = query.eq('status', status);
    if (user_id) query = query.eq('user_id', user_id);

    const { data: taxes, error } = await query;
    if (error) throw error;

    // Filter by block if provided (post-query since it's a joined field)
    let filtered = taxes;
    if (block) {
      filtered = taxes.filter((t) => t.users?.block === block);
    }

    res.json({ taxes: filtered });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch taxes' });
  }
};

// ==================== ADMIN: TRIGGER TAX GENERATION ====================
const triggerTaxGeneration = async (req, res) => {
  try {
    const { year, month } = req.body;
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month required' });
    }

    const count = await generateMonthlyTaxes(year, month);

    await logAudit({
      actorId: req.user.id,
      actorType: 'admin',
      action: 'TAX_GENERATION',
      details: { year, month, count },
      ipAddress: req.ip,
      districtId: req.user.district_id,
    });

    res.json({ message: `Generated ${count} tax records`, count });
  } catch (err) {
    res.status(500).json({ error: 'Tax generation failed' });
  }
};

// ==================== TAX ANALYTICS ====================
const getTaxAnalytics = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    let query = supabase
      .from('taxes')
      .select('month, amount, penalty, status, users!inner(district_id)')
      .eq('year', targetYear);

    // Strict District Filtering
    if (req.user.role === 'admin') {
      query = query.eq('users.district_id', req.user.district_id);
    }

    const { data: taxes, error } = await query;

    if (error) throw error;

    // Aggregate by month
    const monthlyData = {};
    for (let m = 1; m <= 12; m++) {
      monthlyData[m] = { month: m, total: 0, paid: 0, unpaid: 0, revenue: 0, penalty: 0 };
    }

    (taxes || []).forEach((t) => {
      const m = t.month;
      if (monthlyData[m]) {
        monthlyData[m].total++;
        if (t.status === 'paid') {
          monthlyData[m].paid++;
          monthlyData[m].revenue += Number(t.amount) + Number(t.penalty || 0);
        } else {
          monthlyData[m].unpaid++;
        }
        monthlyData[m].penalty += Number(t.penalty || 0);
      }
    });

    res.json({
      year: targetYear,
      analytics: Object.values(monthlyData),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = {
  getUserTaxes,
  getTaxById,
  generateMonthlyTaxes,
  applyPenalties,
  getAllTaxes,
  triggerTaxGeneration,
  getTaxAnalytics,
  TAX_AMOUNTS,
};
