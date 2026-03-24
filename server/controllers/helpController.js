const { sendEmail } = require('../utils/mailer');
const { supabase } = require('../config/supabase');

const submitHelpRequest = async (req, res) => {
  console.log('[HelpSubmit] Received new request');
  try {
    const { name, email, mobile, message } = req.body;

    if (!name || !email || !message) {
      console.log('[HelpSubmit] Validation failed: Missing required fields');
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // 1. Save to database
    console.log('[HelpSubmit] Attempting to save to Supabase...');
    try {
      const { data: request, error: dbError } = await supabase
        .from('help_requests')
        .insert({ name, email, mobile, message })
        .select()
        .single();

      if (dbError) {
        console.warn('[HelpSubmit] Database save failed:', dbError.message);
      } else {
        console.log('[HelpSubmit] Database save successful');
      }
    } catch (dbErr) {
      console.error('[HelpSubmit] Unexpected Database Error:', dbErr.message);
    }

    // 2. Send email to admin (Moving to background to prevent frontend hang)
    console.log('[HelpSubmit] Triggering background email...');
    sendEmail({
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
    }).then(result => {
      if (result.success) console.log('[HelpSubmit] Background email sent successfully');
      else console.error('[HelpSubmit] Background email failed:', result.error);
    }).catch(err => {
      console.error('[HelpSubmit] Unexpected Background Email Error:', err.message);
    });

    console.log('[HelpSubmit] Sending immediate success response to user');
    res.status(201).json({ 
      message: 'Help request submitted successfully',
      note: 'Notification email is being processed'
    });
  } catch (err) {
    console.error('[HelpSubmit] Global Controller Error:', err);
    res.status(500).json({ error: 'Failed to process help request' });
  }
};

module.exports = { submitHelpRequest };
