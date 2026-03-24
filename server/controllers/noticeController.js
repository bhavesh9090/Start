const { supabase } = require('../config/supabase');
const { logAudit } = require('../utils/audit');

// ==================== CREATE NOTICE ====================
const createNotice = async (req, res) => {
  try {
    const { title, message, user_id } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message required' });
    }

    // Strict District Lock: Admin can only send to their own district
    const district_id = req.user.district_id;
    if (!district_id) {
      return res.status(403).json({ error: 'No district assigned to admin' });
    }

    const { data: notice, error } = await supabase
      .from('notices')
      .insert({
        title,
        message,
        district_id: user_id ? null : district_id, // If personal notice, don't broadcast to district
        user_id: user_id || null, // Optional personal targeting
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      actorId: req.user.id,
      actorType: 'admin',
      action: 'NOTICE_CREATED',
      targetTable: 'notices',
      targetId: notice.id,
      details: { title, district_id },
      ipAddress: req.ip,
      districtId: district_id,
    });

    res.status(201).json({ message: 'Notice created successfully', notice });
  } catch (err) {
    console.error('Notice creation error:', err);
    res.status(500).json({ error: 'Failed to create notice' });
  }
};

// ==================== GET NOTICES (USER) ====================
const getUserNotices = async (req, res) => {
  try {
    const district_id = req.user.district_id;
    const userId = req.user.id;
    
    const { data: notices, error } = await supabase
      .from('notices')
      .select('*')
      .or(`district_id.eq.${district_id},user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ notices });
  } catch (err) {
    console.error('Fetch notices error:', err);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
};

// ==================== GET ALL NOTICES (ADMIN) ====================
const getAllNotices = async (req, res) => {
  try {
    const district_id = req.user.district_id;
    
    const { data: notices, error } = await supabase
      .from('notices')
      .select('*, districts(name)')
      .eq('district_id', district_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ notices });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
};

// ==================== DELETE NOTICE ====================
const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Fetch notice first to check ownership
    const { data: notice, error: fetchError } = await supabase
      .from('notices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    // Authorization: Admin can delete any notice in their district. 
    // User can only delete notice targeted at them.
    const isOwner = notice.user_id === userId;
    const isDistrictAdmin = isAdmin && notice.district_id === req.user.district_id;

    if (!isOwner && !isDistrictAdmin) {
      return res.status(403).json({ error: 'Unauthorized to delete this notice' });
    }

    const { error: deleteError } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await logAudit({
      actorId: userId,
      actorType: isAdmin ? 'admin' : 'user',
      action: 'NOTICE_DELETED',
      targetTable: 'notices',
      targetId: id,
      details: { title: notice.title },
      ipAddress: req.ip,
      districtId: notice.district_id,
    });

    res.json({ message: 'Notice deleted successfully' });
  } catch (err) {
    console.error('Notice deletion error:', err);
    res.status(500).json({ error: 'Failed to delete notice' });
  }
};

module.exports = { createNotice, getUserNotices, getAllNotices, deleteNotice };
