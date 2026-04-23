import { 
  Building2, 
  Users, 
  Key, 
  ArrowRight, 
  ArrowUpRight,
  TrendingUp,
  FileText,
  UserCheck,
  Plus,
  Trash2,
  MapPin,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEstate } from '../context/EstateContext';
import { useLanguage } from '../context/LanguageContext';

export default function Residential() {
  const { isAdmin } = useAuth();
  const { t, formatCurrency, currency, convertToBase } = useLanguage();
  const { 
    residentialAssets, 
    addResidentialAsset, 
    removeResidentialAsset,
    landAssets,
    setActiveTab,
    setActiveSearchUPI
  } = useEstate();

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [statusInput, setStatusInput] = useState('VACANT');
  const [rentInput, setRentInput] = useState('');
  const [valuationInput, setValuationInput] = useState('');
  const [selectedUPI, setSelectedUPI] = useState('');

  const handleRegister = () => {
    if (!nameInput || !locationInput) return;
    
    addResidentialAsset({
      name: nameInput,
      location: locationInput,
      status: statusInput,
      tenant: statusInput === 'RENTED' ? 'Pending Tenant' : statusInput === 'FAMILY_OCCUPIED' ? 'Family Estate' : null,
      leaseStart: statusInput === 'RENTED' ? 'TBD' : 'N/A',
      leaseEnd: statusInput === 'RENTED' ? 'TBD' : 'N/A',
      monthlyRent: rentInput ? formatCurrency(convertToBase(Number(rentInput))) : 'N/A',
      valuation: convertToBase(Number(valuationInput || 0)).toString(),
      appreciation: '+0.0%',
      img: `https://picsum.photos/seed/${nameInput.replace(/\s/g, '') || Math.random()}/800/600`,
      linkedUPI: selectedUPI || undefined
    });
    
    setShowRegisterModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNameInput('');
    setLocationInput('');
    setStatusInput('VACANT');
    setRentInput('');
    setValuationInput('');
    setSelectedUPI('');
  };

  const goToPlot = (upi: string) => {
    setActiveTab('assets');
    setActiveSearchUPI(upi);
  };

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black text-primary tracking-tighter font-headline">{t('residentialHeader')}</h2>
          <p className="text-sm text-outline mt-2 font-medium">{t('residentialDesc')}</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { resetForm(); setShowRegisterModal(true); }}
            className="bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl"
          >
            <Plus size={18} /> {t('addNewAsset')}
          </button>
        )}
      </header>

      {/* Snapshot Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: t('occupancyRate'), value: `${residentialAssets.length ? Math.round((residentialAssets.filter(a => a.status === 'RENTED').length / residentialAssets.length) * 100) : 0}%`, sub: `${residentialAssets.filter(a => a.status === 'RENTED').length} Houses Rented`, icon: UserCheck, color: 'primary' },
          { label: t('marketCapitalization'), value: formatCurrency(residentialAssets.reduce((sum, item) => sum + Number(item.valuation?.replace(/[^0-9.-]+/g,"") || 0), 0)), sub: t('totalPortfolioValue'), icon: TrendingUp, color: 'tertiary' },
          { label: t('maintenanceHub'), value: '02', sub: t('openServiceTickets'), icon: Building2, color: 'outline' },
        ].map((item, i) => (
          <div key={i} className="p-10 rounded-[2.5rem] bg-surface-container-lowest border border-outline-variant/10 shadow-sm flex flex-col justify-between h-56 group hover:shadow-xl transition-all">
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

      {/* Property Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {residentialAssets.map((asset, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={asset.id}
            className="bg-surface-container-lowest rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-transparent hover:border-primary/5 group"
          >
            <div className="h-72 relative overflow-hidden">
              <img src={asset.img} alt={asset.name} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" referrerPolicy="no-referrer" />
              <div className="absolute top-8 left-8 flex flex-col gap-2">
                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase backdrop-blur-md border ${
                  asset.status === 'RENTED' ? 'bg-emerald-500/20 text-emerald-100 border-white/20' :
                  asset.status === 'VACANT' ? 'bg-tertiary-container/30 text-white border-white/20' :
                  'bg-white/90 text-primary border-primary/10'
                }`}>
                  {asset.status === 'RENTED' ? t('rented') : asset.status === 'VACANT' ? t('available') : asset.status === 'FAMILY_OCCUPIED' ? t('familyOccupied') : asset.status.replace('_', ' ')}
                </span>
                {asset.linkedUPI && (
                   <button 
                    onClick={() => goToPlot(asset.linkedUPI!)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase bg-primary text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                   >
                     <MapPin size={10} /> {asset.linkedUPI}
                   </button>
                )}
              </div>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-3xl font-black text-primary font-headline tracking-tighter">{asset.name}</h4>
                  <p className="text-xs text-outline font-bold uppercase tracking-widest mt-1">{asset.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary font-headline">{formatCurrency(Number(asset.valuation?.replace(/[^0-9.-]+/g,"") || 0))}</p>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">{t('marketAssetValue')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-surface-container-low rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <UserCheck size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('activeTenant')}</span>
                  </div>
                  {asset.tenant ? (
                    <div>
                      <p className="text-lg font-black text-primary font-headline">{asset.tenant}</p>
                      <p className="text-[10px] text-outline font-bold uppercase tracking-tighter mt-1">{asset.monthlyRent} / Month</p>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-outline italic">Market Listing Active</p>
                  )}
                </div>
                
                <div className="p-6 bg-surface-container-low rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <FileText size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Documents</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="text-[10px] font-bold text-primary flex items-center justify-between group/doc hover:underline">
                      {t('rentalAgreement')} <ArrowUpRight size={12} className="group-hover/doc:translate-y-[-1px] group-hover/doc:translate-x-[1px] transition-transform" />
                    </button>
                    <button className="text-[10px] font-bold text-primary flex items-center justify-between group/doc hover:underline">
                       {t('maintenanceLog')} <ArrowUpRight size={12} className="group-hover/doc:translate-y-[-1px] group-hover/doc:translate-x-[1px] transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-outline-variant/10">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(j => (
                      <img key={j} className="h-10 w-10 rounded-full border-4 border-surface-container-lowest object-cover grayscale" src={`https://picsum.photos/seed/t${j}/100`} alt="History" referrerPolicy="no-referrer" />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-outline uppercase tracking-tighter">{t('tenantHistory')} <br /> (03 previous)</p>
                </div>
                <div className="flex items-center gap-3">
                   {asset.linkedUPI && (
                    <button 
                      onClick={() => goToPlot(asset.linkedUPI!)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      {t('landContext')} <MapPin size={10} />
                    </button>
                   )}
                  {isAdmin && (
                    <button 
                      onClick={() => removeResidentialAsset(asset.id)}
                      className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                      title="Remove Property"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:translate-x-1 transition-transform">
                    {t('manageProperty')} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Register Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-surface-container-lowest w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black text-primary font-headline tracking-tighter">{t('addResidentialProperty')}</h3>
                  <p className="text-xs text-outline font-bold uppercase tracking-widest mt-1">{t('estatePortfolioExpansion')}</p>
                </div>
                <button onClick={() => setShowRegisterModal(false)} className="text-outline hover:text-primary transition-colors text-2xl font-black p-2">×</button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline px-1">{t('propertyName')}</label>
                  <input 
                    type="text" 
                    placeholder="e.g., The Horizon Villa" 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 p-4 font-headline font-bold text-primary transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline px-1">{t('linkToLandPlot')}</label>
                    <select 
                      value={selectedUPI}
                      onChange={(e) => setSelectedUPI(e.target.value)}
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 p-4 font-headline font-bold text-primary transition-all outline-none"
                    >
                      <option value="">{t('noLink')}</option>
                      {landAssets.map(a => (
                        <option key={a.id} value={a.upi}>{a.title} ({a.upi})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline px-1">{t('geographicLocation')}</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Kicukiro, Kigali" 
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 p-4 font-headline font-bold text-primary transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline px-1">{t('currentStatus')}</label>
                    <select 
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value)}
                      className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 p-4 font-headline font-bold text-primary transition-all outline-none"
                    >
                      <option value="VACANT">{t('available')}</option>
                      <option value="RENTED">{t('rented')}</option>
                      <option value="FAMILY_OCCUPIED">{t('familyOccupied')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline px-1">{t('marketAppreciationValue')} ({currency})</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40"><DollarSign size={16} /></div>
                      <input 
                        type="number" 
                        placeholder={`e.g., ${currency === 'RWF' ? '300000000' : '250000'}`} 
                        value={valuationInput}
                        onChange={(e) => setValuationInput(e.target.value)}
                        className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 p-4 pl-10 font-headline font-bold text-primary transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline px-1">{t('monthlyYieldRent')} ({currency})</label>
                      <input 
                        type="number" 
                        placeholder={`e.g., ${currency === 'RWF' ? '3000000' : '2500'}`} 
                        value={rentInput}
                        onChange={(e) => setRentInput(e.target.value)}
                        className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-tertiary focus:ring-0 p-4 font-headline font-bold text-primary transition-all outline-none"
                      />
                    </div>
                </div>

                <div className="pt-8 space-y-4">
                  <button 
                    onClick={handleRegister} 
                    className="w-full bg-primary text-white py-5 rounded-2xl font-headline font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:opacity-90 active:scale-95 transition-all"
                  >
                    {t('saveUpdates')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
