import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { FiUser, FiLock, FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/Loader';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captcha, setCaptcha] = useState({ text: '', input: '' });

  const [form, setForm] = useState({
    gst_id: '', password: '',
    username: '', passkey: '',
  });

  useEffect(() => { generateCaptcha(); }, []);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let text = '';
    for (let i = 0; i < 6; i++) text += chars[Math.floor(Math.random() * chars.length)];
    setCaptcha({ text, input: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (captcha.input !== captcha.text) {
      setError(t('auth.invalidCaptcha'));
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      if (isAdmin) {
        const res = await authAPI.adminLogin({
          username: form.username,
          password: form.password,
          passkey: form.passkey,
        });
        login({ ...res.data.admin, role: res.data.admin.role }, res.data.token);
        navigate('/admin/dashboard');
      } else {
        const res = await authAPI.login({
          gst_id: form.gst_id,
          password: form.password,
        });
        login(res.data.user, res.data.token);
        navigate('/user/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
      generateCaptcha();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen auth-grid-bg flex items-center justify-center px-4 pt-16 sm:pt-20 pb-8 sm:pb-10">
      <motion.div 
        className="w-full max-w-md auth-grid-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="premium-card p-6 sm:p-8">
          {/* Tab Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6 sm:mb-8">
            <button onClick={() => setIsAdmin(false)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                !isAdmin ? 'bg-white text-saffron-600 shadow-sm' : 'text-gray-500'
              }`}>
              <FiUser className="inline w-4 h-4 mr-1.5" />
              <span className="text-xs sm:text-sm">{t('auth.loginTitle')}</span>
            </button>
            <button onClick={() => setIsAdmin(true)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                isAdmin ? 'bg-white text-saffron-600 shadow-sm' : 'text-gray-500'
              }`}>
              <FiShield className="inline w-4 h-4 mr-1.5" />
              <span className="text-xs sm:text-sm">{t('auth.adminLoginTitle')}</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isAdmin ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.username')}</label>
                  <input type="text" className="input-field" placeholder="admin"
                    value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.passkey')}</label>
                  <input type={showPassword ? 'text' : 'password'} className="input-field" placeholder="••••••••"
                    value={form.passkey} onChange={(e) => setForm({...form, passkey: e.target.value})} required />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.gstId')}</label>
                <input type="text" className="input-field" placeholder={t('auth.gstPlaceholder')}
                  value={form.gst_id} onChange={(e) => setForm({...form, gst_id: e.target.value.toUpperCase()})} required />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
              <input type={showPassword ? 'text' : 'password'} className="input-field" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
              
              <div className="flex items-center gap-2 mt-2 ml-1">
                <input 
                  type="checkbox" 
                  id="show-password"
                  checked={showPassword} 
                  onChange={() => setShowPassword(!showPassword)}
                  className="w-4 h-4 rounded border-gray-300 text-saffron-600 focus:ring-saffron-500 cursor-pointer"
                />
                <label htmlFor="show-password" className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer select-none transition-colors">
                  {t('auth.showPassword')}
                </label>
              </div>
            </div>

            {/* Captcha */}
            <div className="animate-fade-in-up delay-300">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.captcha')}</label>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="px-3 sm:px-4 py-2 bg-gray-100 rounded-lg font-mono text-base sm:text-lg tracking-wider select-none italic text-gray-700 border border-dashed border-gray-300 flex-shrink-0 self-start sm:self-auto w-full sm:w-auto hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={generateCaptcha}
                  style={{ fontFamily: 'monospace', letterSpacing: '4px', textDecoration: 'line-through', textDecorationColor: 'rgba(0,0,0,0.1)' }}>
                  {captcha.text}
                </div>
                <input type="text" className="input-field hover-glow transition-all" placeholder={t('auth.captchaPlaceholder')}
                  value={captcha.input} onChange={(e) => setCaptcha({...captcha, input: e.target.value})} required />
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-saffron-500 hover:text-saffron-600 text-sm font-medium flex-shrink-0 self-end sm:self-auto animate-pulse"
                >
                  ↻
                </button>
              </div>
            </div>

            <motion.button type="submit" disabled={loading}
              className={`w-full py-4 font-bold rounded-2xl transition-all duration-300 btn-saffron disabled:opacity-50 shadow-xl group relative overflow-hidden`}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {t('common.loading')}
                </span>
              ) : t('auth.login')}
            </motion.button>
          </form>

          {!isAdmin && (
            <div className="mt-6 text-center space-y-2">
              <Link to="/forgot-password" className="text-sm text-saffron-600 hover:text-saffron-700 font-medium">
                {t('auth.forgotPassword')}
              </Link>
              <p className="text-sm text-gray-500">
                {t('auth.noAccount')}{' '}
                <Link to="/register" className="text-saffron-600 hover:text-saffron-700 font-semibold">
                  {t('auth.register')}
                </Link>
              </p>
            </div>
          )}

          {isAdmin && (
            <p className="mt-4 text-xs text-gray-400 text-center">{t('auth.adminNote')}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
