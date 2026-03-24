import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMessageCircle, FiX, FiSend, FiHelpCircle, FiRotateCcw, FiSmile, FiZap, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';


// Modern Robot Icon as a component for reuse
const RobotIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

export default function ChatBot() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Namaste! I am Monal, your E-TaxPay assistant. How can I help you today?", type: 'text' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Load History from Supabase on Mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || '/api';
    if (token && isOpen) {
      fetch(`${API_URL}/chatbot/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.history.length > 0) {
          setMessages([
            { sender: 'bot', text: "Namaste! I am Monal, your E-TaxPay assistant. How can I help you today?", type: 'text' },
            ...data.history
          ]);
          const geminiHistory = data.history.map(m => ({
            role: m.role === 'bot' ? 'model' : 'user',
            parts: [{ text: m.text }]
          }));
          setChatHistory(geminiHistory);
        }
      })
      .catch(err => console.error('Failed to load chat history:', err));
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Scroll detection for "scroll to bottom" button
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const addEmoji = (e) => {
    setInput(prev => prev + e.emoji);
    inputRef.current?.focus();
  };

  const handleQuickQuery = (queryKey) => {
    const userMessage = t(`chatbot.${queryKey}Query`);
    const botResponse = t(`chatbot.${queryKey}Response`);
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: userMessage, type: 'text' },
      { sender: 'bot', text: botResponse, type: 'text' }
    ]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText, type: 'text' }]);
    setInput('');
    setShowEmojiPicker(false);
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/chatbot/query`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ message: userText, history: chatHistory }),
      });
      const data = await response.json();
      if (data.success) {
        const botResponse = data.response;
        setMessages(prev => [...prev, { sender: 'bot', text: botResponse, type: 'text' }]);
        setChatHistory(prev => [
          ...prev,
          { role: 'user', parts: [{ text: userText }] },
          { role: 'model', parts: [{ text: botResponse }] }
        ]);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('AI Chat Error:', err);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: "I'm having trouble connecting. Please try again in a moment! 🔄", 
        type: 'text' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    setShowConfirmReset(false);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/chatbot/history`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      setMessages([{ sender: 'bot', text: "Namaste! I am Monal, your E-TaxPay assistant. How can I help you today?", type: 'text' }]);
      setChatHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans">
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => { setIsOpen(!isOpen); setShowEmojiPicker(false); }}
        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? 'bg-gradient-to-br from-red-500 to-red-600' 
            : 'bg-gradient-to-br from-red-500 to-green-500'
        } text-white`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 0 : 0 }}
      >
        <RobotIcon className="w-7 h-7" />
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed bottom-20 right-4 left-4 sm:left-auto sm:right-0 w-auto sm:w-[420px] h-[500px] sm:h-[600px] sm:max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 z-[100]"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-green-600 p-4 text-white flex items-center justify-between flex-shrink-0 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                <RobotIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Monal AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-[10px] text-white/70 uppercase font-bold tracking-widest">Online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 relative z-10">
              <button 
                onClick={() => setShowConfirmReset(true)}
                title="Reset Chat"
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <FiRotateCcw className="w-4 h-4 text-white/80" />
              </button>
              <button 
                onClick={() => { setIsOpen(false); setShowEmojiPicker(false); }}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors sm:hidden"
              >
                <FiX className="w-5 h-5 text-white/80" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef} 
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/80 to-white relative"
            style={{ 
              backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(239,68,68,0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          >
            {messages.map((m, i) => (
              <motion.div 
                key={i} 
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-green-500 rounded-lg flex items-center justify-center mr-2 mt-1 flex-shrink-0 shadow-sm">
                    <RobotIcon className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                  m.sender === 'user' 
                    ? 'bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl rounded-tr-md shadow-md shadow-red-500/15' 
                    : 'bg-white text-gray-700 rounded-2xl rounded-tl-md border border-gray-100 shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={`text-[9px] mt-1.5 ${m.sender === 'user' ? 'text-white/50 text-right' : 'text-gray-300'}`}>
                    {formatTime()}
                  </p>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div 
                className="flex justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-green-500 rounded-lg flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <RobotIcon className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-md border border-gray-100 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            
            {/* Quick Suggestions */}
            {messages.length <= 2 && (
              <div className="pt-3 flex flex-wrap gap-2">
                {['tax', 'complaint', 'team', 'contact'].map((key) => (
                  <motion.button
                    key={key}
                    onClick={() => handleQuickQuery(key)}
                    className="px-3.5 py-2 bg-white border border-red-100 text-red-600 rounded-xl text-[11px] font-semibold hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiHelpCircle className="w-3 h-3" />
                    {t(`chatbot.${key}Query`)}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                onClick={scrollToBottom}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white shadow-lg border border-gray-200 rounded-full p-2 z-20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <FiChevronDown className="w-4 h-4 text-gray-500" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* New Chat Confirmation Overlay */}
          <AnimatePresence>
          {showConfirmReset && (
            <motion.div 
              className="absolute inset-x-0 bottom-[73px] bg-white/95 backdrop-blur-md border-t border-red-100 p-4 z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="text-center">
                <p className="text-xs font-bold text-gray-700 mb-3">Clear conversation history?</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleNewChat}
                    className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all shadow-sm"
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Emoji Picker */}
          <AnimatePresence>
          {showEmojiPicker && (
            <motion.div 
              className="absolute bottom-[4.5rem] left-2 right-2 sm:left-4 sm:right-auto z-50 shadow-2xl rounded-xl overflow-hidden border border-gray-100 w-[calc(100%-1rem)] sm:w-[320px]"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
            >
              <EmojiPicker 
                onEmojiClick={addEmoji} 
                theme="light"
                suggestedEmojisMode="recent"
                skinTonesDisabled
                searchPlaceHolder={t('admin.search') || "Search emoji..."}
                height={320}
                width="100%"
              />
            </motion.div>
          )}
          </AnimatePresence>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-gray-100 flex gap-2.5 items-center flex-shrink-0">
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${showEmojiPicker ? 'bg-red-50 text-red-500 scale-110' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
            >
              <FiSmile className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chatbot.placeholder')}
              className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-300 transition-all placeholder-gray-400"
            />
            <motion.button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center transition-all shadow-md ${
                input.trim() && !isLoading
                  ? 'bg-gradient-to-br from-red-500 to-green-500 text-white shadow-red-500/20 hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed'
              }`}
              whileHover={input.trim() ? { scale: 1.05 } : {}}
              whileTap={input.trim() ? { scale: 0.95 } : {}}
            >
              <FiSend className="w-4 h-4" />
            </motion.button>
          </form>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
