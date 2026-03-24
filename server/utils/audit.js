const { supabase } = require('../config/supabase');

const logAudit = async ({ actorId, actorType, action, targetTable, targetId, details, ipAddress, districtId }) => {
  try {
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      actor_type: actorType,
      action,
      target_table: targetTable,
      target_id: targetId,
      details,
      ip_address: ipAddress,
      district_id: districtId,
    });

  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { logAudit };
