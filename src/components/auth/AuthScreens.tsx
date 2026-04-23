import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Lock, User, ArrowRight, AlertCircle, Building2, Sun, Moon, Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { signInWithGoogle } from '../../lib/firebase';
import { API_BASE } from '../../config';

export default function AuthScreens() {
  const { setAuthData } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');
  const [familyId, setFamilyId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [isResetStep, setIsResetStep] = useState(false);
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [setupSender, setSetupSender] = useState('');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isVerifyStep, setIsVerifyStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    let interval: any;
    if (loading) {
      const messages = [
        t('connecting'), 
        t('verifying'), 
        t('securing'),
        t('syncing')
      ];
      let i = 0;
      setLoadingMessage(messages[0]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [loading, t]);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password } 
        : { email, password, fullName, role, familyId };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        //@ts-ignore
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.needsVerification) {
          setIsVerifyStep(true);
          setEmail(data.email);
          setSuccess(data.error);
          return;
        }
        throw new Error(data.error || (isLogin ? t('loginFailed') : t('registrationFailed')));
      }

      if (!isLogin && data.message) {
        setIsVerifyStep(true);
        setSuccess(data.message);
        return;
      }

      setAuthData(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const handleVerifyEmail = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setSuccess(data.message);
      setIsVerifyStep(false);
      setIsLogin(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError(t('enterEmailFirst'));
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setSuccess(data.message);
      setIsResetStep(true);
      if (data.needsSetup) {
        setShowSetup(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSetup = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/system/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: setupKey, sender: setupSender })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      // Update local state and reload to apply
      setShowSetup(false);
      setSuccess(t('resetCodeSent'));
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/confirm-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCodeInput, newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setSuccess(data.message);
      setIsResetStep(false);
      setPassword(newPassword); // Pre-fill for login
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      const token = await user.getIdToken();
      
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          email: user.email,
          role: isLogin ? undefined : role,
          familyId: isLogin ? undefined : familyId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(t('googleSignInFailed'));
        return;
      }

      setAuthData(data.token, data.user);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Top Bar Controls */}
      <div className="absolute top-8 right-8 flex items-center gap-4 z-50">
        {/* Language Switcher */}
        <div className="relative">
          <button 
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest rounded-full border-[1px] border-outline-variant/30 transition-all text-on-surface text-[10px] font-bold tracking-widest uppercase"
          >
            <Globe className="w-3 h-3 text-primary" />
            {language}
            <ChevronDown className={`w-3 h-3 opacity-40 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showLangDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 mt-2 w-40 py-2 bg-surface-container-highest border-[1px] border-outline-variant/30 rounded-2xl shadow-2xl z-50 backdrop-blur-xl"
              >
                {['en', 'fr', 'rw'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang as any);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-[10px] font-bold tracking-widest uppercase hover:bg-primary/10 transition-colors flex items-center justify-between ${language === lang ? 'text-primary' : 'text-on-surface'}`}
                  >
                    {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'Kinyarwanda'}
                    {language === lang && <div className="w-1 h-1 bg-primary rounded-full" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleDarkMode}
          className="p-3 bg-surface-container-high hover:bg-surface-container-highest rounded-full border-[1px] border-outline-variant/30 transition-all group"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isDarkMode ? 'dark' : 'light'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-500" />
              )}
            </motion.div>
          </AnimatePresence>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-low border-[1px] border-outline-variant/30 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-xl"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black text-primary font-headline tracking-tighter mb-2">MyAsset</h1>
            <p className="text-outline uppercase text-[10px] tracking-[0.3em] font-black">
              {isVerifyStep ? 'Verify Account' : (isLogin ? t('loginTitle') : t('signupTitle'))}
            </p>
          </div>

        {isVerifyStep ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-xs text-on-surface-variant">We've sent a 6-digit code to</p>
              <p className="text-sm font-bold text-primary">{email}</p>
            </div>

            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" size={18} />
              <input 
                type="text" 
                maxLength={6}
                placeholder="000000" 
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full pl-12 pr-4 py-5 bg-surface rounded-2xl border-2 border-primary/20 outline-none focus:border-primary text-center text-2xl font-black tracking-[0.5em] transition-all"
              />
            </div>

            <button 
              onClick={handleVerifyEmail}
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50"
            >
              Verify & Activate Account
            </button>

            <button 
              onClick={() => setIsVerifyStep(false)}
              className="w-full text-[10px] font-black text-outline uppercase tracking-widest hover:underline"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-4 bg-surface-container-high rounded-2xl flex items-center justify-center gap-4 text-sm font-bold border border-outline-variant/50 hover:bg-surface-container-highest transition-all disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Gmail
              </button>
              
              <div className="flex items-center gap-4">
                 <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
                 <span className="text-[10px] font-black text-outline/50 uppercase tracking-widest">or use email</span>
                 <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6"
                  >
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" size={18} />
                      <input 
                        type="text" 
                        placeholder="Full Name" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-surface rounded-2xl border border-outline-variant/30 outline-none focus:border-primary transition-all text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 text-center">
                        <button 
                          type="button"
                          onClick={() => setRole('USER')}
                          className={`w-full py-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all ${role === 'USER' ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-outline-variant/30 text-outline'}`}
                        >
                          Family Member
                        </button>
                        <p className="text-[8px] font-bold text-outline uppercase tracking-widest">Needs Estate ID</p>
                      </div>
                      <div className="space-y-2 text-center">
                        <button 
                          type="button"
                          onClick={() => setRole('ADMIN')}
                          className={`w-full py-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all ${role === 'ADMIN' ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-outline-variant/30 text-outline'}`}
                        >
                          Estate Admin
                        </button>
                        <p className="text-[8px] font-bold text-outline uppercase tracking-widest">Creates New ID</p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {role === 'USER' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="relative"
                        >
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" size={18} />
                          <input 
                            required
                            type="text" 
                            placeholder="Family Estate ID (e.g. U9PMC)" 
                            value={familyId}
                            onChange={(e) => setFamilyId(e.target.value.toUpperCase())}
                            className="w-full pl-12 pr-4 py-4 bg-primary/5 rounded-2xl border-2 border-primary/20 outline-none focus:border-primary transition-all text-sm font-bold placeholder:text-primary/30"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" size={18} />
                    <input 
                      type="email" 
                      placeholder={t('emailAddressLabel')} 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-surface rounded-2xl border border-outline-variant/30 outline-none focus:border-primary transition-all text-sm"
                    />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" size={18} />
                    <input 
                      type="password" 
                      placeholder={t('passwordLabel')} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-surface rounded-2xl border border-outline-variant/30 outline-none focus:border-primary transition-all text-sm"
                    />
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={handleResetPassword}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <AnimatePresence>
                {isResetStep && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6 pt-6 border-t border-outline-variant/20"
                  >
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" size={18} />
                      <input 
                        type="text" 
                        placeholder={t('resetCodeLabel')} 
                        value={resetCodeInput}
                        onChange={(e) => setResetCodeInput(e.target.value)}
                        required
                        className="w-full pl-12 pr-6 py-4 bg-surface-container-low rounded-2xl border border-primary outline-none text-sm font-bold transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" size={18} />
                      <input 
                        type="password" 
                        placeholder={t('newPasswordLabel')} 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full pl-12 pr-6 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary outline-none text-sm font-bold transition-all"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={handleConfirmReset}
                      className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg"
                    >
                      Confirm New Password
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-primary text-white rounded-2xl font-headline font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <motion.span
                      key={loadingMessage}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="min-w-[140px]"
                    >
                      {loadingMessage}
                    </motion.span>
                  </div>
                ) : (
                  <>
                    {isLogin ? t('secureLogin') : t('registerEstate')}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
              >
                {isLogin ? t('joinRegistry') : t('alreadyRegistered')}
              </button>
            </div>
          </>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-3 text-error text-xs font-bold mt-6"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-primary text-xs font-bold mt-6"
          >
            {success}
          </motion.div>
        )}

        {showSetup && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3 pt-4 border-t border-outline-variant/20 mt-6"
          >
            <p className="text-[10px] font-black text-outline uppercase tracking-widest text-center">Infrastructure Setup Required</p>
            <input 
              type="password" 
              placeholder="Resend API Key (re_...)" 
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
              className="w-full px-4 py-3 bg-surface rounded-xl border border-outline-variant/30 text-[10px] outline-none focus:border-primary transition-all"
            />
            <input 
              type="email" 
              placeholder="Verified Sender (optional)" 
              value={setupSender}
              onChange={(e) => setSetupSender(e.target.value)}
              className="w-full px-4 py-3 bg-surface rounded-xl border border-outline-variant/30 text-[10px] outline-none focus:border-primary transition-all"
            />
            <button 
              type="button"
              onClick={handleSystemSetup}
              className="w-full py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Link Resend Infrastructure
            </button>
          </motion.div>
        )}
        </motion.div>
      </div>
    </div>
  );
}
