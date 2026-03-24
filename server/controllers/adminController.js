const { supabase } = require('../config/supabase');
const { logAudit } = require('../utils/audit');

// ==================== DASHBOARD STATS ====================
const getDashboardStats = async (req, res) => {
  try {
    const { year: filterYear } = req.query;
    const district_id = req.user.district_id;
    if (!district_id) return res.status(403).json({ error: 'No district assigned' });

    // 1. Total users and distribution by type
    const { data: allUsers, error: userError } = await supabase
      .from('users')
      .select('business_type, is_locked')
      .eq('district_id', district_id);

    if (userError) throw userError;

    const totalUsers = allUsers.length;
    const shopDistribution = allUsers.reduce((acc, u) => {
      acc[u.business_type] = (acc[u.business_type] || 0) + 1;
      return acc;
    }, {});

    // 2. Revenue and Payments from monthly_payments
    let paymentQuery = supabase
      .from('monthly_payments')
      .select('amount, penalty, status, month, year, users!inner(district_id)')
      .eq('users.district_id', district_id);

    if (filterYear) {
      paymentQuery = paymentQuery.eq('year', parseInt(filterYear));
    }

    const { data: allPayments, error: paymentError } = await paymentQuery;

    if (paymentError) throw paymentError;

    const paidPayments = allPayments.filter(p => p.status === 'PAID');
    const pendingPayments = allPayments.filter(p => p.status !== 'PAID');

    const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount) + Number(p.penalty || 0), 0);
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount) + Number(p.penalty || 0), 0);

    // 3. Monthly Revenue Trend (Last 6 months)
    const now = new Date();
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      
      const monthlyTotal = paidPayments
        .filter(p => p.month === m && p.year === y)
        .reduce((sum, p) => sum + Number(p.amount) + Number(p.penalty || 0), 0);
      
      monthlyRevenue.push({
        month: d.toLocaleString('default', { month: 'short' }),
        revenue: monthlyTotal
      });
    }

    // 4. Complaints Stats
    const { data: complaints, error: complaintError } = await supabase
      .from('complaints')
      .select('status')
      .eq('district_id', district_id);

    if (complaintError) throw complaintError;

    const complaintsStats = {
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
    };

    res.json({
      stats: {
        totalUsers,
        totalPaid: paidPayments.length,
        totalUnpaid: pendingPayments.length,
        totalRevenue,
        pendingAmount,
        pendingComplaints: complaintsStats.pending,
        distribution: Object.entries(shopDistribution).map(([name, value]) => ({ name, value })),
        revenueTrend: monthlyRevenue,
        complaints: complaintsStats,
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// ==================== GET ALL USERS ====================
const getAllUsers = async (req, res) => {
  try {
    const { block, business_type, search } = req.query;
    const district_id = req.user.district_id;

    if (!district_id) return res.status(403).json({ error: 'No district assigned' });

    let query = supabase
      .from('users')
      .select('id, username, gst_id, mobile, district, block, business_type, father_name, photo_url, is_locked, created_at')
      .eq('district_id', district_id)
      .order('created_at', { ascending: false });

    if (block) query = query.eq('block', block);
    if (business_type) query = query.eq('business_type', business_type);
    if (search) query = query.or(`username.ilike.%${search}%,gst_id.ilike.%${search}%`);

    const { data: users, error } = await query;
    if (error) throw error;
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// ==================== UNLOCK USER ACCOUNT ====================
const unlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const district_id = req.user.district_id;

    if (!district_id) return res.status(403).json({ error: 'No district assigned' });

    // Verify user belongs to admin's district
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('username, district_id')
      .eq('id', id)
      .single();

    if (fetchError || !user) return res.status(404).json({ error: 'User not found' });
    if (user.district_id !== district_id) return res.status(403).json({ error: 'Access denied: User belongs to another district' });

    const { error: updateError } = await supabase
      .from('users')
      .update({ is_locked: false, failed_attempts: 0 })
      .eq('id', id);

    if (updateError) throw updateError;

    // Log the action
    await logAudit({
      actorId: req.user.id,
      actorType: 'admin',
      action: 'USER_UNLOCK',
      targetTable: 'users',
      targetId: id,
      details: { username: user.username },
      ipAddress: req.ip,
      districtId: district_id
    });

    res.json({ message: 'User account unlocked' });
  } catch (err) {
    console.error('Unlock error:', err);
    res.status(500).json({ error: 'Failed to unlock user' });
  }
};

// ==================== UPDATE USER ====================
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, mobile, business_type, gst_id, block, father_name, photo_url } = req.body;
    const district_id = req.user.district_id;

    if (!district_id) return res.status(403).json({ error: 'No district assigned' });

    // Verify user belongs to admin's district
    const { data: userToUpdate, error: fetchError } = await supabase
      .from('users')
      .select('district_id')
      .eq('id', id)
      .single();

    if (fetchError || !userToUpdate) return res.status(404).json({ error: 'User not found' });
    if (userToUpdate.district_id !== district_id) return res.status(403).json({ error: 'Access denied: User belongs to another district' });

    const updateData = { username, mobile, business_type, gst_id, block, father_name };
    if (photo_url !== undefined) {
      updateData.photo_url = photo_url;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log the action
    await logAudit({
      actorId: req.user.id,
      actorType: 'admin',
      action: 'ADMIN_USER_PROFILE_UPDATE',
      targetTable: 'users',
      targetId: id,
      details: { username, updated_fields: updateData },
      ipAddress: req.ip,
      districtId: district_id
    });

    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// ==================== GET AUDIT LOGS ====================
const getAuditLogs = async (req, res) => {
  try {
    const { action, actor_type, limit: queryLimit } = req.query;

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(queryLimit) || 100);

    if (req.user.role === 'admin') {
      query = query.eq('district_id', req.user.district_id);
    }

    if (action) query = query.eq('action', action);
    if (actor_type) query = query.eq('actor_type', actor_type);

    const { data: logs, error } = await query;
    if (error) throw error;
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// ==================== GOVERNMENT UPDATES ====================
const createUpdate = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }

    const { data, error } = await supabase
      .from('government_updates')
      .insert({
        title,
        content,
        category: category || 'general',
        published_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Update published', update: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create update' });
  }
};

const getUpdates = async (req, res) => {
  try {
    const { data: updates, error } = await supabase
      .from('government_updates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ updates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
};

// ==================== GET NOTIFICATIONS ====================
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id);

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
};


// ==================== ADVANCED ANALYTICS ====================
const getAdvancedAnalytics = async (req, res) => {
  try {
    const district_id = req.user.district_id;
    if (!district_id) return res.status(403).json({ error: 'No district assigned' });

    // Fetch all payments with joined user data for this district
    const { data: payments, error } = await supabase
      .from('monthly_payments')
      .select('amount, penalty, status, month, year, users!inner(block, business_type, district_id)')
      .eq('users.district_id', district_id);

    if (error) throw error;

    const paidPayments = (payments || []).filter(p => p.status === 'PAID');

    // 1. Year-wise Aggregation
    const yearMap = {};
    paidPayments.forEach(p => {
      yearMap[p.year] = (yearMap[p.year] || 0) + Number(p.amount) + Number(p.penalty || 0);
    });
    const yearWise = Object.entries(yearMap)
      .map(([year, collection]) => ({ year: parseInt(year), collection }))
      .sort((a, b) => a.year - b.year);

    // Calculate growth % for yearWise
    for (let i = 1; i < yearWise.length; i++) {
        const prev = yearWise[i-1].collection;
        const curr = yearWise[i].collection;
        yearWise[i].growth = prev > 0 ? (((curr - prev) / prev) * 100).toFixed(1) : 0;
    }

    // 2. Month-wise Aggregation (for a specific year - defaults to latest)
    const currentYear = new Date().getFullYear();
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({ 
      month: i + 1, 
      name: new Date(0, i).toLocaleString('default', { month: 'short' }),
      collection: 0,
      paidCount: 0,
      unpaidCount: 0
    }));

    (payments || []).filter(p => p.year === currentYear).forEach(p => {
      const mIdx = p.month - 1;
      if (p.status === 'PAID') {
        monthlyData[mIdx].collection += Number(p.amount) + Number(p.penalty || 0);
        monthlyData[mIdx].paidCount++;
      } else {
        monthlyData[mIdx].unpaidCount++;
      }
    });

    // 3. Block-wise Aggregation
    const blockMap = {};
    paidPayments.forEach(p => {
      const block = p.users?.block || 'Other';
      blockMap[block] = (blockMap[block] || 0) + Number(p.amount) + Number(p.penalty || 0);
    });
    const blockWise = Object.entries(blockMap)
      .map(([name, collection]) => ({ name, collection }))
      .sort((a, b) => b.collection - a.collection);

    // 4. Shop Type-wise Aggregation
    const typeMap = {};
    paidPayments.forEach(p => {
      const type = p.users?.business_type || 'Other';
      typeMap[type] = (typeMap[type] || 0) + Number(p.amount) + Number(p.penalty || 0);
    });
    const typeWise = Object.entries(typeMap)
      .map(([name, collection]) => ({ name, collection }))
      .sort((a, b) => b.collection - a.collection);

    res.json({
      yearWise,
      monthWise: monthlyData,
      blockWise,
      typeWise
    });
  } catch (err) {
    console.error('Advanced analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch advanced analytics' });
  }
};

// ==================== ADMIN PROFILE ====================
const getAdminProfile = async (req, res) => {
  try {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*, districts(name)')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ admin });
  } catch (err) {
    console.error('getAdminProfile Error:', err);
    res.status(500).json({ error: 'Failed to fetch admin profile', details: err.message });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const { email, mobile, qualification, office_field, member_since, photo_url } = req.body;
    
    const updateData = {
      email,
      mobile,
      qualification,
      office_field,
      member_since,
      photo_url,
      updated_at: new Date().toISOString()
    };

    const { data: updated, error } = await supabase
      .from('admins')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      actorId: req.user.id,
      actorType: 'admin',
      action: 'ADMIN_PROFILE_UPDATE',
      targetTable: 'admins',
      targetId: req.user.id,
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
      districtId: req.user.district_id
    });

    if (error) throw error;
    // ...
    res.json({ message: 'Profile updated successfully', admin: updated });
  } catch (err) {
    console.error('updateAdminProfile Error:', err);
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
};

module.exports = {
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
  updateUser,
};
