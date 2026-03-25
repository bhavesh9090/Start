const { supabase } = require('../config/supabase');
const { logAudit } = require('../utils/audit');

// ==================== CREATE NOTICE ====================
const createNotice = async (req, res) => {
  try {
    const { title, message, user_id, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message required' });
    }

    const district_id = req.user.district_id;
    if (!district_id) {
      return res.status(403).json({ error: 'No district assigned to admin' });
    }

    // 1. Create the notice
    const { data: notice, error } = await supabase
      .from('notices')
      .insert({
        title,
        message,
        district_id: user_id ? null : district_id,
        user_id: user_id || null,
        created_by: req.user.id,
        type: type || 'reminder'
      })
      .select()
      .single();

    if (error) throw error;

    // 2. SYNC: Create notifications for users
    try {
      if (user_id) {
        // Individual notice
        await supabase.from('notifications').insert({
          user_id,
          title: `Personal Notice: ${title}`,
          message: message.substring(0, 100),
          type: 'info'
        });
        
        // Cleanup: Keep only latest 4 for this user
        const { data: toDelete } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .range(4, 50);
        if (toDelete && toDelete.length > 0) {
          await supabase.from('notifications').delete().in('id', toDelete.map(d => d.id));
        }
      } else {
        // District-wide notice
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('district_id', district_id);

        if (users && users.length > 0) {
          const bulkNotifs = users.map(u => ({
            user_id: u.id,
            title: `Announcement: ${title}`,
            message: message.substring(0, 100),
            type: 'info'
          }));
          await supabase.from('notifications').insert(bulkNotifs);

          // Cleanup: Keep only latest 4 for every user in district
          // This is a bit heavy, so we do it in a safer way
          const { data: oldNotifs } = await supabase
            .from('notifications')
            .select('id, user_id')
            .in('user_id', users.map(u => u.id))
            .order('created_at', { ascending: false });
          
          if (oldNotifs) {
            const userCounts = {};
            const itemIdsToDelete = [];
            oldNotifs.forEach(n => {
              userCounts[n.user_id] = (userCounts[n.user_id] || 0) + 1;
              if (userCounts[n.user_id] > 4) {
                itemIdsToDelete.push(n.id);
              }
            });
            if (itemIdsToDelete.length > 0) {
              await supabase.from('notifications').delete().in('id', itemIdsToDelete);
            }
          }
        }
      }
    } catch (syncErr) {
      console.error('Notification sync failed:', syncErr);
      // Don't fail the notice creation request
    }

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
    const userRole = req.user.role;
    const isAdmin = ['super_admin', 'district_admin'].includes(userRole);

    const { data: notice, error: fetchError } = await supabase
      .from('notices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    const isOwner = notice.user_id === userId;
    const isDistrictMatch = notice.district_id === req.user.district_id;
    const isAuthorized = isOwner || isDistrictMatch || isAdmin;

    if (!isAuthorized) {
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
