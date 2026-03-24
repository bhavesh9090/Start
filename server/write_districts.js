const { supabase } = require('./config/supabase');
const fs = require('fs');
supabase.from('districts').select('id, name').order('name',{ascending:true}).then(r => {
  if (r.data) {
    const list = r.data.map(d => `{ id: '${d.id}', name: '${d.name}' }`).join(',\n    ');
    fs.writeFileSync('districts_list.txt', `[\n    ${list}\n  ]`);
    console.log('Districts written to districts_list.txt');
  }
});
