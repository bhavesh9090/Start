const { supabase } = require('./config/supabase');
require('dotenv').config();

async function fixInvalidUsers() {
  console.log("Fetching users...");
  const { data: users, error } = await supabase.from('users').select('id, username, business_type');
  
  if (error) {
    console.error("Error fetching users:", error.message);
    return;
  }

  const validTypes = [
    'Grocery & Retail',
    'Restaurant & Cafe',
    'Electronics & Hardware',
    'Medical & Pharmacy',
    'Clothing & Apparels',
    'Services & Consultancy',
    'Small Kiosk / Vendor'
  ];

  let fixedCount = 0;

  for (const user of users) {
    if (!validTypes.includes(user.business_type)) {
      console.log(`Fixing user ${user.username} (current type: ${user.business_type})...`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ business_type: 'Small Kiosk / Vendor' })
        .eq('id', user.id);
        
      if (updateError) {
         console.error(`Failed to update user ${user.username}:`, updateError.message);
      } else {
         fixedCount++;
         console.log(`✅ Updated user ${user.username} to "Small Kiosk / Vendor"`);
      }
    }
  }
  
  console.log(`\nDone! Fixed ${fixedCount} user(s). You can now run the SQL query in Supabase!`);
}

fixInvalidUsers();
