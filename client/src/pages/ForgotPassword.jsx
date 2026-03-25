import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { FiLock, FiCheckCircle, FiPhone } from 'react-icons/fi';
import { motion } from 'framer-motion';
import OTPModal from '../components/OTPModal';
import Loader from '../components/Loader';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ gst_id: '', mobile: '', otp: '', new_password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [otpModal, setOtpModal] = useState({ isOpen: false, otp: '' });

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ gst_id: form.gst_id, mobile: form.mobile });
      setStep(2);
      setOtpSent(true);
      if (res.data.debug_otp) {
        setOtpModal({ isOpen: true, otp: res.data.debug_otp });
      }
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (form.new_password.length < 6) {
      setError(t('auth.passwordLength'));
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(form);
      setSuccess(t('auth.resetSuccess'));
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 bg-saffron-100 rounded-full flex items-center justify-center">
              <FiLock className="w-7 h-7 text-saffron-600" />
            </div>
            <h2 className="text-2xl font-bold text-maroon-500">{t('auth.resetPassword')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('nav.zilaPanchayat')}</p>
          </div>

          {!success && (
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                step >= 1 ? 'bg-gradient-to-br from-saffron-400 to-saffron-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>1</div>
              <div className={`w-16 h-1 rounded-full ${step >= 2 ? 'bg-saffron-500' : 'bg-gray-200'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                step >= 2 ? 'bg-gradient-to-br from-saffron-400 to-saffron-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>2</div>
            </div>
          )}

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>}
          {success && (
            <div className="mb-4 p-4 bg-forest-50 border border-forest-200 text-forest-600 rounded-xl text-center">
              <FiCheckCircle className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium">{success}</p>
              <Link to="/login" className="text-sm text-saffron-600 hover:underline mt-2 inline-block">{t('auth.backToLogin')}</Link>
            </div>
          )}

          {!success && step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.gstId')}</label>
                <input type="text" className="input-field" placeholder={t('auth.gstPlaceholder')}
                  value={form.gst_id} onChange={(e) => setForm({...form, gst_id: e.target.value.toUpperCase()})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.mobile')}</label>
                <input type="tel" className="input-field" maxLength={10}
                  value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value})} required />
              </div>
              <button type="submit" disabled={loading} className="btn-saffron w-full disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {t('common.loading')}
                  </span>
                ) : t('auth.sendOtp')}
              </button>
            </form>
          )}

          {!success && step === 2 && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-saffron-50 to-forest-50 rounded-xl mb-4">
                <FiPhone className="w-10 h-10 text-saffron-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600">{t('auth.otpSentTo')}</p>
                <p className="text-lg font-bold text-gray-800 mt-1">+91 {form.mobile}</p>
              </div>

              {otpSent && (
                <div className="flex items-center gap-2 text-forest-600 text-sm mb-3 p-3 bg-forest-50 rounded-xl">
                  <FiCheckCircle className="w-5 h-5" /> {t('auth.otpSent')}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.otp')}</label>
                <input type="text" className="input-field text-center text-2xl tracking-[0.5em] font-mono" maxLength={6}
                  placeholder={t('auth.otpPlaceholder')}
                  value={form.otp} onChange={(e) => setForm({...form, otp: e.target.value.replace(/\D/g, '')})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.newPassword')}</label>
                <input type={showPassword ? 'text' : 'password'} className="input-field"
                  value={form.new_password} onChange={(e) => setForm({...form, new_password: e.target.value})} required />
                
                <div className="flex items-center gap-2 mt-2 ml-1 text-sm text-gray-500">
                  <input 
                    type="checkbox" 
                    id="forgot-show-password"
                    checked={showPassword} 
                    onChange={() => setShowPassword(!showPassword)}
                    className="w-4 h-4 rounded border-gray-300 text-saffron-600 focus:ring-saffron-500 cursor-pointer"
                  />
                  <label htmlFor="forgot-show-password" className="cursor-pointer select-none hover:text-gray-700 transition-colors">
                    {t('auth.showPassword')}
                  </label>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-forest w-full disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {t('common.loading')}
                  </span>
                ) : t('auth.resetPassword')}
              </button>

              <button type="button" onClick={() => { setStep(1); setOtpSent(false); }}
                className="w-full text-center text-sm text-gray-500 hover:text-saffron-600 mt-3 py-2 transition-colors">
                ← {t('auth.backToForm')}
              </button>
            </form>
          )}

          <Link to="/login" className="block text-center text-sm text-gray-500 hover:text-saffron-600 mt-6">
            ← {t('auth.backToLogin')}
          </Link>
        </div>
      </div>

      <OTPModal 
        isOpen={otpModal.isOpen} 
        onClose={() => setOtpModal({ ...otpModal, isOpen: false })} 
        otp={otpModal.otp} 
      />
    </div>
  );
}
