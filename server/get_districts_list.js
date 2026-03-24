const { supabase } = require('./config/supabase');
supabase.from('districts').select('id, name').order('name',{ascending:true}).then(r => {
  if (r.data) {
    const list = r.data.map(d => `{ id: '${d.id}', name: '${d.name}' }`).join(',\n    ');
    console.log(`[\n    ${list}\n  ]`);
  }
});
