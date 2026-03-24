import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { 
  FiUser, FiMail, FiPhone, FiBriefcase, FiCalendar, 
  FiMapPin, FiSave, FiAlertCircle, FiCheckCircle, FiX, FiCamera, FiTrendingUp, FiBookOpen
} from 'react-icons/fi';
import { supabase } from '../../services/supabase';

const AdminProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await adminAPI.getAdminProfile();
      setProfile(res.data.admin);
    } catch (err) {
      setMessage({ type: 'error', text: t('admin.profile.updateError') });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      let photo_url = profile.photo_url;

      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, photo);

        if (uploadError) throw new Error('Photo upload failed');

        const { data } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
        
        photo_url = data.publicUrl;
      }

      await adminAPI.updateAdminProfile({
        email: profile.email,
        mobile: profile.mobile,
        qualification: profile.qualification,
        office_field: profile.office_field,
        member_since: profile.member_since,
        photo_url
      });
      setMessage({ type: 'success', text: t('admin.profile.updateSuccess') });
    } catch (err) {
      setMessage({ type: 'error', text: t('admin.profile.updateError') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-maroon-700 rounded-full mb-4 shadow-[0_0_20px_rgba(128,0,0,0.2)]"></div>
      </div>
    </div>
  );

  if (!profile && !loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-4 text-center">
      <div className="glass-card p-10 max-w-sm border-red-100">
        <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">Profile Load Failed</h2>
        <p className="text-sm text-gray-500 mb-8">{message.text || 'Unable to fetch your profile information.'}</p>
        <button onClick={() => window.location.reload()} className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase text-xs">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen mountain-bg pt-14 sm:pt-20 pb-12 px-4 sm:px-6 lg:px-8 text-black transition-all duration-500">

      <div className="max-w-4xl mx-auto relative px-4">
        {/* Close/Cut Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 w-6 h-6 sm:w-8 sm:h-8 bg-maroon-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-maroon-700 transition-all z-20 group border-b border-maroon-900"
          aria-label="Close Profile"
        >
          <FiX className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110" />
        </button>

        <div className="mb-6 sm:mb-14 text-center animate-fade-in px-2 pt-6 sm:pt-0">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight mb-1.5 text-maroon-500 drop-shadow-sm leading-none flex items-center justify-center gap-2.5">
             <FiTrendingUp className="text-saffron-500 w-5 h-5 sm:w-8 sm:h-8" /> {t('admin.profile.title')}
          </h1>
          <p className="text-[10px] sm:text-sm font-bold font-sans text-gray-500 drop-shadow-sm">{t('admin.profile.subtitle')}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-8 animate-slide-in-left">
            {/* Identity Card */}
            <div className="modern-card p-8 text-center group">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-tr from-maroon-500 to-saffron-500 rounded-full animate-pulse blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-2xl group-hover:scale-105 transition-transform duration-500">
                  {photoPreview || profile.photo_url ? (
                    <img src={photoPreview || profile.photo_url} alt="Admin" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-black to-red-900">
                      <span className="text-4xl sm:text-5xl font-black text-white">{profile.username?.[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <label htmlFor="admin-photo" className="absolute -bottom-1 -right-1 p-2.5 bg-white text-black rounded-xl shadow-xl cursor-pointer hover:bg-maroon-50 transition-all border border-gray-100 flex items-center justify-center">
                  <FiCamera className="w-3.5 h-3.5" />
                </label>
                <input 
                  type="file" 
                  id="admin-photo" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setPhoto(file);
                      setPhotoPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-black mb-1 tracking-tight">{profile.username}</h2>
              <p className="text-xs font-bold font-sans text-gray-400 mb-6">{profile.districts?.name || 'Uttarakhand'}</p>

              <div className="p-3 sm:p-5 rounded-2xl bg-saffron-50 border border-saffron-100 flex gap-2.5 text-left">
                <FiAlertCircle className="w-3.5 h-3.5 text-saffron-600 flex-shrink-0 mt-0.5" />
                <p className="text-[9px] sm:text-[11px] leading-relaxed text-saffron-900 font-bold">
                  {t('admin.profile.readOnly')}
                </p>
              </div>
            </div>

            {/* Status Feedback */}
            {message.text && (
              <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-sm border animate-fade-in flex items-center gap-3 modern-card ${
                message.type === 'success' ? 'bg-forest-50 border-forest-100 text-forest-700' : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                {message.type === 'success' ? <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiAlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                <p className="font-bold text-[10px] sm:text-sm leading-none">{message.text}</p>
              </div>
            )}
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 animate-slide-in-right">
            <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] sm:rounded-[4rem] p-6 sm:p-12 shadow-[0_35px_70px_rgba(0,0,0,0.1)] border border-maroon-100 space-y-8 sm:space-y-12">
              
              {/* Personal Section */}
              <div className="animate-fade-in-up delay-100">
                <h3 className="text-xs sm:text-sm font-bold font-heading text-maroon-900 mb-6 whitespace-nowrap text-left border-l-4 border-maroon-900 pl-4">
                  {t('admin.profile.personalInfo')}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="group">
                    <label className="block text-xs font-bold font-heading text-maroon-900 mb-2 ml-1">{t('admin.profile.email')}</label>
                    <div className="relative">
                      <FiMail className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4 group-focus-within:text-maroon-500 transition-colors" />
                      <input 
                        type="email" 
                        value={profile?.email || ''} 
                        readOnly 
                        className="w-full pl-12 sm:pl-16 pr-6 py-4 sm:py-5 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-gray-400 cursor-not-allowed focus:ring-0 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-xs font-bold font-heading text-maroon-900 mb-2 ml-1">{t('admin.profile.mobile')}</label>
                    <div className="relative">
                      <FiPhone className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-maroon-500 transition-colors" />
                      <input 
                        type="tel" 
                        value={profile?.mobile || ''} 
                        readOnly 
                        className="w-full pl-12 sm:pl-16 pr-6 py-4 sm:py-5 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-gray-400 cursor-not-allowed focus:ring-0 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Section */}
              <div className="animate-fade-in-up delay-300">
                <h3 className="text-xs sm:text-sm font-bold font-heading text-maroon-900 mb-6 whitespace-nowrap text-left border-l-4 border-maroon-900 pl-4">
                  {t('admin.profile.officeDetails')}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="group animate-fade-in-up delay-400">
                    <label className="block text-xs font-bold font-heading text-maroon-900 mb-2 ml-1">
                      {t('admin.profile.qualification')}
                    </label>
                    <div className="relative">
                      <FiBookOpen className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-maroon-500 transition-colors" />
                      <input 
                        type="text" 
                        value={profile?.qualification || ''}
                        onChange={(e) => setProfile({...profile, qualification: e.target.value})}
                        placeholder="e.g. Master's in Economics"
                        className="w-full pl-12 sm:pl-16 pr-6 py-4 sm:py-5 bg-white border border-gray-200 focus:border-maroon-500 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-gray-900 transition-all outline-none focus:ring-4 focus:ring-maroon-500/5 hover:border-maroon-200"
                      />
                    </div>
                  </div>
                  
                  <div className="group animate-fade-in-up delay-500">
                    <label className="block text-xs font-bold font-heading text-maroon-900 mb-2 ml-1">
                      {t('admin.profile.designation')}
                    </label>
                    <div className="relative">
                      <FiBriefcase className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-maroon-500 transition-colors" />
                      <input 
                        type="text" 
                        value={profile?.office_field || ''}
                        onChange={(e) => setProfile({...profile, office_field: e.target.value})}
                        placeholder="e.g. Senior Administrative Officer"
                        className="w-full pl-12 sm:pl-16 pr-6 py-4 sm:py-5 bg-white border border-gray-200 focus:border-maroon-500 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-gray-900 transition-all outline-none focus:ring-4 focus:ring-maroon-500/5 hover:border-maroon-200"
                      />
                    </div>
                  </div>

                  <div className="group animate-fade-in-up delay-700">
                    <label className="block text-xs font-bold font-heading text-maroon-900 mb-2 ml-1">
                      {t('admin.profile.memberSince')}
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-maroon-500 transition-colors" />
                      <input 
                        type="text" 
                        value={new Date(profile.created_at).toLocaleDateString()} 
                        readOnly 
                        className="w-full pl-12 sm:pl-16 pr-6 py-4 sm:py-5 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-gray-400 cursor-not-allowed focus:ring-0 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 sm:pt-6">
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full h-16 sm:h-20 bg-black hover:bg-maroon-900 text-white font-bold rounded-2xl sm:rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 sm:gap-4 border-b-4 sm:border-b-6 border-gray-900 overflow-hidden group relative animate-fade-in-up delay-700"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
                  <FiSave className={`w-5 h-5 sm:w-6 sm:h-6 relative z-10 transition-transform group-hover:scale-110 ${saving ? 'animate-spin' : ''}`} />
                  <span className="tracking-wide text-xs sm:text-sm font-bold relative z-10">
                    {saving ? t('admin.profile.saving') : t('admin.profile.save')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
