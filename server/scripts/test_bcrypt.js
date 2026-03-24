const bcrypt = require('bcrypt');

async function check() {
    const password = 'admin@123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash Generated:', hash);
    const match = await bcrypt.compare(password, hash);
    console.log('Immediate Match:', match);
}
check();
