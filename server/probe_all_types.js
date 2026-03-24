const { supabase } = require('./config/supabase');
require('dotenv').config();

async function probeAllTypes() {
  const types = [
    "Grocery & Retail",
    "Restaurant & Cafe",
    "Electronics & Hardware",
    "Medical & Pharmacy",
    "Clothing & Apparels",
    "Services & Consultancy",
    "Small Kiosk / Vendor",
    // Also try snake_case or lowercase versions
    "grocery", "retail", "restaurant", "cafe", "electronics", "hardware", "medical", "pharmacy", "clothing", "apparel", "services", "consultancy", "kiosk", "vendor", "other", "small"
  ];
  
  for (const type of types) {
    const { error } = await supabase.from('users').insert({
      username: 'probe_all',
      gst_id: '05AB' + Math.random().toString(36).substring(2, 6).toUpperCase() + 'A1Z5',
      mobile: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      password_hash: 'probe',
      business_type: type,
      district: 'probe',
      block: 'probe'
    });
    
    if (error) {
      if (error.code === '23514') {
        // failed constraint
      } else {
        console.log(`Failed "${type}" with different error:`, error.message);
      }
    } else {
      console.log(`✅ SUCCESS: The database accepted "${type}"!`);
      await supabase.from('users').delete().eq('username', 'probe_all');
    }
  }
  console.log("Done checking all types.");
}

probeAllTypes();
