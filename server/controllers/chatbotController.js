const { GoogleGenerativeAI } = require("@google/generative-ai");
const { supabase } = require('../config/supabase');


// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

exports.queryChatbot = async (req, res) => {
  try {
    const { message, history } = req.body;
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.status(200).json({
        success: true,
        response: getSmartFallback(message)
      });
    }

    // Try Gemini AI first
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const chat = model.startChat({
        history: history || [],
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const systemPrompt = `You are E-TaxPay AI Assistant, the official helpful and professional bot for Zila Panchayat Uttarakhand.
      
      ### CORE KNOWLEDGE & SERVICES:
      - **Registration**: New users must register using their Username, Mobile Number, GST ID, District, Block, Business Type, and Father's Name. A valid OTP sent to the mobile number is required.
      - **GST ID Format**: Must be 15 characters (e.g., 05AAAAA0000A1Z5).
      - **User Login**: Users login using their registered GST ID and Password. Note: Accounts are locked after 5 failed attempts for security.
      - **Admin Login**: Admins require a Username, Password, and a special Passkey.
      - **Forgot Password**: Users can reset their password using their GST ID, Mobile, and an OTP.
      - **Taxes**: Users can pay monthly and annual Zila Panchayat taxes through their personalized dashboard.
      - **Complaints**: Users can file and track complaints on the landing page or dashboard.
      
      ### PROJECT DETAILS:
      - **Team**: Led by Sumit Bhandari (Senior Designer), Manish Paliwal (Co-Founder), Bhavesh Bisht (Web Designer), and Deepak Bisht (Lead Developer).
      - **Mission**: To modernize tax collection for the Zila Panchayat of Uttarakhand using "E-TaxPay" (English) and "ई-टैक्सपे" (Hindi).
      - **Contact**: Support email is huuuuii947@gmail.com, phone 7983630254.
      
      ### RESPONSE GUIDELINES:
      - **Language**: ALWAYS respond in the same language as the user (English or Hindi). Use professional and polite tone.
      - **Accuracy**: Use the provided context. if someone asks about "how to login", explain the GST ID and password requirement.
      - **Conciseness**: Keep answers clear and informative but not overly long.
      - **Fallback**: If you are unsure, politely ask them to contact support at huuuuii947@gmail.com.
      
      User Query: ${message}`;

      const result = await chat.sendMessage(systemPrompt);
      const response = await result.response;
      const text = response.text();

      // Save to Supabase (Async)
      if (req.user && req.user.id) {
        supabase.from('chat_history').insert({ user_id: req.user.id, role: 'user', content: message }).then(() => {});
        supabase.from('chat_history').insert({ user_id: req.user.id, role: 'model', content: text }).then(() => {});
      }

      return res.status(200).json({ success: true, response: text });
    } catch (aiError) {
      console.error("Gemini AI Error (falling back to smart responses):", aiError.message);
      // Fall back to keyword-based responses
      return res.status(200).json({
        success: true,
        response: getSmartFallback(message)
      });
    }
  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to connect to AI assistant.",
      error: error.message
    });
  }
};

