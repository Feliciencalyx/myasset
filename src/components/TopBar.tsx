import { Search, Bell, Settings, Shield, User, LogOut, Check, Info, Globe, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

interface TopBarProps {
  setActiveTab: (tab: string) => void;
  activeTab: string;
  onOpenSidebar: () => void;
}

export default function TopBar({ setActiveTab, activeTab, onOpenSidebar }: TopBarProps) {
  const { profile, isAdmin, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Land Title Verified', detail: 'UPI 1/03/04 - System Sync Complete', type: 'success', time: '2m ago' },
    { id: 2, title: 'Security Alert', detail: 'New Login from Kigali - Safari Browser', type: 'info', time: '1h ago' },
    { id: 3, title: 'Insurance Expiry', detail: 'Toyota Land Cruiser - 14 Days Remaining', type: 'warning', time: '4h ago' },
  ];

  const toggleLanguage = () => {
    const langs: ('en' | 'rw' | 'fr')[] = ['en', 'rw', 'fr'];
    const currentIndex = langs.indexOf(language);
    const nextIndex = (currentIndex + 1) % langs.length;
    setLanguage(langs[nextIndex]);
  };

  return (
    <nav className="fixed top-0 right-0 left-0 lg:left-64 z-50 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 py-4 border-b border-outline-variant/10">
      <div className="flex items-center gap-4 md:gap-8">
        <button 
          onClick={onOpenSidebar}
          className="p-2 lg:hidden text-primary hover:bg-surface-container-low rounded-xl transition-all"
        >
          <Menu size={24} />
        </button>
        <span className="text-xl md:text-2xl font-black text-primary tracking-tighter font-headline">MyAsset</span>
        <div className="hidden xl:flex gap-8 text-[10px] uppercase font-black tracking-widest text-on-surface-variant/40">
           {t('familyId')}: <span className="text-primary font-bold tracking-normal">{profile?.familyId}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div 
          onClick={() => setActiveTab('profile')}
          className={`hidden sm:flex items-center gap-3 px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border cursor-pointer ${
            activeTab === 'profile' 
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
              : 'bg-surface-container-high text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-lowest'
          }`}
        >
          {isAdmin ? <Shield size={14} /> : <User size={14} />}
          <span className="hidden md:inline">{profile?.role}: {profile?.name}</span>
        </div>

        <button 
          onClick={logout}
          className="p-3 bg-surface-container-low text-outline hover:text-error hover:bg-error-container/20 rounded-xl transition-all group"
          title={t('logout')}
        >
          <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
        </button>

        <div className="hidden lg:flex items-center bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/10 group focus-within:border-primary/40 transition-colors">
          <Search size={16} className="text-outline group-focus-within:text-primary" />
          <input 
            type="text" 
            placeholder={t('searchPortfolio')}
            className="bg-transparent border-none focus:ring-0 text-[11px] font-bold uppercase tracking-widest w-48 placeholder:text-outline/50"
          />
        </div>
        
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-primary hover:text-white rounded-xl transition-all group border border-outline-variant/10"
            title="Switch Language"
          >
            <Globe size={18} className="group-hover:rotate-45 transition-transform duration-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">{language}</span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 transition-all duration-300 rounded-full relative ${showNotifications ? 'bg-primary text-white shadow-lg' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error border-2 border-surface rounded-full"></span>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="absolute top-14 right-0 w-80 bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 overflow-hidden z-[60]"
                >
                  <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('notificationCenter')}</h4>
                    <span className="text-[8px] font-black bg-surface-container-low px-2 py-1 rounded text-outline">{notifications.length} New</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-5 border-b border-outline-variant/5 hover:bg-surface-container-low/30 transition-colors cursor-pointer group">
                        <div className="flex gap-4">
                           <div className={`mt-1 p-1.5 rounded-lg shrink-0 ${n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : n.type === 'info' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                            {n.type === 'success' ? <Check size={12} /> : <Info size={12} />}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-black text-primary font-headline leading-tight">{n.title}</p>
                            <p className="text-[10px] text-on-surface-variant/70 leading-snug">{n.detail}</p>
                            <p className="text-[9px] text-outline/50 font-bold uppercase tracking-tighter pt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-4 text-[9px] font-black text-primary uppercase tracking-widest hover:bg-surface-container-low transition-colors">
                    {t('viewAllActivity')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`p-2 transition-all duration-300 rounded-full ${activeTab === 'settings' ? 'bg-primary text-white shadow-lg scale-110' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          >
            <Settings size={20} />
          </button>
          
          <div 
            onClick={() => setActiveTab('profile')}
            className={`h-10 w-10 rounded-full overflow-hidden border-2 shadow-sm ml-2 cursor-pointer transition-all ${activeTab === 'profile' ? 'border-primary ring-4 ring-primary/20 scale-110' : 'border-white hover:scale-105'}`}
          >
            <img 
              src={profile?.photoUrl || "https://picsum.photos/seed/manager/100/100"} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
