import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { FiUser, FiPhone, FiMapPin, FiLock, FiCheckCircle, FiCamera, FiX, FiAlertCircle } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import uttarakhandData from '../data/uttarakhand';
import OTPModal from '../components/OTPModal';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/Loader';

export default function Register() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: form, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpModal, setOtpModal] = useState({ isOpen: false, otp: '' });
  const [showOtpInstructionModal, setShowOtpInstructionModal] = useState(false);

  const districts = Object.keys(uttarakhandData);

  const [form, setForm] = useState({
    username: '', gst_id: '', mobile: '', password: '', confirmPassword: '',
    district: '', block: '', business_type: '', father_name: '', otp: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const blocks = form.district ? uttarakhandData[form.district] || [] : [];

  const GST_REGEX_STRICT = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  const formatName = (str) => {
    if (!str) return str;
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const handleSendOtpTrigger = () => {
    if (!form.mobile || form.mobile.length < 10) {
      setError(t('auth.mobileRequired'));
      return;
    }
    setShowOtpInstructionModal(true);
  };

  const executeSendOTP = async () => {
    setShowOtpInstructionModal(false);
    setLoading(true);
    try {
      const res = await authAPI.sendOTP(form.mobile);
      setOtpSent(true);
      setError('');
      // In dev mode, show the OTP in modal
      if (res.data.debug_otp) {
        setOtpModal({ isOpen: true, otp: res.data.debug_otp });
      }
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      // Validate Name (No numbers)
      if (!form.username) {
        setError(t('auth.nameRequired'));
        return;
      }
      if (/\d/.test(form.username)) {
        setError("Name should not contain numbers");
        return;
      }
      if (form.father_name && /\d/.test(form.father_name)) {
        setError("Father Name should not contain numbers");
        return;
      }

      // Validate GST
      if (form.gst_id.length !== 15 || !GST_REGEX_STRICT.test(form.gst_id)) {
        setError("Invalid GST ID. It must be exactly 15 characters long.");
        return;
      }

      if (!form.mobile || form.mobile.length < 10) {
        setError(t('auth.mobileRequired'));
        return;
      }
      if (form.password.length < 6) {
        setError(t('auth.passwordLength'));
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError(t('auth.passwordMismatch'));
        return;
      }
      if (!form.business_type) {
        setError(t('auth.selectBusinessType'));
        return;
      }
      if (!form.district) {
        setError(t('auth.selectDistrict'));
        return;
      }
      if (!form.block) {
        setError(t('auth.selectBlock'));
        return;
      }
      setStep(2);
      return;
    }

    // Step 2: Submit with OTP
    if (!form.otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      let photo_url = null;
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName; // Simplified path

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, photo);

        if (uploadError) {
          console.error('Supabase Storage Error:', uploadError);
          throw new Error('Photo upload failed: ' + uploadError.message);
        }

        const { data } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
        
        photo_url = data.publicUrl;
      }

      const res = await authAPI.register({
        username: formatName(form.username),
        gst_id: form.gst_id,
        mobile: form.mobile,
        password: form.password,
        district: form.district,
        block: form.block,
        business_type: form.business_type,
        father_name: formatName(form.father_name),
        otp: form.otp,
        photo_url
      });
      login(res.data.user, res.data.token);
      navigate('/user/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    }
    setLoading(false);
  };

  const updateForm = (key, value) => {
    const updated = { ...form, [key]: value };
    // Reset block when changing district
    if (key === 'district') {
      updated.block = '';
    }
    setForm(updated);
  };

  return (
    <div className="min-h-screen auth-grid-bg flex items-center justify-center px-4 pt-20 pb-10">
      <div className="w-full max-w-lg auth-grid-content">
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-center text-maroon-500 mb-2">{t('auth.registerTitle')}</h2>
          <p className="text-sm text-center text-gray-500 mb-6">{t('nav.zilaPanchayat')}</p>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
              step >= 1 ? 'bg-gradient-to-br from-saffron-400 to-saffron-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>1</div>
            <div className={`w-16 h-1 rounded-full ${step >= 2 ? 'bg-saffron-500' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
              step >= 2 ? 'bg-gradient-to-br from-saffron-400 to-saffron-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>2</div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                {/* Photo Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-saffron-500">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser className="w-10 h-10 text-gray-300" />
                      )}
                    </div>
                    <label htmlFor="photo-upload" className="absolute bottom-0 right-0 p-2 bg-saffron-500 text-white rounded-full shadow-lg cursor-pointer hover:bg-saffron-600 transition-all scale-90 group-hover:scale-100">
                      <FiCamera className="w-4 h-4" />
                    </label>
                    <input type="file" id="photo-upload" className="hidden" accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setPhoto(file);
                          setPhotoPreview(URL.createObjectURL(file));
                        }
                      }} />
                  </div>
                  {photoPreview && (
                    <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }} 
                      className="mt-2 text-[10px] font-bold text-red-400 hover:text-red-500 flex items-center gap-1 uppercase tracking-widest">
                      <FiX /> Remove Photo
                    </button>
                  )}
                  {!photoPreview && <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Profile Photo</p>}
                </div>

                {/* Row 1: Name & Father Name */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.username')} *</label>
                    <input type="text" className="input-field" placeholder={t('auth.username')}
                      value={form.username} onChange={(e) => updateForm('username', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.fatherName')}</label>
                    <input type="text" className="input-field" placeholder={t('auth.fatherName')}
                      value={form.father_name} onChange={(e) => updateForm('father_name', e.target.value)} />
                  </div>
                </div>

                {/* Row 2: GST ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.gstId')} *</label>
                  <input type="text" className="input-field" placeholder={t('auth.gstPlaceholder')}
                    value={form.gst_id} onChange={(e) => updateForm('gst_id', e.target.value.toUpperCase())}
                    maxLength={15} required />
                  {form.gst_id && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${GST_REGEX_STRICT.test(form.gst_id) ? 'text-forest-500' : 'text-red-400'}`}>
                      {GST_REGEX_STRICT.test(form.gst_id) ? `✓ ${t('auth.gstValid')}` : `✗ ${t('auth.gstInvalid')}`}
                    </p>
                  )}
                </div>

                {/* Row 3: Mobile & Business Type */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.mobile')} *</label>
                    <input type="tel" className="input-field" placeholder="9876543210" maxLength={10}
                      value={form.mobile} onChange={(e) => updateForm('mobile', e.target.value.replace(/\D/g, ''))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.businessType')} *</label>
                    <select className="input-field" value={form.business_type}
                      onChange={(e) => updateForm('business_type', e.target.value)} required>
                      <option value="">-- {t('common.select')} --</option>
                      <option value="Grocery & Retail">{t('auth.businessCategories.grocery')}</option>
                      <option value="Restaurant & Cafe">{t('auth.businessCategories.restaurant')}</option>
                      <option value="Electronics & Hardware">{t('auth.businessCategories.electronics')}</option>
                      <option value="Medical & Pharmacy">{t('auth.businessCategories.medical')}</option>
                      <option value="Clothing & Apparels">{t('auth.businessCategories.clothing')}</option>
                      <option value="Services & Consultancy">{t('auth.businessCategories.services')}</option>
                      <option value="Small Kiosk / Vendor">{t('auth.businessCategories.small')}</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: District & Block — UTTARAKHAND DROPDOWNS */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FiMapPin className="inline w-3.5 h-3.5 mr-1" />{t('auth.district')} *
                    </label>
                    <select className="input-field" value={form.district}
                      onChange={(e) => updateForm('district', e.target.value)} required>
                      <option value="">-- {t('auth.selectDistrict')} --</option>
                      {districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FiMapPin className="inline w-3.5 h-3.5 mr-1" />{t('auth.block')} *
                    </label>
                    <select className="input-field" value={form.block}
                      onChange={(e) => updateForm('block', e.target.value)}
                      disabled={!form.district} required>
                      <option value="">-- {t('auth.selectBlock')} --</option>
                      {blocks.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    {!form.district && (
                      <p className="text-xs text-gray-400 mt-1">{t('auth.selectDistrictFirst')}</p>
                    )}
                  </div>
                </div>

                {/* Row 5: Password */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')} *</label>
                    <input type={showPassword ? 'text' : 'password'} className="input-field"
                      placeholder={t('auth.passwordLength')}
                      value={form.password} onChange={(e) => updateForm('password', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.confirmPassword')} *</label>
                    <input type={showPassword ? 'text' : 'password'} className="input-field" placeholder={t('auth.reEnterPassword')}
                      value={form.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)} required />
                    {form.confirmPassword && form.password !== form.confirmPassword && (
                      <p className="text-xs text-red-400 mt-1">{t('auth.passwordMismatch')}</p>
                    )}
                  </div>
                </div>

                {/* Show Password Checkbox */}
                <div className="flex items-center gap-2 mb-4 ml-1 text-sm text-gray-500">
                  <input 
                    type="checkbox" 
                    id="register-show-password"
                    checked={showPassword} 
                    onChange={() => setShowPassword(!showPassword)}
                    className="w-4 h-4 rounded border-gray-300 text-saffron-600 focus:ring-saffron-500 cursor-pointer"
                  />
                  <label htmlFor="register-show-password" className="cursor-pointer select-none hover:text-gray-700 transition-colors">
                    {t('auth.showPassword')}
                  </label>
                </div>

                <button type="submit" className="btn-saffron w-full text-lg py-3">
                  {t('common.next')} →
                </button>
              </>
            ) : (
              <>
                <div className="text-center p-6 bg-gradient-to-br from-saffron-50 to-forest-50 rounded-xl mb-4">
                  <FiPhone className="w-10 h-10 text-saffron-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">{t('auth.otpSentTo')}</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">+91 {form.mobile}</p>
                </div>

                {!otpSent ? (
                  <button type="button" onClick={handleSendOtpTrigger} disabled={loading}
                    className="btn-saffron w-full text-lg py-3 disabled:opacity-50">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        {t('common.loading')}
                      </span>
                    ) : t('auth.sendOtp')}
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-forest-600 text-sm mb-3 p-3 bg-forest-50 rounded-xl">
                      <FiCheckCircle className="w-5 h-5" /> {t('auth.otpSent')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.otp')}</label>
                      <input type="text" className="input-field text-center text-2xl tracking-[0.5em] font-mono" maxLength={6}
                        placeholder={t('auth.otpPlaceholder')}
                        value={form.otp} onChange={(e) => updateForm('otp', e.target.value.replace(/\D/g, ''))} required />
                    </div>
                    <button type="submit" disabled={loading}
                      className="btn-forest w-full text-lg py-3 disabled:opacity-50">
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          {t('common.loading')}
                        </span>
                      ) : t('auth.verifyOtp')}
                    </button>
                  </>
                )}

                <button type="button" onClick={() => { setStep(1); setOtpSent(false); }}
                  className="w-full text-center text-sm text-gray-500 hover:text-saffron-600 mt-3 py-2 transition-colors">
                  ← {t('auth.backToForm')}
                </button>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-saffron-600 hover:text-saffron-700 font-semibold">{t('auth.login')}</Link>
          </p>
        </div>
      </div>

      <OTPModal 
        isOpen={otpModal.isOpen} 
        onClose={() => setOtpModal({ ...otpModal, isOpen: false })} 
        otp={otpModal.otp} 
      />

      {/* OTP Instruction Modal */}
      <AnimatePresence>
        {showOtpInstructionModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-[90%] sm:max-w-lg w-full shadow-2xl relative border border-gray-100"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiAlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-800 leading-tight">Security Notice</h3>
              </div>
              
              <div className="space-y-4 mb-6 sm:mb-8">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-r-lg shadow-inner">
                  <p className="text-xs sm:text-sm font-bold text-gray-800 mb-3">
                    Since the site is in <span className="text-blue-600">Test Mode</span>, an actual SMS will not be sent to your phone. To ensure your security, the <span className="text-forest-600 bg-forest-100 px-1 rounded">OTP</span> will be displayed directly on this screen.
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 border-t border-blue-200 pt-3">
                    चूंकि साइट <span className="text-blue-600">टेस्ट मोड (Test Mode)</span> में है, आपके फोन पर वास्तविक SMS नहीं भेजा जाएगा। आपकी सुरक्षा सुनिश्चित करने के लिए, <span className="text-forest-600 bg-forest-100 px-1 rounded">OTP</span> सीधे इसी स्क्रीन पर दिखाया जाएगा।
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setShowOtpInstructionModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wider text-xs"
                >
                  Cancel / रद्द करें
                </button>
                <button 
                  onClick={executeSendOTP}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95 uppercase tracking-wider text-xs"
                >
                  Confirm & Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
