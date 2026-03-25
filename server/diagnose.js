const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const fs = require('fs');

async function diagnose() {
  const results = {
    notices: [],
    notifications: [],
    users: [],
    errors: []
  };
  
  try {
    const { data: notices } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    results.notices = notices || [];

    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    results.notifications = notifications || [];

    const { data: users } = await supabase
      .from('users')
      .select('id, district_id, username')
      .limit(10);
    results.users = users || [];

    const { data: admins } = await supabase
      .from('admins')
      .select('id, district_id, username')
      .limit(5);
    results.admins = admins || [];

    const { data: districts } = await supabase
      .from('districts')
      .select('id, name');
    results.districts = districts || [];

    const { data: testNotif, error: testErr } = await supabase
      .from('notifications')
      .insert({
        user_id: users[0]?.id,
        title: 'DIAGNOSTIC TEST',
        message: 'This is a test notification from the diagnostics script.',
        type: 'info'
      })
      .select();
    results.testInsert = { data: testNotif, error: testErr };

  } catch (err) {
    results.errors.push(err.message);
  }

  fs.writeFileSync('diagnostics_results.json', JSON.stringify(results, null, 2));
  console.log('Diagnostics written to diagnostics_results.json');
}

diagnose();
