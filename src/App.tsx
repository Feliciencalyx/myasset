import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Vault from './components/Vault';
import Family from './components/Family';
import Assets from './components/Assets';
import Residential from './components/Residential';
import Vehicles from './components/Vehicles';
import Schema from './components/Schema';
import Profile from './components/Profile';
import Settings from './components/Settings';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Home, Car } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { EstateProvider, useEstate } from './context/EstateContext';
import AuthScreens from './components/auth/AuthScreens';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

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
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Synchronizing Estate Registry...</p>
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
              transition={{ duration: 0.2 }}
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
