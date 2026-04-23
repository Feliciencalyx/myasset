import { 
  Bell, 
  ShieldCheck, 
  Globe, 
  Smartphone, 
  Moon, 
  CreditCard,
  Lock,
  ChevronRight,
  Check,
  Mail,
  Save,
  Loader2
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(true);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { isAdmin } = useAuth();

  // SMTP Setup State
  const [resendKey, setResendKey] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSmtpSave = async () => {
    if (!resendKey) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/system/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: resendKey, sender: senderEmail })
      });
      if (res.ok) {
        setSaveStatus('success');
        setResendKey('');
        setSenderEmail('');
      } else {
        setSaveStatus('error');
      }
    } catch (e) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const sections = [
    {
      title: t('globalPreferences'),
      items: [
        { label: t('pushNotifications'), sub: 'Receive alerts for registry changes', icon: Bell, type: 'toggle', value: notifications, setter: setNotifications },
        { label: t('darkMode'), sub: 'Optimize for low-light management', icon: Moon, type: 'toggle', value: isDarkMode, setter: toggleDarkMode },
        { label: t('language'), sub: `Currently set to ${language.toUpperCase()}`, icon: Globe, type: 'language-select' },
      ]
    },
    {
      title: t('securityAccess'),
      items: [
        { label: 'Biometric Unlock', sub: 'FaceID or Fingerprint verification', icon: Smartphone, type: 'toggle', value: biometrics, setter: setBiometrics },
        { label: 'Stewardship Recovery', sub: 'Configure backup family keys', icon: Lock, type: 'link' },
        { label: 'Audit Log Retention', sub: 'Keep records for 25 years', icon: ShieldCheck, type: 'link' },
      ]
    },
    {
      title: 'Billing & Tiers',
      items: [
        { label: 'Family Premium Plan', sub: 'Renews on Dec 2026', icon: CreditCard, type: 'link' },
      ]
    }
  ];

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <header>
        <h2 className="text-4xl font-black text-primary tracking-tighter font-headline">{t('settings')}</h2>
        <p className="text-sm text-outline mt-2 font-medium">Configure global estate parameters and security protocols.</p>
      </header>

      <div className="space-y-10">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-4">{section.title}</h3>
            <div className="bg-surface-container-lowest rounded-[2.5rem] border border-outline-variant/20 shadow-sm overflow-hidden">
              {section.items.map((item, i) => (
                <div key={i}>
                  <div 
                    className={`flex items-center justify-between p-8 hover:bg-surface-container-low transition-colors cursor-pointer border-b border-outline-variant/10 last:border-0`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center border border-outline-variant/10 shadow-sm">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-primary font-headline uppercase tracking-tight">{item.label}</h4>
                        <p className="text-[10px] text-outline font-bold mt-1 uppercase tracking-tighter">{item.sub}</p>
                      </div>
                    </div>

                    {item.type === 'toggle' ? (
                      <button 
                        onClick={() => item.setter?.(!item.value)}
                        className={`w-14 h-8 rounded-full p-1 transition-all duration-500 ease-in-out ${item.value ? 'bg-primary' : 'bg-outline-variant'}`}
                      >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-500 ease-in-out ${item.value ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                    ) : item.type === 'language-select' ? (
                      <div className="flex gap-2">
                        {(['en', 'rw', 'fr'] as const).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === lang ? 'bg-primary text-white shadow-lg scale-110' : 'bg-surface-container-high text-outline hover:text-primary'}`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <ChevronRight size={18} className="text-outline/40" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* System Admin Section */}
        {isAdmin && (
          <div className="space-y-4 pt-10">
            <h3 className="text-[10px] font-black text-error uppercase tracking-[0.2em] px-4">System Infrastructure</h3>
            <div className="bg-surface-container-lowest rounded-[2.5rem] border border-error/20 shadow-sm p-10 space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-error-container/10 text-error flex items-center justify-center border border-error/10">
                  <Mail size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-primary font-headline tracking-tight">Modern Mail Infrastructure (Resend)</h4>
                  <p className="text-[10px] text-outline font-bold mt-1 uppercase tracking-tighter">Secure API-Based Communication Gateway</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-outline px-2">Resend API Key</label>
                  <input 
                    type="password" 
                    value={resendKey}
                    onChange={(e) => setResendKey(e.target.value)}
                    placeholder="re_••••••••••••"
                    className="w-full bg-surface-container-low border-none rounded-2xl p-5 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-outline px-2">Verified Sender Email</label>
                  <input 
                    type="email" 
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="notifications@yourdomain.com"
                    className="w-full bg-surface-container-low border-none rounded-2xl p-5 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={handleSmtpSave}
                  disabled={isSaving || !resendKey}
                  className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl ${
                    saveStatus === 'success' ? 'bg-emerald-500 text-white' : 
                    saveStatus === 'error' ? 'bg-error text-white' :
                    'bg-primary text-white hover:opacity-90'
                  }`}
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : (saveStatus === 'success' ? <Check size={18} /> : <Save size={18} />)}
                  {saveStatus === 'success' ? 'Infrastructure Active' : (saveStatus === 'error' ? 'Link Failed' : 'Connect Modern Gateway')}
                </button>
                <div className="flex-1 text-[10px] text-outline font-bold leading-relaxed">
                  <p>Security Advantage: Unlike App Passwords, API Keys are scoped and revocable. By default, "onboarding@resend.dev" can be used for testing.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="pt-12 text-center space-y-4">
         <p className="text-[10px] text-outline font-black uppercase tracking-widest">System Build: v2.4.0-Rwanda-Cloud</p>
         <button className="text-[10px] font-black text-error uppercase tracking-widest bg-error-container/10 px-8 py-4 rounded-2xl hover:bg-error-container/20 transition-all border border-error/10">
           Factory Reset Portfolio
         </button>
      </footer>
    </div>
  );
}
