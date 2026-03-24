const { supabase } = require('./config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyOTP } = require('./utils/otp');
require('dotenv').config();

// Mock OTP for testing
const mobile = '9876543210';
const otp = '123456';
// We need to inject the OTP into the mock store
const { sendOTP } = require('./utils/otp');

async function testFullRegistration() {
  try {
    console.log('Setting up mock OTP...');
    await sendOTP(mobile, otp);

    const body = {
      username: 'testuser',
      gst_id: '05ABCDE1234F1Z5',
      mobile: mobile,
      password: 'password123',
      business_type: 'small',
      district: 'Almora',
      block: 'Block-A',
      father_name: 'Father',
      otp: otp
    };

    console.log('Starting registration simulation...');
    
    // 1. Password hash
    const password_hash = await bcrypt.hash(body.password, 10);
    
    // 2. Insert
    console.log('Inserting user...');
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        username: body.username,
        gst_id: body.gst_id,
        mobile: body.mobile,
        password_hash,
        district: body.district,
        block: body.block,
        business_type: body.business_type,
        father_name: body.father_name,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return;
    }
    console.log('User inserted, ID:', user.id);

    // 3. JWT
    console.log('Generating JWT...');
    const token = jwt.sign(
      { id: user.id, role: 'user', gst_id: user.gst_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    console.log('JWT generated successfully');

    // 4. Audit
    console.log('Logging audit...');
    const { logAudit } = require('./utils/audit');
    await logAudit({
      actorId: user.id,
      actorType: 'user',
      action: 'USER_REGISTERED',
      targetTable: 'users',
      targetId: user.id,
      details: { gst_id: body.gst_id },
      ipAddress: '127.0.0.1',
    });
    console.log('Audit logged');

    // Cleanup
    await supabase.from('users').delete().eq('id', user.id);
    console.log('Cleanup done');

  } catch (err) {
    console.error('Simulation failed with error:', err);
  }
}

testFullRegistration();
