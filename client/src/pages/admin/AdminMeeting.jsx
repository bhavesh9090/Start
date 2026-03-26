import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { FiSend, FiUsers, FiMessageSquare, FiSearch, FiCircle, FiHash, FiMoreVertical, FiPaperclip, FiSmile, FiTrash2, FiFile, FiDownload, FiX, FiEdit2, FiArrowLeft, FiImage, FiBell, FiInfo, FiChevronRight, FiCornerUpLeft } from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import EmojiPicker from 'emoji-picker-react';

export default function AdminMeeting() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null); // null for General/Group Chat
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [mediaOnly, setMediaOnly] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);


  useEffect(() => {
    fetchAdmins();
    fetchChatSummaries();
    const messageSub = subscribeToMessages();
    const adminSub = subscribeToAdmins();
    return () => {
      supabase.removeChannel(messageSub);
      supabase.removeChannel(adminSub);
    };
  }, [selectedAdmin]);

  useEffect(() => {
    fetchMessages();
    if (selectedAdmin) {
      markAsRead(selectedAdmin.id);
    }
  }, [selectedAdmin]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchAdmins = async () => {
    try {
      // Fetch admins and join with districts table to get the name
      const { data, error } = await supabase
        .from('admins')
        .select(`
          id, 
          username, 
          district_id,
          photo_url,
          districts (name)
        `)
        .neq('id', user.id);

      if (error) throw error;
      
      // Map the data to a friendlier format
      const mappedAdmins = data.map(adm => ({
        id: adm.id,
        name: adm.username,
        district: adm.districts?.name || 'Uttarakhand',
        photo_url: adm.photo_url 
      }));

      setAdmins(mappedAdmins);
    } catch (err) {
      console.error('Error fetching admins:', err);
    }
  };

  const fetchChatSummaries = async () => {
    try {
      // Get unread counts
      const { data: unreadData } = await supabase
        .from('admin_messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      const counts = {};
      unreadData?.forEach(msg => {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
      });
      setUnreadCounts(counts);

      // Get last message timestamps for sorting
      const { data: recentMsgs } = await supabase
        .from('admin_messages')
        .select('sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      const lasts = {};
      recentMsgs?.forEach(msg => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (otherId && !lasts[otherId]) {
          lasts[otherId] = msg.created_at;
        }
      });
      setLastMessages(lasts);
    } catch (err) {
      console.error('Error fetching summaries:', err);
    }
  };

  const markAsRead = async (senderId) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', senderId)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCounts(prev => ({ ...prev, [senderId]: 0 }));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_messages')
        .select(`
          *, 
          sender:admins!sender_id(id, username),
          reply_to:reply_to_id(id, content, sender_id, file_url, file_name)
        `);

      if (selectedAdmin) {
        // Private Chat: (A->B OR B->A)
        query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedAdmin.id}),and(sender_id.eq.${selectedAdmin.id},receiver_id.eq.${user.id})`);
      } else {
        // Group Chat: receiver_id is NULL
        query = query.is('receiver_id', null);
      }

      const { data, error } = await query
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      
      // Map sender info for consistency
      const formattedMessages = (data || []).map(msg => ({
        ...msg,
        sender: {
          name: msg.sender?.username,
          district: msg.sender?.districts?.name,
          photo_url: null
        }
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('admin-meeting-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'admin_messages' 
      }, async (payload) => {
        const newMessage = payload.new;
        
        // Check if message belongs to current view
        const isGroupMsg = !newMessage.receiver_id && !selectedAdmin;
        const isRelevantPrivate = selectedAdmin && (
          (newMessage.sender_id === user.id && newMessage.receiver_id === selectedAdmin.id) ||
          (newMessage.sender_id === selectedAdmin.id && newMessage.receiver_id === user.id)
        );

        if (isGroupMsg || isRelevantPrivate) {
          // Fetch sender details from admins table joining with districts
          const { data: rawMsgData } = await supabase
            .from('admin_messages')
            .select(`
              *, 
              sender:admins!sender_id(id, username),
              reply_to:reply_to_id(id, content, sender_id, file_url, file_name)
            `)
            .eq('id', newMessage.id)
            .single();
          
          setMessages(prev => [...prev, { 
            ...rawMsgData, 
            sender: {
              name: rawMsgData.sender?.username,
              district: rawMsgData.sender?.districts?.name,
              photo_url: null
            } 
          }]);

          // Update last message time for sorting
          const otherId = newMessage.sender_id === user.id ? newMessage.receiver_id : newMessage.sender_id;
          if (otherId) {
            setLastMessages(prev => ({ ...prev, [otherId]: newMessage.created_at }));
          }

          // Update unread counts
          if (newMessage.receiver_id === user.id && (!selectedAdmin || selectedAdmin.id !== newMessage.sender_id)) {
            setUnreadCounts(prev => ({ ...prev, [newMessage.sender_id]: (prev[newMessage.sender_id] || 0) + 1 }));
            // Play notification sound or show toast
            if (!isMuted) showToast(`New message from ${rawMsgData.sender?.username}`, 'info');
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'admin_messages'
      }, (payload) => {
        setMessages(prev => prev.map(msg => msg.id === payload.new.id ? { ...msg, ...payload.new } : msg));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'admin_messages'
      }, (payload) => {
        setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
      })
      .subscribe();

    return channel;
  };

  const subscribeToAdmins = () => {
    const channel = supabase
      .channel('admin-profile-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'admins'
      }, (payload) => {
        setAdmins(prev => prev.map(adm => 
          adm.id === payload.new.id 
            ? { ...adm, name: payload.new.username, photo_url: payload.new.photo_url } 
            : adm
        ));
      })
      .subscribe();
    return channel;
  };

  const uploadFile = async (file) => {
    try {
      // Check file size (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File is too large (max 5MB)');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `chat-files/${fileName}`;

      // Ensure storage library is handled gracefully
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('admin-chat-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase Upload Error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message || 'Check storage permissions'}`);
      }

      const { data } = supabase.storage
        .from('admin-chat-files')
        .getPublicUrl(filePath);

      return { url: data.publicUrl, name: file.name };
    } catch (err) {
      console.error('Final Upload Catch:', err);
      showToast(err.message || 'File upload failed', 'error');
      return null;
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;
    if (sending || uploading) return;

    setSending(true);
    try {
      if (editingMessage) {
        // Handle Edit
        const { error } = await supabase
          .from('admin_messages')
          .update({ 
            content: newMessage.trim(),
            is_edited: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMessage.id)
          .eq('sender_id', user.id);

        if (error) throw error;
        setEditingMessage(null);
        showToast(t('admin.msgUpdated'), 'success');
      } else {
        // Handle New Message
        let fileData = null;
        if (file) {
          setUploading(true);
          fileData = await uploadFile(file);
          setUploading(false);
          if (!fileData) { setSending(false); return; }
        }

        const { error } = await supabase
          .from('admin_messages')
          .insert([{
            sender_id: user.id,
            receiver_id: selectedAdmin ? selectedAdmin.id : null,
            content: newMessage.trim(),
            file_url: fileData?.url || null,
            file_name: fileData?.name || null,
            reply_to_id: replyingTo?.id || null
          }]);

        if (error) throw error;
      }
      
      setNewMessage('');
      setFile(null);
      setReplyingTo(null);
      setShowEmojiPicker(false);
    } catch (err) {
      console.error('Error sending message:', err);
      showToast(err.message || 'Failed to send message', 'error');
    }
    setSending(false);
  };

  const startEditing = (msg) => {
    setEditingMessage(msg);
    setNewMessage(msg.content);
    setShowEmojiPicker(false);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const handleAdminSelect = (adm) => {
    setSelectedAdmin(adm);
    if (window.innerWidth < 768) {
      setShowMobileChat(true);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState({ show: false, type: 'single', msgId: null });

  const deleteMessage = async (msgId) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .delete()
        .eq('id', msgId)
        .eq('sender_id', user.id);

      if (error) throw error;
      showToast(t('admin.msgDeleted'), 'success');
    } catch (err) {
      showToast('Failed to delete message', 'error');
    }
    setShowDeleteModal({ show: false, type: 'single', msgId: null });
  };

  const clearChat = async () => {
    try {
      let query = supabase.from('admin_messages').delete();
      
      if (selectedAdmin) {
        // Clear Private Chat between these two
        query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedAdmin.id}),and(sender_id.eq.${selectedAdmin.id},receiver_id.eq.${user.id})`);
      } else {
        // Clear Group Chat (General Room)
        query = query.is('receiver_id', null);
      }

      const { error } = await query;
      if (error) throw error;
      
      setMessages([]);
      showToast(t('admin.chatCleared'), 'success');
    } catch (err) {
      console.error('Clear chat error:', err);
      showToast('Failed to clear chat', 'error');
    }
    setShowDeleteModal({ show: false, type: 'all', msgId: null });
  };

  const addEmoji = (e) => {
    setNewMessage(prev => prev + e.emoji);
  };

  const scrollToMessage = (msgId) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-4', 'ring-emerald-400', 'ring-opacity-50', 'transition-all', 'duration-1000');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-emerald-400', 'ring-opacity-50');
      }, 2000);
    }
  };


  const filteredAdmins = admins
    .filter(a => 
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.district?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = new Date(lastMessages[a.id] || 0).getTime();
      const timeB = new Date(lastMessages[b.id] || 0).getTime();
      return timeB - timeA;
    });

  const toggleMute = () => {
    setIsMuted(!isMuted);
    showToast(isMuted ? t('admin.roomUnmuted') : t('admin.roomMuted'), 'success');
    setShowMoreMenu(false);
  };

  const filteredMessages = messages.filter(msg => {
    if (mediaOnly) return !!msg.file_url;
    return true;
  });

  return (
    <div className="h-screen mountain-bg pt-16 md:pt-20 pb-0 md:pb-6 px-0 md:px-4 flex flex-col overflow-hidden">
      {/* Custom Confirmation Modal */}
      {showDeleteModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-white animate-scale-in">
            <div className="w-16 h-16 bg-maroon-50 text-maroon-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <FiTrash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-center text-gray-900 mb-2">{t('admin.deleteConfirm')}</h3>
            <p className="text-gray-500 text-center text-sm font-bold mb-8">
              {showDeleteModal.type === 'single' ? t('admin.deleteDesc') : t('admin.clearDesc')}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteModal({ show: false, type: 'single', msgId: null })}
                className="flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black transition-all"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={() => showDeleteModal.type === 'single' ? deleteMessage(showDeleteModal.msgId) : clearChat()}
                className="flex-1 py-4 px-6 bg-maroon-600 hover:bg-maroon-700 text-white rounded-2xl font-black shadow-lg shadow-maroon-200 transition-all"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* District Profile Info Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3rem] p-1 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="relative h-40 rounded-[2.5rem] bg-gradient-to-br from-maroon-600 to-indigo-800 p-8 flex items-end overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
               <button onClick={() => setShowProfileModal(false)} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"><FiX /></button>
               <div className="relative z-10 flex items-center gap-4">
                 <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-4xl font-black text-white shadow-xl">
                   {selectedAdmin ? selectedAdmin.name?.charAt(0) : 'G'}
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-white">{selectedAdmin ? selectedAdmin.name : t('admin.generalRoom')}</h2>
                   <p className="text-white/70 font-bold uppercase tracking-widest text-[10px]">{selectedAdmin ? selectedAdmin.district : 'Administrative Hub'}</p>
                 </div>
               </div>
            </div>
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-4 text-center">
                 <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                   <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{t('adminPanel.status.all')}</p>
                   <p className="text-xs font-black text-forest-600">Active Now</p>
                 </div>
                 <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                   <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{t('admin.profile.memberSince')}</p>
                   <p className="text-xs font-black text-gray-800">2024</p>
                 </div>
               </div>
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group" onClick={toggleMute}>
                   <div className="flex items-center gap-4">
                     <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><FiBell /></div>
                     <p className="text-xs font-bold text-gray-700">{t('admin.muteNotif')}</p>
                   </div>
                   <div className={`w-10 h-5 rounded-full transition-all relative ${isMuted ? 'bg-maroon-600' : 'bg-gray-200'}`}>
                     <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isMuted ? 'left-6' : 'left-1'}`}></div>
                   </div>
                 </div>
                 <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group" onClick={() => { setMediaOnly(true); setShowProfileModal(false); }}>
                   <div className="flex items-center gap-4">
                     <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><FiImage /></div>
                     <p className="text-xs font-bold text-gray-700">{t('admin.mediaFiles')}</p>
                   </div>
                   <FiChevronRight className="text-gray-300 group-hover:text-gray-600 transition-all" />
                 </div>
               </div>
               <button onClick={() => setShowProfileModal(false)} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-sm shadow-xl shadow-gray-200 active:scale-95 transition-all">{t('admin.closeProfile')}</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full flex-1 flex md:gap-6 animate-fade-in relative overflow-hidden h-full md:h-[calc(100vh-120px)]">
        
        {/* Sidebar */}
        <div className={`${showMobileChat ? 'hidden' : 'flex'} md:flex w-full md:w-80 bg-white/80 backdrop-blur-xl md:rounded-[2.5rem] shadow-xl md:border border-white/50 flex-col overflow-hidden`}>
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <FiMessageSquare className="w-5 h-5" />
              </div>
              {t('admin.meeting')}
            </h2>
            <div className="relative mt-4">
              <input 
                type="text" 
                placeholder={t('admin.searchAdmins')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl py-3 pr-4 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all shadow-inner"
                style={{ paddingLeft: '3rem' }}
              />
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {/* General Room */}
            <button 
              onClick={() => handleAdminSelect(null)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${!selectedAdmin ? 'bg-emerald-600 text-white shadow-[0_8px_30px_rgb(16,185,129,0.3)]' : 'hover:bg-gray-50 text-gray-600'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${!selectedAdmin ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'}`}>
                <FiHash className="w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <p className="font-black text-sm tracking-tight">{t('admin.generalRoom')}</p>
                <p className={`text-[10px] font-bold ${!selectedAdmin ? 'text-emerald-100' : 'text-gray-400'}`}>{t('admin.districtsChat')}</p>
              </div>

            </button>

            <div className="pt-4 pb-2 px-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.districtAdmins')}</p>
            </div>

            {filteredAdmins.map((adm) => {
              const unreadCount = unreadCounts[adm.id] || 0;
              return (
                <button 
                  key={adm.id}
                  onClick={() => handleAdminSelect(adm)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative ${selectedAdmin?.id === adm.id ? 'bg-emerald-50 text-emerald-900 border-r-4 border-emerald-500' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                  <div className="relative">
                    {adm.photo_url ? (
                      <img src={adm.photo_url} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border-2 border-white shadow-sm ${selectedAdmin?.id === adm.id ? 'bg-emerald-200 text-emerald-800' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'}`}>
                        {adm.name?.charAt(0)}
                      </div>
                    )}
                    <FiCircle className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${unreadCount > 0 ? 'fill-orange-500 text-white animate-pulse' : 'fill-emerald-500 text-white'} border-2 border-white rounded-full`} />
                  </div>
                  <div className="text-left overflow-hidden flex-1">
                    <p className={`font-black text-sm tracking-tight truncate ${selectedAdmin?.id === adm.id ? 'text-emerald-900' : 'text-gray-800'}`}>{adm.name}</p>
                    <p className={`text-[10px] font-bold uppercase ${selectedAdmin?.id === adm.id ? 'text-emerald-600' : 'text-gray-400'}`}>{adm.district}</p>
                  </div>
                  {unreadCount > 0 && (
                    <div className="w-5 h-5 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      {unreadCount}
                    </div>
                  )}

                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`${showMobileChat ? 'flex' : 'hidden'} md:flex flex-1 bg-white/80 backdrop-blur-xl md:rounded-[2.5rem] shadow-xl border-x md:border border-white/50 flex-col overflow-hidden relative`}>
          
          {/* Header */}
          <div className="p-3 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Back button for mobile */}
              <button 
                onClick={() => setShowMobileChat(false)}
                className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>

              <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-sm border-2 border-white ${selectedAdmin ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {selectedAdmin ? <FiMessageSquare className="w-4 h-4 md:w-5 md:h-5" /> : <FiUsers className="w-4 h-4 md:w-5 md:h-5" />}
              </div>
              <div>
                <h3 className="text-xs md:text-xl font-black text-gray-900 tracking-tight truncate max-w-[120px] md:max-w-none">
                  {selectedAdmin ? selectedAdmin.name : t('admin.generalRoom')}
                </h3>
                <p className="text-[8px] md:text-xs text-emerald-600 font-bold flex items-center gap-1.5 lowercase">
                  <span className={`w-1.5 h-1.5 rounded-full ${isMuted ? 'bg-gray-400' : 'bg-emerald-500 animate-pulse'}`}></span>
                  {isMuted ? 'Silently active' : selectedAdmin ? `${selectedAdmin.district} Admin • online` : '13 administrators active'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 relative">
              {mediaOnly && (
                <button 
                  onClick={() => setMediaOnly(false)}
                  className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1"
                >
                  {t('admin.mediaView')} <FiX />
                </button>
              )}
              {isMuted && <FiBell className="w-5 h-5 text-gray-400 mr-2" />}
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all ${showMoreMenu ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                <FiMoreVertical className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Header More Options Menu */}
              {showMoreMenu && (
                <div className="absolute top-16 right-0 w-64 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-100 z-[60] overflow-hidden animate-scale-in">
                   <div className="p-4 space-y-1">
                      <button onClick={() => { setShowProfileModal(true); setShowMoreMenu(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all text-left group">
                         <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><FiInfo /></div>
                         <div className="flex-1">
                            <p className="text-xs font-black text-gray-800">{t('admin.viewInfo')}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{t('admin.profileDetails')}</p>
                         </div>
                      </button>
                      <button onClick={() => { setMediaOnly(true); setShowMoreMenu(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all text-left group">
                         <div className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform"><FiImage /></div>
                         <div className="flex-1">
                            <p className="text-xs font-black text-gray-800">{t('admin.mediaFiles')}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{t('admin.viewAttachments')}</p>
                         </div>
                      </button>
                      <button onClick={toggleMute} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all text-left group">
                         <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${isMuted ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                           <FiBell />
                         </div>
                         <div className="flex-1">
                            <p className="text-xs font-black text-gray-800">{isMuted ? t('admin.unmuteNotif') : t('admin.muteNotif')}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{t('admin.alertPrefs')}</p>
                         </div>
                      </button>
                      <div className="h-px bg-gray-50 my-2 mx-4"></div>
                      <button onClick={() => { setShowDeleteModal({ show: true, type: 'all', msgId: null }); setShowMoreMenu(false); }} className="w-full flex items-center gap-4 p-4 hover:bg-maroon-50 rounded-2xl transition-all text-left group">
                         <div className="p-2 bg-maroon-50 text-maroon-600 rounded-xl group-hover:scale-110 transition-transform"><FiTrash2 /></div>
                         <div className="flex-1">
                            <p className="text-xs font-black text-maroon-600">{t('admin.clearRoom')}</p>
                            <p className="text-[8px] font-bold text-maroon-400 uppercase tracking-tighter">{t('admin.dangerZone')}</p>
                         </div>
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Messages Wrapper */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 custom-scrollbar bg-[#f0f2f5] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron-500"></div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-30">
                <FiMessageSquare className="w-16 h-16 mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">
                  {mediaOnly ? t('admin.noMedia') : t('admin.noMessages')}
                </p>
              </div>
            ) : (
              filteredMessages.map((msg, i) => {
                const isOwn = msg.sender_id === user.id;
                return (
                  <div id={`msg-${msg.id}`} key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-in-up group`}>
                    <div className={`flex gap-2 md:gap-3 max-w-[90%] md:max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {!isOwn && (
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-saffron-100 flex-shrink-0 flex items-center justify-center text-[9px] md:text-[10px] font-black text-saffron-600">
                          {msg.sender?.name?.charAt(0)}
                        </div>
                      )}
                      <div className="space-y-1 relative">
                        {!isOwn && <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase ml-1 md:ml-2 tracking-tighter">{msg.sender?.name} ({msg.sender?.district})</p>}
                        
                        <div className={`p-2.5 md:p-4 shadow-sm ${isOwn ? 'bg-emerald-600 text-white rounded-[1.25rem] rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-[1.25rem] rounded-tl-sm'}`}>
                          {/* Reply Context */}
                          {(() => {
                            const reply = Array.isArray(msg.reply_to) ? msg.reply_to[0] : msg.reply_to;
                            if (!reply || !reply.id) return null;
                            
                            const sid = reply.sender_id;
                            let sname = 'Admin';
                            if (sid === user.id) {
                              sname = t('common.you') || 'You';
                            } else {
                              const foundAdmin = admins?.find(a => a.id === sid);
                              sname = foundAdmin ? (foundAdmin.name || foundAdmin.username) : 'Admin';
                            }

                            const rContent = reply.content || (reply.file_url ? (reply.file_name || 'Attachment') : '...');
                            
                            return (
                              <div 
                                onClick={(e) => { e.stopPropagation(); scrollToMessage(reply.id); }}
                                className={`mb-2 p-2 rounded-lg border-l-2 cursor-pointer transition-all hover:bg-black/10 ${
                                  isOwn 
                                    ? 'bg-white/20 border-white/60' 
                                    : 'bg-gray-100/90 border-gray-400 text-gray-800'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className={`text-[10px] font-bold mb-0.5 ${isOwn ? 'text-white' : 'text-emerald-700'}`}>
                                    {sname}
                                  </span>
                                  <span className={`text-[12px] font-medium leading-tight ${isOwn ? 'text-white/90' : 'text-gray-700'} line-clamp-2`}>
                                    {rContent}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {msg.content && <p className="text-[13px] md:text-sm font-medium leading-relaxed mb-0.5 md:mb-2">{msg.content}</p>}
                          
                          {/* File Attachment */}
                          {msg.file_url && (
                             <div className={`mt-2 p-2 md:p-3 rounded-xl border ${isOwn ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-100'}`}>
                             {msg.file_name?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                               <img src={msg.file_url} alt="attachment" className="max-w-xs rounded-lg shadow-sm mb-2 cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => window.open(msg.file_url, '_blank')} />
                             ) : (
                               <div className="flex items-center gap-3">
                                 <div className="p-2 bg-saffron-100 text-saffron-600 rounded-lg">
                                   <FiFile className="w-4 h-4 md:w-5 md:h-5" />
                                 </div>
                                 <div className="flex-1 overflow-hidden">
                                   <p className={`text-[10px] md:text-xs font-bold truncate ${isOwn ? 'text-white' : 'text-gray-700'}`}>{msg.file_name}</p>
                                 </div>
                                 <a href={msg.file_url} download target="_blank" rel="noreferrer" className={`p-2 rounded-lg hover:bg-black/10 transition-colors ${isOwn ? 'text-white' : 'text-orange-600'}`}>
                                   <FiDownload className="w-4 h-4" />
                                 </a>
                               </div>
                             )}
                           </div>
                          )}
                        </div>

                        <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                          <p className={`text-[8px] font-bold text-gray-400`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.is_edited && <span className="ml-1 italic font-normal">({t('common.edit')})</span>}
                          </p>
                          <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ${isOwn ? '' : 'flex-row-reverse'}`}>
                            <button 
                              onClick={() => setReplyingTo(msg)}
                              className="text-emerald-500 hover:text-emerald-700 p-1"
                              title={t('common.reply') || "Reply"}
                            >
                              <FiCornerUpLeft className="w-3 h-3" />
                            </button>
                            {isOwn && (
                              <>
                                <button 
                                  onClick={() => startEditing(msg)}
                                  className="text-indigo-400 hover:text-indigo-600 p-1"
                                >
                                  <FiEdit2 className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => setShowDeleteModal({ show: true, type: 'single', msgId: msg.id })}
                                  className="text-red-400 hover:text-red-600 p-1"
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Emoji Picker Dropdown */}
          {showEmojiPicker && (
            <div className="absolute bottom-24 md:bottom-32 left-4 z-50 animate-scale-in shadow-2xl rounded-xl overflow-hidden w-[calc(100vw-2rem)] md:w-auto md:left-8">
              <EmojiPicker 
                onEmojiClick={addEmoji} 
                theme="light"
                suggestedEmojisMode="recent"
                skinTonesDisabled
                searchPlaceHolder={t('admin.search') || "Search emoji..."}
                height={350}
                width="100%"
              />
            </div>
          )}


          {/* File Preview */}
          {file && (
            <div className="mx-4 md:mx-6 mb-2 p-2 md:p-3 bg-saffron-50 rounded-2xl flex items-center justify-between animate-slide-in-up border border-saffron-100">
              <div className="flex items-center gap-3">
                <FiFile className="text-saffron-600" />
                <span className="text-[10px] md:text-xs font-bold text-saffron-800 truncate max-w-[150px] md:max-w-xs">{file.name}</span>
              </div>
              <button onClick={() => setFile(null)} className="p-1 hover:bg-saffron-100 rounded-lg text-saffron-600"><FiX /></button>
            </div>
          )}

          {/* Reply Bar */}
          {replyingTo && (
            <div className="mx-4 md:mx-6 mb-2 bg-white/90 backdrop-blur-md rounded-xl flex items-stretch overflow-hidden animate-slide-in-up border border-gray-100 shadow-lg relative h-16 md:h-20">
              <div className="w-1.5 bg-emerald-500"></div>
              <div className="flex-1 p-3 md:p-4 pr-12 flex flex-col justify-center">
                <p className="text-[10px] md:text-xs font-black text-emerald-600 mb-0.5 tracking-tight">
                  Replying to {replyingTo.sender_id === user.id ? (t('common.you') || 'You') : (replyingTo.sender?.name || 'Admin')}
                </p>
                <p className="text-[11px] md:text-sm font-medium text-gray-500 truncate max-w-[280px] md:max-w-xl">{replyingTo.content}</p>
              </div>
              <button 
                onClick={() => setReplyingTo(null)} 
                className="absolute top-2 right-2 p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-all hover:text-gray-600"
              >
                <FiX className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          )}

          {/* Editing Bar */}
          {editingMessage && (
            <div className="mx-4 md:mx-6 mb-2 p-2 md:p-3 bg-indigo-50 rounded-2xl flex items-center justify-between animate-slide-in-up border border-indigo-100">
              <div className="flex items-center gap-3">
                <FiEdit2 className="text-indigo-600" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400">{t('admin.editingMessage')}</p>
                  <p className="text-[10px] font-extrabold text-indigo-800 truncate max-w-[200px]">{editingMessage.content}</p>
                </div>
              </div>
              <button onClick={cancelEditing} className="p-1 hover:bg-indigo-100 rounded-lg text-indigo-600"><FiX /></button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-2 md:p-6 bg-gray-50/80 backdrop-blur-md border-t border-gray-100">
            <form onSubmit={sendMessage} className="flex items-center gap-1.5 md:gap-4 bg-white p-1.5 pl-3 md:pl-6 rounded-[1.5rem] md:rounded-full shadow-lg shadow-gray-200/50 border border-transparent focus-within:border-emerald-200 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
              <input 
                type="file" 
                id="file-upload" 
                hidden 
                onChange={(e) => setFile(e.target.files[0])}
              />
              <label htmlFor="file-upload" className="text-gray-400 hover:text-saffron-500 p-1 md:p-2 cursor-pointer transition-colors">
                <FiPaperclip className="w-4 h-4 md:w-5 md:h-5" />
              </label>
              
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-1 md:p-2 transition-colors ${showEmojiPicker ? 'text-emerald-500 animate-bounce' : 'text-gray-400 hover:text-emerald-500'}`}
              >
                <FiSmile className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={uploading ? t('admin.uploading') : editingMessage ? t('admin.editMessage') : t('admin.writeMessage')}
                disabled={uploading}
                className="flex-1 bg-transparent border-none focus:ring-0 text-xs md:text-sm font-bold text-gray-800 placeholder:text-gray-400 py-2 md:py-3 outline-none"
              />
              
              <button 
                type="submit" 
                disabled={(!newMessage.trim() && !file) || sending || uploading}
                className="bg-emerald-500 text-white w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/30 disabled:opacity-50 disabled:grayscale group shrink-0"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-2 border-white/30 border-t-white"></div>
                ) : (
                  <FiSend className={`w-4 h-4 md:w-5 md:h-5 ml-[-2px] ${sending ? 'animate-pulse' : 'group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform'}`} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
