import { 
  TrendingUp, 
  MapPin, 
  ArrowRight,
  FileText,
  ShieldCheck,
  Building,
  Car,
  ChevronRight,
  PieChart,
  Navigation
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEstate } from '../context/EstateContext';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const { 
    landAssets, 
    totalConsolidatedValue, 
    totalLandHA, 
    residentialAssets, 
    vehicleFleet,
    setActiveTab,
    setActiveSearchUPI 
  } = useEstate();
  const { t, formatCurrency } = useLanguage();
  
  const residentialCount = residentialAssets.length.toString().padStart(2, '0');
  const vehicleCount = vehicleFleet.length.toString().padStart(2, '0');
  const rentedCount = residentialAssets.filter(a => a.status === 'RENTED').length;
  const occYield = residentialAssets.length ? Math.round((rentedCount / residentialAssets.length) * 100) : 0;

  const latestAsset = landAssets.length > 0 ? landAssets[0] : null;

  const metricCards = [
    { label: t('consolidatedValue'), value: totalConsolidatedValue, sub: t('valuationTrend'), icon: ShieldCheck, color: 'primary', tab: 'dashboard' },
    { label: t('landAssets'), value: totalLandHA, sub: t('registeredPlotsCount', { count: landAssets.length.toString() }), icon: MapPin, color: 'tertiary', tab: 'assets' },
    { label: t('residentialUnits'), value: residentialCount, sub: t('occupancyYield', { yield: occYield.toString() }), icon: Building, color: 'primary', tab: 'residential' },
    { label: t('vehicles'), value: vehicleCount, sub: t('insuredTracked'), icon: Car, color: 'surface', tab: 'vehicles' },
  ];

  return (
    <div className="space-y-12">
      {/* Heritage Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-0">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-primary tracking-tighter font-headline">{t('heritageHeader')}</h2>
          <p className="text-sm text-outline mt-2 font-medium">{t('dashboardDesc')}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">{t('registrySync')}</span>
        </div>
      </header>

      {/* Primary Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {metricCards.map((item, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            onClick={() => setActiveTab(item.tab)}
            className={`p-10 rounded-[2.5rem] flex flex-col justify-between h-56 group cursor-pointer transition-all ${
              item.color === 'primary' ? 'bg-primary text-white shadow-xl hover:translate-y-[-4px]' : 
              item.color === 'tertiary' ? 'bg-tertiary-container text-on-tertiary-container border border-tertiary-container/30 hover:shadow-lg' :
              'bg-surface-container-lowest border border-outline-variant/30 hover:shadow-lg'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-4 rounded-2xl ${item.color === 'primary' ? 'bg-white/10' : 'bg-surface-container-low text-primary'}`}>
                <item.icon size={24} />
              </div>
              <ChevronRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${item.color === 'primary' ? 'opacity-60' : 'text-outline'}`}>{item.label}</p>
              <h4 className="text-4xl font-black font-headline tracking-tighter leading-none">{item.value}</h4>
              <p className={`text-[10px] font-bold mt-2 ${item.color === 'primary' ? 'opacity-40' : 'text-on-surface-variant/60'}`}>{item.sub}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Main Registry Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Estate Map Preview */}
        <div className="lg:col-span-8 flex flex-col gap-8">
           <div className="flex justify-between items-center px-4">
            <h3 className="text-2xl font-black text-primary font-headline tracking-tight">{t('assets')}</h3>
            <button 
              onClick={() => setActiveTab('assets')}
              className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 group"
            >
              {t('mapExplorer')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="relative h-[500px] rounded-[3rem] overflow-hidden border border-outline-variant/30 group">
            <img 
              src="https://picsum.photos/seed/kigali-aerial/1600/900?blur=1" 
              alt="Rwanda Master Plan Overlay" 
              className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[5000ms]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent"></div>
            
            <div className="absolute inset-0 p-10 flex flex-col justify-between pointer-events-none">
              <div className="flex justify-end gap-3 pointer-events-auto">
                 <button onClick={() => setActiveTab('assets')} className="bg-surface-container-lowest/90 backdrop-blur px-6 py-3 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest border border-outline-variant/20 shadow-xl">{t('masterPlanSync')}</button>
                 <button onClick={() => setActiveTab('assets')} className="bg-primary/90 backdrop-blur px-6 py-3 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl">{t('upiLayer')}</button>
              </div>
              
              {latestAsset ? (
                <div className="glass-panel p-8 rounded-[2rem] border border-white/20 shadow-2xl max-w-sm pointer-events-auto group/hero">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">{t('lastRegisteredPlot')}</p>
                  <h4 className="text-3xl font-black text-primary font-headline tracking-tighter">{latestAsset.title}</h4>
                  <p className="text-xs text-on-surface-variant font-medium leading-relaxed mt-2">{latestAsset.address}</p>
                  <div className="mt-6 flex gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-primary/40 uppercase">UPI</span>
                      <span className="text-xs font-bold text-primary">{latestAsset.upi}</span>
                    </div>
                    <div className="w-[1px] bg-outline-variant/30"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-primary/40 uppercase">{t('valuation')}</span>
                      <span className="text-xs font-bold text-primary">{formatCurrency(Number(latestAsset.valuation?.replace(/[^0-9.-]+/g,"") || 0))}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                        setActiveTab('assets');
                        setActiveSearchUPI(latestAsset.upi);
                    }}
                    className="w-full mt-6 bg-primary text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg"
                  >
                    {t('viewInRegistry')} <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-[2rem] border border-white/20 shadow-2xl max-w-sm pointer-events-auto">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">{t('welcome')}</p>
                  <h4 className="text-3xl font-black text-primary font-headline tracking-tighter">{t('noAssetsRecorded')}</h4>
                  <p className="text-xs text-on-surface-variant font-medium leading-relaxed mt-2">{t('startDocumenting')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audit & Compliance Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <h3 className="text-2xl font-black text-primary font-headline tracking-tight px-4">{t('registryCompliance')}</h3>
           <div className="bg-surface-container-low p-8 rounded-[3rem] space-y-8 border border-outline-variant/30">
              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/20 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">{t('estateIntegrity')}</p>
                  <p className="text-4xl font-black font-headline text-primary tracking-tighter leading-none">
                    {landAssets.length > 0 ? '100%' : '0%'}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent flex items-center justify-center">
                   <PieChart size={24} className="text-emerald-500" />
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-2 mb-4">{t('latestRegistryActivity')}</p>
                {landAssets.slice(0, 3).map((asset, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                        setActiveTab('assets');
                        setActiveSearchUPI(asset.upi);
                    }}
                    className="flex gap-5 group cursor-pointer p-2 rounded-2xl hover:bg-surface-container-lowest transition-all"
                  >
                    <div className="w-12 h-12 bg-surface-container-lowest rounded-2xl flex items-center justify-center text-primary shadow-sm border border-outline-variant/10 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-primary font-headline leading-tight">{asset.title}</p>
                      <p className="text-[10px] text-on-surface-variant/70 mt-1 leading-snug">UPI: {asset.upi} | {asset.zoning}</p>
                      <p className="text-[9px] text-tertiary font-black mt-2 uppercase tracking-tighter">REGISTERED ON {asset.purchaseDate}</p>
                    </div>
                  </div>
                ))}
                {landAssets.length === 0 && (
                  <p className="text-[10px] text-outline font-bold text-center py-4">{t('waitingForFirstEntry')}</p>
                )}
              </div>

              <button 
                onClick={() => setActiveTab('vault')}
                className="w-full py-5 bg-primary text-white rounded-2xl font-headline font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:opacity-90 transition-all"
              >
                {t('exportLedger')}
              </button>
           </div>

           {/* Family Governance Quick Link */}
           <div className="bg-primary p-10 rounded-[3rem] text-white space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <h4 className="text-xl font-black font-headline tracking-tight relative z-10 leading-tight">{t('generationalOversight')}</h4>
              <p className="text-white/60 text-xs leading-relaxed relative z-10">
                {t('oversightDesc')}
              </p>
              <button onClick={() => setActiveTab('family')} className="bg-white/10 hover:bg-white/20 w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors relative z-10">
                {t('manageAccess')}
              </button>
           </div>
        </div>
      </section>
    </div>
  );
}
