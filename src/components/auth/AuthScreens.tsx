import { useState, FormEvent } from 'react';
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
  const { theme, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');
  const [familyId, setFamilyId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [isResetStep, setIsResetStep] = useState(false);
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [setupSender, setSetupSender] = useState('');

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password } 
        : { email, password, name, role, familyId };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        //@ts-ignore
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (isLogin ? 'Login failed' : 'Registration failed'));
      }

      setAuthData(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
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
      setSuccess(data.message);
      setShowSetup(false);
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
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        //@ts-ignore
        credentials: 'include',
        body: JSON.stringify({
          email: user.email,
          name: user.displayName,
          photoUrl: user.photoURL,
          uid: user.uid
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Google Sign-In failed');

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
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest rounded-full border-[1px] border-outline-variant/30 transition-all text-on-surface text-[10px] font-bold tracking-widest uppercase">
            <Globe className="w-3 h-3 text-primary" />
            {language}
            <ChevronDown className="w-3 h-3 opacity-40" />
          </button>
          
          <div className="absolute top-full right-0 mt-2 w-32 py-2 bg-surface-container-highest border-[1px] border-outline-variant/30 rounded-2xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all z-50 backdrop-blur-xl">
            {['EN', 'FR', 'RW'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang as any)}
                className={`w-full px-4 py-2 text-left text-[10px] font-bold tracking-widest uppercase hover:bg-primary/10 transition-colors ${language === lang ? 'text-primary' : 'text-on-surface'}`}
              >
                {lang === 'EN' ? 'English' : lang === 'FR' ? 'Français' : 'Kinyarwanda'}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-3 bg-surface-container-high hover:bg-surface-container-highest rounded-full border-[1px] border-outline-variant/30 transition-all group"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-blue-500 group-hover:-rotate-12 transition-transform" />
          )}
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
            <p className="text-outline uppercase text-[10px] tracking-[0.3em] font-black">{isLogin ? t('loginTitle') : t('signupTitle')}</p>
          </div>

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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-12 pr-6 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary outline-none text-sm font-bold transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      role === 'ADMIN' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-surface-container-low text-outline border-outline-variant/30 hover:border-primary/30'
                    }`}
                  >
                    {t('parentAdmin')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('USER')}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      role === 'USER' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-surface-container-low text-outline border-outline-variant/30 hover:border-primary/30'
                    }`}
                  >
                    {t('childUser')}
                  </button>
                </div>

                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" size={18} />
                  <input 
                    type="text" 
                    placeholder={role === 'ADMIN' ? "Estate ID (Optional for new)" : "Family Estate ID (Required)"} 
                    value={familyId}
                    onChange={(e) => setFamilyId(e.target.value)}
                    required={role === 'USER'}
                    className="w-full pl-12 pr-6 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary outline-none text-sm font-bold transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" size={18} />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-12 pr-6 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary outline-none text-sm font-bold transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={isLogin}
              className="w-full pl-12 pr-6 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 focus:border-primary outline-none text-sm font-bold transition-all"
            />
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={handleResetPassword}
                className="text-[10px] font-bold text-primary hover:underline transition-all"
              >
                Forgot Password?
              </button>
            </div>
          )}

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
                    placeholder="Enter 6-Digit Code" 
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
                    placeholder="Enter Your New Password" 
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

          {error && (
            <div className="flex items-start gap-3 p-4 bg-error-container text-on-error-container rounded-2xl text-[10px] font-bold leading-relaxed">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 p-4 bg-primary-container text-on-primary-container rounded-2xl text-[10px] font-bold leading-relaxed">
              <Shield size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {showSetup && isLogin && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-surface-container-high rounded-[2rem] border border-primary/20 space-y-4"
            >
              <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-2">
                <Shield size={14} />
                Modern Email Setup
              </h3>
              <p className="text-[10px] text-outline leading-normal font-medium">
                The email system is not linked. Enter your <b>Resend API Key</b> to enable automatic verification codes.
              </p>
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

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-primary text-white rounded-2xl font-headline font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? "Synchronizing..." : isLogin ? t('secureLogin') : t('registerEstate')}
            <ArrowRight size={18} />
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
      </motion.div>
    </div>
  );
}
