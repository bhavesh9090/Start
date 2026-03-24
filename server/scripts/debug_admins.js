const { supabase } = require('../config/supabase');

async function debugData() {
    const { data: admins, error } = await supabase.from('admins').select('username, password_hash, passkey').limit(20);
    if (error) console.error(error);
    else {
        console.log('--- ADMINS DATA ---');
        admins.forEach(a => {
            console.log(`User: [${a.username}], HashLen: ${a.password_hash?.length}, Passkey: [${a.passkey}]`);
        });
    }
}
debugData();
