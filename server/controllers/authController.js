const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { generateOTP, sendOTP, verifyOTP } = require('../utils/otp');
const { logAudit } = require('../utils/audit');
require('dotenv').config();

// GST validation regex: 2-digit state code + 10-char PAN + 1 digit + Z + 1 alphanumeric
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// ==================== USER REGISTRATION ====================
const registerUser = async (req, res) => {
  try {
    const {
      username, gst_id, mobile, password,
      district, block, business_type, father_name, otp, photo_url
    } = req.body;

    // Validate required fields
    if (!username || !gst_id || !mobile || !password || !business_type) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Validate GST format
    if (!GST_REGEX.test(gst_id)) {
      return res.status(400).json({ error: 'Invalid GST ID format' });
    }

    // Verify OTP
    if (!otp || !verifyOTP(mobile, otp)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Check if GST or Mobile already exists
    const { data: existingGst } = await supabase
      .from('users')
      .select('id')
      .eq('gst_id', gst_id)
      .single();

    if (existingGst) {
      return res.status(409).json({ error: 'GST ID already registered' });
    }

    const { data: existingMobile } = await supabase
      .from('users')
      .select('id')
      .eq('mobile', mobile)
      .single();

    if (existingMobile) {
      return res.status(409).json({ error: 'Mobile number already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Get District ID from districts table
    const { data: distData } = await supabase
      .from('districts')
      .select('id')
      .eq('name', district || 'Almora')
      .single();

    // Insert user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        username,
        gst_id,
        mobile,
        password_hash,
        district: district || 'Almora',
        district_id: distData?.id,
        block,
        business_type,
        father_name,
        photo_url,
      })
      .select()
      .single();

    if (error) throw error;

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: 'user', gst_id: user.gst_id, district_id: user.district_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Audit log
    await logAudit({
      actorId: user.id,
      actorType: 'user',
      action: 'USER_REGISTERED',
      targetTable: 'users',
      targetId: user.id,
      details: { gst_id: user.gst_id, username: user.username, district: user.district },
      ipAddress: req.ip,
      districtId: user.district_id,
    });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        gst_id: user.gst_id,
        district: user.district,
        block: user.block,
        business_type: user.business_type,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed', details: err.message || err.details || err.hint || JSON.stringify(err) });
  }
};

// ==================== SEND OTP ====================
const requestOTP = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile number required' });

    const otp = generateOTP();
    await sendOTP(mobile, otp);

    res.json({ message: 'OTP sent successfully', debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined });
  } catch (err) {
    console.error('OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// ==================== USER LOGIN ====================
const loginUser = async (req, res) => {
  try {
    const { gst_id, password } = req.body;

    if (!gst_id || !password) {
      return res.status(400).json({ error: 'GST ID and password are required' });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('gst_id', gst_id)
      .single();

    if (error || !user) {
      // Log failed attempt
      await supabase.from('login_attempts').insert({
        identifier: gst_id,
        ip_address: req.ip,
        success: false,
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.is_locked) {
      return res.status(423).json({ error: 'Account is locked due to multiple failed attempts. Contact admin.' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      // Increment failed attempts
      const newAttempts = (user.failed_attempts || 0) + 1;
      const isLocked = newAttempts >= 5;

      await supabase
        .from('users')
        .update({ failed_attempts: newAttempts, is_locked: isLocked })
        .eq('id', user.id);

      await supabase.from('login_attempts').insert({
        identifier: gst_id,
        ip_address: req.ip,
        success: false,
      });

      if (isLocked) {
        return res.status(423).json({ error: 'Account locked after 5 failed attempts. Contact admin.' });
      }

      return res.status(401).json({
        error: 'Invalid credentials',
        attempts_remaining: 5 - newAttempts,
      });
    }

    // Reset failed attempts on successful login
    await supabase
      .from('users')
      .update({ failed_attempts: 0, is_locked: false })
      .eq('id', user.id);

    // Log successful login
    await supabase.from('login_attempts').insert({
      identifier: gst_id,
      ip_address: req.ip,
      success: true,
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: 'user', gst_id: user.gst_id, district_id: user.district_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await logAudit({
      actorId: user.id,
      actorType: 'user',
      action: 'USER_LOGIN',
      targetTable: 'users',
      targetId: user.id,
      details: { username: user.username, district: user.district },
      ipAddress: req.ip,
      districtId: user.district_id,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        gst_id: user.gst_id,
        district: user.district,
        block: user.block,
        business_type: user.business_type,
        photo_url: user.photo_url,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// ==================== ADMIN LOGIN ====================
const loginAdmin = async (req, res) => {
  try {
    const { username, password, passkey } = req.body;

    if (!username || !password || !passkey) {
      return res.status(400).json({ error: 'Username, password, and passkey are required' });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*, districts(name)')
      .eq('username', username)
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify passkey
    if (admin.passkey !== passkey) {
      return res.status(401).json({ error: 'Invalid passkey' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }



    const token = jwt.sign(
      { 
        id: admin.id, 
        role: admin.role, 
        username: admin.username, 
        district_id: admin.district_id,
        district: admin.districts?.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await logAudit({
      actorId: admin.id,
      actorType: admin.role,
      action: 'ADMIN_LOGIN',
      targetTable: 'admins',
      targetId: admin.id,
      details: { username: admin.username, role: admin.role, district: admin.districts?.name },
      ipAddress: req.ip,
      districtId: admin.district_id,
    });

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        district: admin.districts?.name,
        district_id: admin.district_id,
      },
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Admin login failed' });
  }
};

// ==================== FORGOT PASSWORD ====================
const forgotPassword = async (req, res) => {
  try {
    const { gst_id, mobile, otp, new_password } = req.body;

    if (!gst_id || !mobile) {
      return res.status(400).json({ error: 'GST ID and mobile required' });
    }

    // If OTP and new password provided, reset password
    if (otp && new_password) {
      if (!verifyOTP(mobile, otp)) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      const password_hash = await bcrypt.hash(new_password, 10);
      const { error } = await supabase
        .from('users')
        .update({ password_hash, failed_attempts: 0, is_locked: false })
        .eq('gst_id', gst_id)
        .eq('mobile', mobile);

      if (error) throw error;

      return res.json({ message: 'Password reset successful' });
    }

    // Otherwise, verify user exists and send OTP
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('gst_id', gst_id)
      .eq('mobile', mobile)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'No user found with these details' });
    }

    const newOtp = generateOTP();
    await sendOTP(mobile, newOtp);

    res.json({ message: 'OTP sent for password reset', debug_otp: process.env.NODE_ENV === 'development' ? newOtp : undefined });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Password reset failed' });
  }
};

// ==================== GET PROFILE ====================
const getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, gst_id, mobile, district, district_id, block, business_type, father_name, photo_url, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// ==================== GET DISTRICTS ====================
const getDistricts = async (req, res) => {
  try {
    const { data: districts, error } = await supabase
      .from('districts')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json({ districts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
};
// ==================== UPDATE PROFILE ====================
const updateProfile = async (req, res) => {
  try {
    const { username, mobile, father_name, photo_url } = req.body;
    const userId = req.user.id;

    // We only update specific allowed fields
    const { data: user, error } = await supabase
      .from('users')
      .update({ username, mobile, father_name, photo_url })
      .eq('id', userId)
      .select('id, username, gst_id, mobile, district, district_id, block, business_type, father_name, photo_url, created_at, status')
      .single();

    if (error) throw error;

    // Audit log
    await logAudit({
      actorId: userId,
      actorType: 'user',
      action: 'USER_PROFILE_UPDATED',
      targetTable: 'users',
      targetId: userId,
      details: { username, mobile, father_name, has_photo: !!photo_url },
      ipAddress: req.ip,
    });

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  registerUser,
  requestOTP,
  loginUser,
  loginAdmin,
  forgotPassword,
  getProfile,
  updateProfile,
  getDistricts,
};
