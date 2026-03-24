const { supabase } = require('../config/supabase');
const bcrypt = require('bcrypt');

async function resetAllAdmins() {
    console.log('🔄 Resetting all 13 district admins...');
    
    try {
        const password = 'admin@123';
        const passkey = '123456';
        const hash = await bcrypt.hash(password, 10);
        
        const { data: districts, error: distError } = await supabase
            .from('districts')
            .select('id, name');

        if (distError || !districts) {
            console.error('❌ Error fetching districts:', distError);
            return;
        }

        console.log(`📍 Found ${districts.length} districts. Processing...`);

        for (const dist of districts) {
            const username = `admin_${dist.name.toLowerCase().replace(/ /g, '_')}`;
            
            const { error } = await supabase
                .from('admins')
                .upsert({
                    username,
                    password_hash: hash,
                    passkey,
                    role: 'district_admin',
                    district_id: dist.id
                }, { onConflict: 'username' });

            if (error) {
                console.error(`❌ Failed for ${username}:`, error.message);
            } else {
                console.log(`✅ Reset successfully: ${username}`);
            }
        }

        console.log('\n✨ ALL ADMINS INITIALIZED!');
        console.log('   Default Password: ' + password);
        console.log('   Default Passkey:  ' + passkey);

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

resetAllAdmins();

