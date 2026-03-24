const { supabase } = require('./config/supabase');
supabase.from('districts').select('id, name').order('name',{ascending:true}).then(r => {
  if (r.data) {
    r.data.forEach(d => console.log(`{ id: '${d.id}', name: '${d.name}' },`));
  }
});
