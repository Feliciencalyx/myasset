import { 
  LayoutDashboard, 
  Map, 
  Home, 
  FolderLock, 
  BarChart3, 
  HelpCircle, 
  UserCircle2, 
  Plus,
  Network,
  Users,
  Car,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onQuickAdd?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onQuickAdd, isOpen, onClose }: SidebarProps) {
  const { t } = useLanguage();
  const { isAdmin, user } = useAuth();
  const adminName = user?.fullName?.split(' ')[0] || 'Family';
  
  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'family', label: t('family', { adminName }), icon: Users },
    { id: 'assets', label: t('assets'), icon: Map },
    { id: 'residential', label: t('residential'), icon: Home },
    { id: 'vehicles', label: t('vehicles'), icon: Car },
    { id: 'vault', label: t('vault'), icon: FolderLock },
    { id: 'schema', label: t('profile'), icon: UserCircle2 },
    { id: 'settings', label: t('settings'), icon: Network },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[150] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 left-0 z-[200] w-72 bg-surface-container-low py-8 flex flex-col transition-transform duration-500 ease-in-out border-r border-outline-variant/10
        lg:translate-x-0 lg:static lg:h-screen lg:w-64 lg:shrink-0 lg:sticky lg:top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-6 space-y-1 relative">
          <button 
            onClick={onClose}
            className="absolute top-0 right-4 p-2 lg:hidden text-outline hover:text-primary"
          >
            <X size={20} />
          </button>
          
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">{t('portfolio')}</p>
          <div className="flex items-center gap-3 py-2">
            <div className="w-2 h-8 bg-primary rounded-full"></div>
            <div>
              <h3 className="font-headline font-extrabold text-primary text-xl leading-tight">MyAsset</h3>
              <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">{t('premiumTier')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-0 mt-8 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 ease-in-out relative group ${
                activeTab === item.id 
                  ? 'bg-surface-container-lowest text-primary font-bold' 
                  : 'text-on-surface-variant/70 hover:translate-x-1 hover:bg-surface-container-high'
              }`}
            >
              {activeTab === item.id && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute left-0 w-1 h-full bg-primary"
                />
              )}
              <item.icon size={20} className={activeTab === item.id ? 'text-primary' : 'text-on-surface-variant'} />
              <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-6 space-y-4">
          {isAdmin ? (
            <button 
              onClick={() => {
                onQuickAdd?.();
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-xl font-headline font-bold text-xs uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              {t('addNewAsset')}
            </button>
          ) : (
            <div className="p-4 bg-surface-container-high rounded-xl border border-outline-variant/30">
              <p className="text-[10px] font-black text-outline uppercase tracking-widest leading-relaxed">
                {t('viewOnlyMode')}
              </p>
            </div>
          )}
          
          <div className="pt-6 border-t border-outline-variant/20 space-y-3">
            <button className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-outline hover:text-primary transition-colors w-full text-left">
              <HelpCircle size={16} />
              {t('support')}
            </button>
            <button 
              onClick={() => {
                setActiveTab('profile');
                if (window.innerWidth < 1024) onClose();
              }}
              className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-colors w-full text-left ${activeTab === 'profile' ? 'text-primary' : 'text-outline hover:text-primary'}`}
            >
              <UserCircle2 size={16} />
              {t('profile')}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
