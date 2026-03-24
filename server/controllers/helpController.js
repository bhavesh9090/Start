const { sendEmail } = require('../utils/mailer');
const { supabase } = require('../config/supabase');

const submitHelpRequest = async (req, res) => {
  try {
    const { name, email, mobile, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // 1. Save to database (optional but recommended for record keeping)
    const { data: request, error: dbError } = await supabase
      .from('help_requests')
      .insert({ name, email, mobile, message })
      .select()
      .single();

    // If table doesn't exist, we'll log it but proceed with email
    if (dbError) {
      console.warn('Database save failed (table might not exist):', dbError.message);
    }

    // 2. Send email to admin
    const emailResult = await sendEmail({
      to: 'huuuuii947@gmail.com',
      subject: `New Help Request from ${name}`,
      text: `
        New Help Request via Website:
        
        Name: ${name}
        Email: ${email}
        Mobile: ${mobile || 'Not provided'}
        
        Message:
        ${message}
      `,
      html: `
        <h3>New Help Request via Website</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mobile:</strong> ${mobile || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      `,
    });

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
      // We still return 201 if DB saved, but with a warning
      return res.status(201).json({ 
        message: 'Request received, but email notification failed', 
        warning: 'Email service not configured' 
      });
    }

    res.status(201).json({ message: 'Help request submitted successfully' });
  } catch (err) {
    console.error('Help request error:', err);
    res.status(500).json({ error: 'Failed to process help request' });
  }
};

module.exports = { submitHelpRequest };
