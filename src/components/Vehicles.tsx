import { 
  Plus, 
  Car, 
  ShieldCheck, 
  Calendar, 
  Navigation,
  FileText,
  AlertCircle,
  Clock,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEstate } from '../context/EstateContext';
import { useLanguage } from '../context/LanguageContext';

export default function Vehicles() {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const { vehicleFleet, addVehicle, removeVehicle } = useEstate();
  
  const [showModal, setShowModal] = useState(false);
  const [model, setModel] = useState('');
  const [reg, setReg] = useState('');
  const [owner, setOwner] = useState('Estate Trust');

  const handleAddVehicle = () => {
    if (!model || !reg) return;
    addVehicle({
      model,
      reg,
      insuranceExpiry: 'DEC 31, 2026',
      status: 'ACTIVE',
      owner,
      location: 'Kigali - Garage',
      lastService: 'JUST NOW',
      img: `https://picsum.photos/seed/${model.replace(/\s/g, '') || 'tesla'}/600/400`
    });
    setShowModal(false);
    setModel('');
    setReg('');
  };

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black text-primary tracking-tighter font-headline">{t('vehicles')}</h2>
          <p className="text-sm text-outline mt-2 font-medium">{t('vehiclesDesc')}</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl"
          >
            <Plus size={18} /> Register Vehicle
          </button>
        )}
      </header>

      {/* Fleet Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: t('activeFleet'), value: vehicleFleet.length.toString().padStart(2, '0'), sub: 'Commercial & Private', icon: Car },
          { label: t('insuranceCompliance'), value: '100%', sub: t('registryVerified'), icon: ShieldCheck },
          { label: t('upcomingServices'), value: '02', sub: 'Scheduled for April', icon: Calendar },
        ].map((item, i) => (
          <div key={i} className="p-10 rounded-[2.5rem] bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between h-56 group hover:shadow-xl transition-all">
             <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <item.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">{item.label}</p>
              <h4 className="text-3xl font-black text-primary font-headline mt-1">{item.value}</h4>
              <p className="text-xs text-on-surface-variant/70 mt-1">{item.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Fleet Grid */}
      <section className="grid grid-cols-1 gap-8">
        {vehicleFleet.map((vehicle, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={vehicle.id}
            className="bg-surface-container-lowest p-10 rounded-[3rem] border border-outline-variant/30 shadow-sm hover:shadow-2xl transition-all flex flex-col lg:flex-row gap-12 group"
          >
            <div className="lg:w-1/3 h-64 rounded-2xl overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-700">
              <img src={vehicle.img} alt={vehicle.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" referrerPolicy="no-referrer" />
              <div className="absolute top-4 right-4">
                 <span className={`px-4 py-1.5 rounded-full text-[8px] font-black tracking-widest uppercase border backdrop-blur-md ${
                  vehicle.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-800 border-emerald-500/20' : 'bg-primary/20 text-white border-white/20'
                 }`}>
                   {vehicle.status === 'ACTIVE' ? t('available') : vehicle.status.replace('_', ' ')}
                 </span>
              </div>
            </div>

            <div className="lg:w-2/3 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-3xl font-black text-primary font-headline tracking-tighter">{vehicle.model}</h4>
                  <p className="text-xs text-outline font-black uppercase tracking-widest mt-1">Registry Code: {vehicle.reg}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-tertiary uppercase tracking-widest mb-1">Owner of Record</p>
                  <p className="text-lg font-black text-primary font-headline">{vehicle.owner}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-outline-variant/10 my-8">
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-outline uppercase tracking-tighter">Insurance Expiry</p>
                   <p className="text-sm font-bold text-primary flex items-center gap-2">
                     <Clock size={14} className="text-primary/40" /> {vehicle.insuranceExpiry}
                   </p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-outline uppercase tracking-tighter">Last Workshop Event</p>
                   <p className="text-sm font-bold text-primary flex items-center gap-2">
                     <Calendar size={14} className="text-primary/40" /> {vehicle.lastService}
                   </p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-outline uppercase tracking-tighter">Live Location</p>
                   <p className="text-sm font-bold text-primary flex items-center gap-2">
                     <Navigation size={14} className="text-primary/40" /> {vehicle.location}
                   </p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-outline uppercase tracking-tighter">Shared Inheritance</p>
                   <p className="text-xs font-black text-emerald-600 bg-emerald-100 rounded-lg px-2 py-1 inline-block">Heir Sync Active</p>
                 </div>
              </div>

              <div className="flex justify-between items-center">
                 <div className="flex gap-4">
                   <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary border border-outline-variant/30 px-6 py-3 rounded-xl hover:bg-surface-container-low transition-colors">
                     <FileText size={16} /> Asset Log
                   </button>
                   <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary border border-outline-variant/30 px-6 py-3 rounded-xl hover:bg-surface-container-low transition-colors">
                     <AlertCircle size={16} /> Maintenance Request
                   </button>
                 </div>
                 <div className="flex items-center gap-3">
                   {isAdmin && (
                     <button 
                       onClick={() => removeVehicle(vehicle.id)}
                       className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                       title="Remove Vehicle"
                     >
                       <Trash2 size={14} />
                     </button>
                   )}
                   <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:translate-x-1 transition-transform">
                     {t('trackAsset')} <ArrowRight size={18} />
                   </button>
                 </div>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl relative"
            >
               <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-outline text-2xl font-black">×</button>
               <h3 className="text-3xl font-black text-primary font-headline tracking-tighter mb-8">Register Vehicle</h3>
               <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline">Model Name</label>
                    <input 
                      type="text" 
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. Mercedes Benz G-Class" 
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary p-4 font-bold text-primary outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline">Registration Number</label>
                    <input 
                      type="text" 
                      value={reg}
                      onChange={(e) => setReg(e.target.value)}
                      placeholder="e.g. RAD 123 A" 
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary p-4 font-bold text-primary outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline">Owner of Record</label>
                    <input 
                      type="text" 
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary p-4 font-bold text-primary outline-none"
                    />
                 </div>
                 <button 
                  onClick={handleAddVehicle}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest mt-4 shadow-xl shadow-primary/20"
                 >
                   Save Vehicle to Fleet
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