// Smart keyword-based fallback when Gemini AI is unavailable
function getSmartFallback(message) {
  const msg = message.toLowerCase();
  
  // Hindi greetings
  if (msg.match(/namaste|namaskar|नमस्ते|नमस्कार/)) {
    return "🙏 नमस्ते! मैं E-TaxPay AI Assistant हूँ। मैं आपकी कैसे मदद कर सकता हूँ? आप मुझसे टैक्स, रजिस्ट्रेशन, शिकायत या लॉगिन के बारे में पूछ सकते हैं।";
  }
  // English greetings
  if (msg.match(/hello|hi|hey|good morning|good evening/)) {
    return "👋 Hello! I'm the E-TaxPay AI Assistant for Zila Panchayat Uttarakhand. How can I help you today? You can ask me about taxes, registration, complaints, or login.";
  }
  // Registration
  if (msg.match(/register|registration|sign up|signup|रजिस्ट्रेशन|रजिस्टर/)) {
    return "📝 Registration Process:\n\nTo register on E-TaxPay, you need:\n- Username\n- Mobile Number (for OTP verification)\n- GST ID (15 characters, e.g., 05AAAAA0000A1Z5)\n- District & Block\n- Business Type\n- Father's Name\n\nVisit the Register page and fill in your details. An OTP will be sent to your mobile for verification.";
  }
  // Login
  if (msg.match(/login|log in|sign in|signin|लॉगिन|लॉग इन/)) {
    return "🔐 Login Information:\n\n- Users: Login with your registered GST ID and Password.\n- Admins: Login requires Username, Password, and a special Passkey.\n\n⚠️ Note: Accounts are locked after 5 failed attempts for security.\n\nIf you forgot your password, use the Forgot Password option with your GST ID, Mobile, and OTP.";
  }
  // Tax
  if (msg.match(/tax|payment|pay|टैक्स|भुगतान|कर/)) {
    return "💰 Tax Payment:\n\nYou can pay your Zila Panchayat taxes through your personalized dashboard:\n- Monthly taxes\n- Annual taxes\n\nPayments are processed securely through Razorpay. Login to your dashboard to view and pay pending taxes.";
  }
  // Complaint
  if (msg.match(/complaint|grievance|शिकायत|समस्या|problem|issue/)) {
    return "📋 Filing a Complaint:\n\nYou can file complaints through:\n1. The Grievance Cell section on the landing page\n2. Your personal Dashboard after login\n\nProvide your name, mobile, subject, description, and select your district. You can track your complaint status from your dashboard.";
  }
  // Password
  if (msg.match(/password|forgot|reset|पासवर्ड|भूल/)) {
    return "🔑 Forgot Password:\n\nTo reset your password:\n1. Click on Forgot Password\n2. Enter your GST ID and Mobile Number\n3. Verify with the OTP sent to your mobile\n4. Set a new password\n\nIf you face issues, contact support at huuuuii947@gmail.com";
  }
  // GST
  if (msg.match(/gst|gst id|जीएसटी/)) {
    return "🆔 GST ID Format:\n\nYour GST ID must be exactly 15 characters long.\nExample: `05AAAAA0000A1Z5`\n\nThis is required for registration and login. Make sure to enter it correctly!";
  }
  // Contact
  if (msg.match(/contact|support|help|email|phone|संपर्क|मदद|सहायता/)) {
    return "📞 Contact Support:\n\n- 📧 Email: huuuuii947@gmail.com\n- 📱 Phone: 7983630254\n\nOur team is available to help you with any issues related to E-TaxPay.";
  }
  // Team
  if (msg.match(/team|developer|who made|किसने बनाया|टीम/)) {
    return "👨‍💻 E-TaxPay Team:\n\n- Sumit Bhandari - Senior Designer\n- Manish Paliwal - Co-Founder\n- Bhavesh Bisht - Web Designer\n- Deepak Bisht - Lead Developer\n\nOur mission is to modernize tax collection for Zila Panchayat Uttarakhand! 🚀";
  }
  // About
  if (msg.match(/about|what is|kya hai|क्या है|बताओ/)) {
    return "ℹ️ About E-TaxPay:\n\nE-TaxPay (ई-टैक्सपे) is the official digital tax collection platform for Zila Panchayat Uttarakhand. It allows citizens to:\n- Register and manage their tax accounts\n- Pay monthly and annual taxes online\n- File and track complaints\n- Access 24/7 digital services\n\nAll 13 districts of Uttarakhand are covered! 🏔️";
  }
  // Hindi queries
  if (msg.match(/kaise|कैसे|kya|क्या|kab|कब|kaha|कहाँ/)) {
    return "🙏 मैं E-TaxPay AI Assistant हूँ। आप मुझसे इन विषयों पर पूछ सकते हैं:\n\n• रजिस्ट्रेशन कैसे करें\n• लॉगिन कैसे करें\n• टैक्स कैसे भरें\n• शिकायत कैसे दर्ज करें\n• पासवर्ड कैसे रिसेट करें\n\nकृपया अपना सवाल विस्तार से पूछें! 😊";
  }
  // Default fallback
  return "🤖 I'm the E-TaxPay Assistant! I can help you with:\n\n• 📝 Registration\n• 🔐 Login & Password\n• 💰 Tax Payments\n• 📋 Complaints\n• 📞 Contact Support\n\nPlease ask about any of these topics, or contact us at huuuuii947@gmail.com for further assistance!";
}

exports.getChatHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('role, content, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formattedHistory = data.map(item => ({
      role: item.role === 'model' ? 'bot' : 'user',
      text: item.content
    }));

    res.json({ success: true, history: formattedHistory });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
  }
};

exports.clearChatHistory = async (req, res) => {
  try {
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ success: false, message: 'Failed to clear chat history' });
  }
};

