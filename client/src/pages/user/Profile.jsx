import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { supabase } from '../../services/supabase';
import { FiUser, FiMapPin, FiBriefcase, FiHash, FiPhone, FiCalendar, FiShield, FiCamera, FiEdit3, FiSave, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function Profile() {
  const { t } = useTranslation();
  const { user: authUser, login, token } = useAuth();
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      setUser(res.data.user);
      setFormData(res.data.user);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setFormData(user);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await authAPI.updateProfile({
        username: formData.username,
        father_name: formData.father_name,
        mobile: formData.mobile,
      });
      setUser(res.data.user);
      login({ ...authUser, ...res.data.user }, token);
      setIsEditing(false);
      setMessage({ type: 'success', text: t('profile.updateSuccess') || 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: t('profile.updateError') || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      setMessage(null);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw new Error('Photo upload failed');

      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const photo_url = data.publicUrl;

      const res = await authAPI.updateProfile({ photo_url });
      setUser(res.data.user);
      setFormData(prev => ({ ...prev, photo_url }));
      login({ ...authUser, ...res.data.user }, token);
      setMessage({ type: 'success', text: 'Photo updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update photo.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center mountain-bg"><p className="text-saffron-500 font-bold animate-pulse">{t('common.loading')}</p></div>;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 mountain-bg">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar / Photo */}
          <div className="md:w-1/3">
            <div className="glass-card p-6 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-saffron-400 rounded-full blur-[60px] opacity-20"></div>
              
              <div className="relative mb-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-saffron-50 flex items-center justify-center">
                  {user?.photo_url ? (
                    <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="w-16 h-16 text-saffron-300" />
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="absolute bottom-1 right-1 p-2 bg-maroon-500 text-white rounded-full shadow-lg hover:bg-maroon-600 transition-colors disabled:opacity-50"
                  title="Upload Photo"
                >
                  <FiCamera className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-800">{user?.username}</h2>
              <p className="text-maroon-500 font-semibold text-sm uppercase tracking-wider mt-1">{user?.business_type}</p>
              
              <div className="mt-6 w-full pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('profile.accountStatus')}</span>
                  <span className="px-2 py-0.5 bg-forest-100 text-forest-600 rounded-full text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1">
                    <FiShield className="w-3 h-3" /> {t('profile.verified')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('profile.memberSince')}</span>
                  <span className="font-semibold text-gray-700">{new Date(user?.created_at).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Info */}
          <div className="md:w-2/3 space-y-6">
            
            {message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                message.type === 'success' ? 'bg-forest-50 text-forest-600 border border-forest-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                {message.type === 'success' ? <FiCheckCircle className="w-5 h-5" /> : <FiAlertCircle className="w-5 h-5" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave}>
              {/* Personal Details */}
              <div className="glass-card p-8 border-l-4 border-saffron-500 relative overflow-hidden mb-6">
                 <div className="absolute top-0 right-0 p-4 flex gap-2">
                    {isEditing ? (
                      <>
                        <button type="button" onClick={toggleEdit} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-semibold text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100/50">
                          <FiX /> {t('common.cancel') || 'Cancel'}
                        </button>
                        <button type="submit" disabled={saving} className="flex items-center gap-2 text-white bg-saffron-500 hover:bg-saffron-600 font-semibold text-sm transition-colors px-4 py-1.5 rounded-lg disabled:opacity-50 shadow-md hover:shadow-lg">
                          <FiSave /> {saving ? 'Saving...' : 'Save'}
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={toggleEdit} className="flex items-center gap-2 text-saffron-600 hover:text-saffron-700 font-semibold text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-saffron-50/50">
                        <FiEdit3 /> {t('common.edit')}
                      </button>
                    )}
                 </div>
                 
                 <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 mt-4 sm:mt-0">
                   <FiUser className="text-maroon-500" /> {t('profile.personalInfo')}
                 </h3>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                   <DetailItem label={t('auth.username')} value={user?.username} icon={FiUser} isEditing={isEditing} name="username" formDataValue={formData.username} onChange={handleChange} />
                   <DetailItem label={t('auth.fatherName')} value={user?.father_name || '—'} icon={FiUser} isEditing={isEditing} name="father_name" formDataValue={formData.father_name} onChange={handleChange} />
                   <DetailItem label={t('auth.mobile')} value={user?.mobile} icon={FiPhone} isEditing={isEditing} name="mobile" formDataValue={formData.mobile} onChange={handleChange} type="tel" maxLength="10" />
                   <DetailItem label={t('auth.gstId')} value={user?.gst_id} icon={FiHash} isMono />
                 </div>
              </div>

              {/* Business & Location (Read-Only structurally) */}
              <div className="glass-card p-8 border-l-4 border-maroon-500 relative overflow-hidden">
                 <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                   <FiBriefcase className="text-saffron-500" /> {t('profile.businessInfo')}
                 </h3>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                 <DetailItem label={t('auth.businessType')} value={user?.business_type} icon={FiBriefcase} />
                 <DetailItem label={t('auth.district')} value={user?.district} icon={FiMapPin} />
                 <DetailItem label={t('auth.block')} value={user?.block || '—'} icon={FiMapPin} />
                 <DetailItem label={t('profile.registrationDetails')} value="Permit No: ZPU-2024-882" icon={FiShield} />
               </div>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon: Icon, isMono = false, isEditing = false, name, formDataValue, onChange, type = "text", maxLength }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {label}
      </p>
      {isEditing && onChange ? (
        <input 
          type={type}
          name={name}
          maxLength={maxLength}
          value={formDataValue || ''}
          onChange={onChange}
          className="w-full bg-white border border-gray-200 text-gray-800 text-sm py-2 px-3 rounded-xl focus:ring-2 focus:ring-saffron-500/20 focus:border-saffron-500 transition-all shadow-sm outline-none"
        />
      ) : (
        <p className={`text-base font-medium text-gray-800 ${isMono ? 'font-mono' : ''}`}>
          {value || '—'}
        </p>
      )}
    </div>
  );
}
