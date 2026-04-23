import { useState, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Home, Car } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { EstateProvider, useEstate } from './context/EstateContext';
import AuthScreens from './components/auth/AuthScreens';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

// Lazy Load Components for faster initial load
const Dashboard = lazy(() => import('./components/Dashboard'));
const Vault = lazy(() => import('./components/Vault'));
const Family = lazy(() => import('./components/Family'));
const Assets = lazy(() => import('./components/Assets'));
const Residential = lazy(() => import('./components/Residential'));
const Vehicles = lazy(() => import('./components/Vehicles'));
const Schema = lazy(() => import('./components/Schema'));
const Profile = lazy(() => import('./components/Profile'));
const Settings = lazy(() => import('./components/Settings'));

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <EstateProvider>
            <AuthRouter />
          </EstateProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function AuthRouter() {
  const { user, profile, loading, slowLoading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
        {/* Premium Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: 'url("/assets/loading_bg.png")', filter: 'brightness(0.3)' }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/80 to-surface" />

        <div className="relative flex flex-col items-center gap-8 text-center max-w-sm">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="w-24 h-24 border-[1px] border-primary/20 rounded-full flex items-center justify-center backdrop-blur-xl">
              <div className="w-20 h-20 border-[1px] border-primary/40 rounded-full animate-ping absolute opacity-20" />
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Map className="w-8 h-8 text-primary" />
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-primary font-headline tracking-tighter uppercase">MyAsset</h1>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-60">
              {t('synchronizingEstate')}
            </p>
            {slowLoading && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[9px] text-primary/60 font-bold uppercase tracking-widest mt-4 animate-pulse"
              >
                Oracle Cloud database is waking up...
              </motion.p>
            )}
          </div>

          <div className="w-48 h-[2px] bg-outline-variant/30 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthScreens />;
  }

  return <AppContent />;
}

function AppContent() {
  const { activeTab, setActiveTab } = useEstate();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    return (
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline/40">Preparing View...</p>
        </div>
      }>
        {(() => {
          switch (activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'family': return <Family />;
            case 'assets': return <Assets />;
            case 'residential': return <Residential />;
            case 'vehicles': return <Vehicles />;
            case 'vault': return <Vault />;
            case 'schema': return <Schema />;
            case 'profile': return <Profile />;
            case 'settings': return <Settings />;
            default:
              return (
                <div className="flex items-center justify-center h-full text-outline font-headline font-bold uppercase tracking-widest bg-surface-container-low rounded-[2.5rem] p-40">
                  Section coming soon
                </div>
              );
          }
        })()}
      </Suspense>
    );
  };

  const quickAddItems = [
    { id: 'assets', label: 'Land Asset', icon: Map, color: 'bg-emerald-500' },
    { id: 'residential', label: 'Property', icon: Home, color: 'bg-blue-500' },
    { id: 'vehicles', label: 'Vehicle', icon: Car, color: 'bg-amber-500' },
  ];

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onQuickAdd={() => setShowQuickAdd(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col relative w-full overflow-x-hidden">
        <TopBar 
          setActiveTab={setActiveTab} 
          activeTab={activeTab} 
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
        
        <main className="flex-1 mt-24 p-4 md:p-8 lg:p-12 mb-20 max-w-[1600px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {showQuickAdd && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowQuickAdd(false)} 
                  className="absolute top-8 right-8 text-outline text-2xl font-black p-2"
                >×</button>
                
                <div className="text-center mb-10">
                  <h3 className="text-4xl font-black text-primary font-headline tracking-tighter">Fast Registry</h3>
                  <p className="text-xs text-outline font-bold uppercase tracking-widest mt-2">What would you like to record today?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {quickAddItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setShowQuickAdd(false);
                      }}
                      className="group flex flex-col items-center gap-6 p-8 rounded-3xl bg-surface-container-low hover:bg-primary transition-all border border-outline-variant/30"
                    >
                      <div className={`w-16 h-16 rounded-2xl ${item.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <item.icon size={32} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-primary group-hover:text-white transition-colors">{item.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="px-12 py-8 border-t border-outline-variant/10 flex justify-between items-center text-outline/50 font-bold text-[10px] uppercase tracking-widest">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">shield</span>
            </div>
            <p>Secured by MyAsset Oracle Cloud Architecture</p>
          </div>
          <p>© 2026 MyAsset Portfolio Management</p>
        </footer>
      </div>
    </div>
  );
}

