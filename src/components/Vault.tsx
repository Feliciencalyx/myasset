import { 
  FileText, 
  Signature, 
  Leaf, 
  CloudUpload,
  Lock,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

export default function Vault() {
  const { t } = useLanguage();
  
  const docs = [
    { title: 'Sale Agreement: Kigali Plot #402', type: 'Land Acquisition', date: 'Certified Mar 20, 2026', asset: 'Kigali Sector 04', icon: FileText, color: 'primary' },
    { title: 'Rental Contract: Skyline Villa #12', type: 'Residential Lease', date: 'Active from Feb 20, 2025', asset: 'Skyline Heights Villa', icon: Signature, color: 'tertiary' },
    { title: 'Gisozi Duplex - Title Deed', type: 'Primary Deed', date: 'Verified Jan 15, 2022', asset: 'The Gisozi Duplex', icon: FileText, color: 'primary' },
  ];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-outline mb-3 block">Digital Registry</span>
          <h1 className="text-5xl lg:text-7xl font-black text-primary tracking-tighter leading-tight font-headline">{t('vault')}</h1>
          <p className="mt-6 text-on-surface-variant text-lg leading-relaxed">
            {t('vaultDesc')}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container-lowest px-8 py-6 rounded-[2rem] border-l-8 border-primary shadow-sm min-w-[180px]">
            <p className="text-[10px] font-black uppercase text-outline tracking-widest">Storage Status</p>
            <p className="text-3xl font-black text-primary mt-1 font-headline">82%</p>
            <p className="text-[10px] font-bold text-on-surface-variant mt-1">Capacity Used</p>
          </div>
          <div className="bg-tertiary-container px-8 py-6 rounded-[2rem] border-l-8 border-white/20 shadow-sm min-w-[180px] text-white">
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Critical Tasks</p>
            <p className="text-3xl font-black mt-1 font-headline">03</p>
            <p className="text-[10px] font-bold opacity-80 mt-1">Pending Review</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Registry */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-[2.5rem] p-10 shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-black tracking-tighter text-primary font-headline">Master Registry</h2>
            <div className="flex gap-3">
              <button className="bg-surface-container-high hover:bg-surface-container-highest px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary transition-colors">All Types</button>
              <button className="bg-primary text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all">
                <Filter size={14} /> Filter
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {docs.map((doc, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="group flex flex-col md:flex-row items-start md:items-center py-8 px-6 hover:bg-surface-container-low transition-all cursor-pointer rounded-[2rem]"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mr-8 mb-4 md:mb-0 transition-transform group-hover:scale-110 ${
                  doc.color === 'primary' ? 'bg-primary/5 text-primary' : 'bg-tertiary-container/10 text-tertiary-container'
                }`}>
                  <doc.icon size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold font-headline text-xl text-primary leading-tight">{doc.title}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${
                      doc.color === 'primary' ? 'bg-surface-container-high text-on-surface-variant' : 'bg-tertiary-container/10 text-on-tertiary-container'
                    }`}>
                      {doc.type}
                    </span>
                    <span className="text-[10px] text-outline font-bold">• {doc.date}</span>
                  </div>
                </div>
                <div className="mt-6 md:mt-0 flex items-center gap-12">
                  <div className="text-right hidden md:block">
                    <p className="text-[9px] font-black uppercase text-outline mb-1 tracking-widest">{t('registryCode')}</p>
                    <p className="text-sm font-bold text-primary font-headline">{doc.asset}</p>
                  </div>
                  <ChevronRight size={20} className="text-outline opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-primary-container rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <h3 className="text-3xl font-black tracking-tighter mb-4 font-headline">Ingest Portal</h3>
              <p className="text-on-primary-container text-sm mb-10 leading-relaxed font-medium">Securely upload scanned deeds or legal documents for AI-assisted indexing.</p>
              <div className="border-2 border-dashed border-white/20 hover:border-white/40 rounded-3xl p-12 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                <CloudUpload size={48} className="mb-6 text-on-primary-container group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center">Drag & Drop Files</p>
                <p className="text-[9px] mt-2 opacity-40">PDF, DOCX, JPG (Max 50MB)</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
          </div>

          <div className="bg-surface-container-low rounded-[2.5rem] p-10 space-y-8">
            <h3 className="text-xl font-black text-primary font-headline tracking-tighter">{t('documentClass')}</h3>
            <div className="space-y-5">
              {[
                { name: 'Legal Frameworks', count: 14, color: 'bg-primary' },
                { name: 'Acquisition Deeds', count: 8, color: 'bg-[#356760]' },
                { name: 'Tenant Agreements', count: 22, color: 'bg-tertiary-container' },
                { name: 'Archived Files', count: 45, color: 'bg-outline' },
              ].map((cat, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${cat.color}`}></div>
                    <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-outline group-hover:text-primary transition-colors">{cat.count.toString().padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-[2.5rem] p-6 shadow-sm border border-outline-variant/10 group cursor-pointer overflow-hidden">
            <div className="h-48 w-full rounded-2xl mb-6 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
              <img 
                src="https://picsum.photos/seed/map-grid/500/300" 
                alt="Map context" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="px-2 pb-2">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-outline">Geo-Spatial Context</p>
              <h4 className="text-lg font-black text-primary mt-1 font-headline">Highland Reserve Plots</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
