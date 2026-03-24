const { supabase } = require('../config/supabase');
const { logAudit } = require('../utils/audit');

// ==================== CREATE COMPLAINT ====================
const createComplaint = async (req, res) => {
  try {
    const { name, mobile, subject, description, district_id } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description required' });
    }

    const insertData = {
      subject,
      description,
      name: name || null,
      mobile: mobile || null,
      district_id: district_id || null,
    };

    // Auto-link authenticated user and their district
    if (req.user && req.user.id) {
      insertData.user_id = req.user.id;
      
      // Fetch user's district_id if not in token
      if (req.user.district_id) {
        insertData.district_id = req.user.district_id;
      } else {
        const { data: user } = await supabase.from('users').select('district_id').eq('id', req.user.id).single();
        insertData.district_id = user?.district_id;
      }
    }

    const { data: complaint, error } = await supabase
      .from('complaints')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Complaint submitted successfully', complaint });
  } catch (err) {
    console.error('Complaint error:', err);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
};

// ==================== GET USER COMPLAINTS ====================
const getUserComplaints = async (req, res) => {
  try {
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

// ==================== ADMIN: GET ALL COMPLAINTS ====================
const getAllComplaints = async (req, res) => {
  try {
    const district_id = req.user.district_id;
    if (!district_id) return res.status(403).json({ error: 'No district assigned' });

    const { status } = req.query;
    let query = supabase
      .from('complaints')
      .select('*, users(username, gst_id)')
      .eq('district_id', district_id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data: complaints, error } = await query;
    if (error) throw error;
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

// ==================== ADMIN: UPDATE COMPLAINT ====================
const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_remarks } = req.body;

    const { data: complaint, error } = await supabase
      .from('complaints')
      .update({
        status: status || 'resolved',
        admin_remarks,
        resolved_by: req.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('district_id', req.user.district_id) // Strict district lock
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      actorId: req.user.id,
      actorType: 'admin',
      action: 'COMPLAINT_UPDATED',
      targetTable: 'complaints',
      targetId: id,
      details: { status, admin_remarks },
      ipAddress: req.ip,
      districtId: req.user.district_id,
    });

    res.json({ message: 'Complaint updated', complaint });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update complaint' });
  }
};

// ==================== ADMIN: DELETE COMPLAINT ====================
const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const district_id = req.user.district_id;

    if (!district_id) return res.status(403).json({ error: 'No district assigned' });

    // Verify ownership and delete
    const { data: deleted, error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id)
      .eq('district_id', district_id)
      .select()
      .single();

    if (error) throw error;
    if (!deleted) return res.status(404).json({ error: 'Complaint not found or unauthorized' });

    await logAudit({
      actorId: req.user.id,
      actorType: 'admin',
      action: 'COMPLAINT_DELETED',
      targetTable: 'complaints',
      targetId: id,
      details: { deletedComplaintSubject: deleted.subject },
      ipAddress: req.ip,
      districtId: district_id,
    });

    res.json({ message: 'Complaint deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
};

module.exports = { createComplaint, getUserComplaints, getAllComplaints, updateComplaint, deleteComplaint };
