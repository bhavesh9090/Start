const { supabase } = require('./config/supabase');

async function checkDistricts() {
  const { data, error } = await supabase.from('districts').select('*');
  if (error) {
    console.error('Error fetching districts:', error);
    return;
  }
  console.log('Districts in DB:', data);
  console.log('Total:', data.length);
}

checkDistricts();
