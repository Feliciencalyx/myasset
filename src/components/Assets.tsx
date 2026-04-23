import { 
  Calendar, 
  MapPin, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Plus,
  ArrowRight,
  Crosshair,
  Lock,
  Layers,
  Trash2,
  CheckCircle2,
  Loader2,
  Tag,
  DollarSign,
  Maximize2,
  Edit3,
  FileText,
  ShieldCheck,
  User,
  Stamp,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useCallback, useEffect } from 'react';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { useAuth } from '../context/AuthContext';
import { useEstate } from '../context/EstateContext';
import { useLanguage } from '../context/LanguageContext';

function MapSearchHandler({ landAssets, onAssetFound }: { landAssets: any[], onAssetFound: (asset: any) => void }) {
  const map = useMap();
  const [upi, setUpi] = useState('');
  const [error, setError] = useState(false);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = landAssets.find(a => a.upi.trim() === upi.trim());
    
    if (asset && map) {
      setError(false);
      map.panTo(asset.location);
      map.setZoom(19); // High detail Plot View
      onAssetFound(asset);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="absolute top-8 right-8 z-[10]">
      <form 
        onSubmit={onSearch} 
        className={`flex bg-surface-container-lowest/95 backdrop-blur-xl rounded-3xl border ${error ? 'border-red-500 scale-95' : 'border-outline-variant/30'} shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden p-1 transition-all duration-300`}
      >
        <div className="flex items-center px-4 text-primary/40">
          <Navigation size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Land Registry UPI Search..." 
          value={upi}
          onChange={(e) => setUpi(e.target.value)}
          className="bg-transparent px-2 py-5 text-sm font-black text-primary outline-none w-72 placeholder:text-outline/40 placeholder:font-bold"
        />
        <button 
          type="submit" 
          className="bg-primary text-white px-6 rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center shadow-lg group"
        >
          <Search size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      </form>
      {error && (
        <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2 px-6">
          UPI Not Found in Registry
        </motion.p>
      )}
    </div>
  );
}

export default function Assets() {
  const { isAdmin } = useAuth();
  const { t, formatCurrency, currency, convertToBase, convertToLocal } = useLanguage();
  const { landAssets, addLandAsset, updateLandAsset, removeLandAsset, activeSearchUPI, setActiveSearchUPI } = useEstate();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
  
  // Focused Map Asset
  const [foundAsset, setFoundAsset] = useState<any>(null);
  const map = useMap();

  useEffect(() => {
    if (activeSearchUPI && map) {
      const asset = landAssets.find(a => a.upi.trim() === activeSearchUPI.trim());
      if (asset) {
        setViewMode('map');
        setTimeout(() => {
          map.panTo(asset.location);
          map.setZoom(19);
          setFoundAsset(asset);
          setActiveSearchUPI(null);
        }, 100);
      }
    }
  }, [activeSearchUPI, map, landAssets, setActiveSearchUPI]);

  // Form States
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [upiInput, setUpiInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [address, setAddress] = useState('');
  const [zoning, setZoning] = useState('Residential (R1)');
  const [size, setSize] = useState('');
  const [valuation, setValuation] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Validation States
  const [isValidating, setIsValidating] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [validationError, setValidationError] = useState('');

  const upiRegex = /^[1-5]\/[0-9]{2}\/[0-9]{2}\/[0-9]{2}\/[0-9]{1,6}$/;

  const handleRegister = async () => {
    if (!isVerified || !titleInput) return;
    
    const finalLocation = selectedLocation || { lat: -1.9441, lng: 30.0619 };
    const pDate = new Date(purchaseDate);
    const pDateStr = pDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).replace(',', '').toUpperCase();
    
    const eDate = new Date(pDate);
    eDate.setFullYear(eDate.getFullYear() + 30);
    const eDateStr = eDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).replace(',', '').toUpperCase();

    const payload = {
      upi: upiInput,
      title: titleInput,
      location: finalLocation,
      address: address || 'National Registry Context',
      zoning: zoning,
      masterPlan: 'Verified Kigali Master Plan 2030',
      size: `${size} HA`,
      purchaseDate: pDateStr,
      expiryDate: eDateStr,
      status: 'ACTIVE',
      remainingYears: 30,
      valuation: convertToBase(Number(valuation || 0)).toString()
    };

    if (isEditing && editingId) {
      await updateLandAsset(editingId, payload);
    } else {
      await addLandAsset(payload);
    }
    
    setShowRegisterModal(false);
    resetForm();
  };

  const openEdit = (asset: any) => {
    setIsEditing(true);
    setEditingId(asset.id);
    setUpiInput(asset.upi);
    setTitleInput(asset.title);
    setAddress(asset.address);
    setZoning(asset.zoning);
    setSize(asset.size.replace(/[^0-9.]+/g, ""));
    setValuation(Math.round(convertToLocal(Number(asset.valuation || 0))).toString());
    try {
      const d = new Date(asset.purchaseDate);
      if (!isNaN(d.getTime())) setPurchaseDate(d.toISOString().split('T')[0]);
    } catch(e) {}
    setSelectedLocation(asset.location);
    setIsVerified(true);
    setShowRegisterModal(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setUpiInput('');
    setTitleInput('');
    setAddress('');
    setZoning('Residential (R1)');
    setSize('');
    setValuation('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setSelectedLocation(null);
    setIsVerified(false);
    setValidationError('');
  };

  const validateUPI = async (val: string) => {
    setUpiInput(val);
    if (!val) {
      setValidationError('');
      setIsVerified(false);
      return;
    }
    if (!upiRegex.test(val)) {
      setValidationError('Invalid UPI format (e.g., 1/03/04/05/1234)');
      setIsVerified(false);
      return;
    }
    setValidationError('');
    setIsValidating(true);
    setIsVerified(false);
    setTimeout(() => {
      setIsValidating(false);
      setIsVerified(true);
    }, 1200);
  };

  const onMapClick = useCallback((e: any) => {
    setSelectedLocation({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
    setFoundAsset(null);
  }, []);

  return (
    <APIProvider apiKey={(import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''}>
      <div className="space-y-12">
        <header className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-tertiary">{t('wealthRegistry')}</p>
            <h2 className="text-3xl md:text-5xl font-black text-primary tracking-tighter font-headline">{t('assets')}</h2>
          </div>
          <div className="flex gap-4">
            <div className="flex bg-surface-container-high rounded-2xl p-1 p-y-2 border border-outline-variant/30">
              <button onClick={() => setViewMode('list')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-outline hover:text-primary'}`}>
                {t('listView')}
              </button>
              <button onClick={() => setViewMode('map')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-outline hover:text-primary'}`}>
                {t('mapExplorer')}
              </button>
            </div>
            {isAdmin && (
              <button onClick={() => { resetForm(); setShowRegisterModal(true); }} className="bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl">
                <Plus size={18} /> {t('addAsset')}
              </button>
            )}
          </div>
        </header>

        {viewMode === 'list' ? (
          <div className="space-y-12">
            {/* Expiry Alert Section */}
            <section className="bg-tertiary-container/10 border border-tertiary-container/30 p-8 rounded-[2.5rem] flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
                  <Clock size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-primary font-headline">{t('continuityAlert')}</h4>
                  <p className="text-sm text-on-surface-variant/80">{t('alertDesc')}</p>
                </div>
              </div>
              <button className="text-primary font-black text-[10px] uppercase tracking-widest bg-surface-container-lowest border border-outline-variant/30 px-6 py-3 rounded-xl shadow-sm hover:translate-y-[-2px] transition-all">
                {t('auditTimeline')}
              </button>
            </section>

            {/* Assets List Header (Hidden on Mobile) */}
            <section className="grid grid-cols-1 gap-6">
              <div className="hidden lg:grid grid-cols-6 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-outline mb-2">
                <div className="col-span-2">{t('upiLocation')}</div>
                <div>{t('ownershipDetails')}</div>
                <div>{t('leaseStatus')}</div>
                <div>{t('masterPlanContext')}</div>
                <div className="text-right">{t('valuation')}</div>
              </div>

              {landAssets.map((asset, i) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={asset.id} className="bg-surface-container-lowest p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-outline-variant/20 shadow-sm hover:shadow-xl transition-all relative group">
                  <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 lg:gap-0 items-center">
                    <div className="lg:col-span-2 flex items-center gap-4 md:gap-6">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary border border-outline-variant/10 shrink-0">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <p className="text-[9px] md:text-[10px] font-black text-tertiary uppercase tracking-widest mb-1">UPI: {asset.upi}</p>
                        <h4 className="text-xl md:text-2xl font-black text-primary font-headline leading-tight">{asset.title}</h4>
                        <p className="text-[11px] md:text-xs text-outline font-bold mt-1">{asset.address}</p>
                      </div>
                    </div>

                    <div className="flex lg:block justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-outline-variant/10">
                      <div>
                        <p className="text-sm font-bold text-primary">{asset.purchaseDate}</p>
                        <p className="text-[9px] md:text-[10px] text-outline uppercase font-black tracking-tighter mt-1">{t('acquiredByParent')}</p>
                      </div>
                    </div>

                    <div className="flex lg:block justify-between">
                      <div>
                        <p className={`text-sm font-bold ${asset.remainingYears < 15 ? 'text-red-600' : 'text-primary'}`}>
                          {asset.expiryDate}
                        </p>
                        <p className="text-[9px] md:text-[10px] text-outline uppercase font-black tracking-tighter mt-1">{asset.remainingYears} {t('yearsRemaining')}</p>
                      </div>
                    </div>

                    <div className="flex lg:block justify-between">
                      <div>
                        <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-tight">{asset.zoning}</p>
                        <p className="text-[8px] md:text-[9px] text-outline font-bold mt-1 uppercase">{asset.masterPlan}</p>
                      </div>
                    </div>

                    <div className="text-left lg:text-right border-t lg:border-t-0 pt-6 lg:pt-0 border-outline-variant/10">
                       <p className="text-2xl font-black text-primary font-headline">
                         {formatCurrency(Number(asset.valuation?.replace(/[^0-9.-]+/g,"") || 0))}
                       </p>
                       <div className="flex lg:justify-end gap-3 mt-4 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => { setSelectedAsset(asset); setShowDocumentModal(true); }}
                           className="w-10 h-10 rounded-xl bg-surface-container-low text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                         >
                           <FileText size={18} />
                         </button>
                         {isAdmin && (
                           <>
                             <button onClick={() => openEdit(asset)} className="w-10 h-10 rounded-xl bg-surface-container-low text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                               <Edit3 size={18} />
                             </button>
                             <button onClick={() => removeLandAsset(asset.id)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                               <Trash2 size={18} />
                             </button>
                           </>
                         )}
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </section>
          </div>
        ) : (
          <section className="h-[750px] rounded-[3.5rem] overflow-hidden border border-outline-variant/30 shadow-2xl relative bg-surface-container-low">
             <Map 
              defaultCenter={{ lat: -1.9441, lng: 30.0619 }} 
              defaultZoom={11} 
              gestureHandling={'greedy'} 
              disableDefaultUI={true} 
              onClick={onMapClick} 
              mapId="estate_registry_map" 
              className="w-full h-full relative"
            >
              {landAssets.map((asset) => (<Marker key={asset.id} position={asset.location} />))}
              
              <MapSearchHandler landAssets={landAssets} onAssetFound={(asset) => setFoundAsset(asset)} />

              {/* Found Asset Info Overlay */}
              <AnimatePresence>
                {foundAsset && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute top-8 left-8 z-[10] w-80"
                  >
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-white/20 shadow-2xl overflow-hidden">
                      <div className="p-8 space-y-6">
                         <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                              <MapPin size={24} />
                            </div>
                            <button onClick={() => setFoundAsset(null)} className="text-outline/40 hover:text-primary transition-colors font-black">×</button>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-tertiary uppercase tracking-widest mb-1">REGISTERED PLOT FOUND</p>
                            <h4 className="text-2xl font-black text-primary font-headline leading-tight">{foundAsset.title}</h4>
                            <p className="text-xs text-outline font-bold mt-2 uppercase tracking-tighter">{foundAsset.upi}</p>
                         </div>
                         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/20">
                            <div>
                               <p className="text-[9px] font-black text-outline uppercase tracking-tight">Market Value</p>
                               <p className="text-sm font-bold text-primary">{formatCurrency(Number(foundAsset.valuation?.replace(/[^0-9.-]+/g,"") || 0))}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-outline uppercase tracking-tight">Zoning</p>
                               <p className="text-sm font-bold text-primary">{foundAsset.zoning}</p>
                            </div>
                         </div>
                         <button 
                          onClick={() => { setSelectedAsset(foundAsset); setShowDocumentModal(true); }}
                          className="w-full bg-primary text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                         >
                           <FileText size={14} /> Open Legal Vault
                         </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Map>
          </section>
        )}

        {/* Modals go here... (Register & Document) */}
        <AnimatePresence>
          {showRegisterModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-surface-container-lowest w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-[750px] relative">
                <div className="lg:w-2/5 relative bg-surface-container-low">
                  <Map defaultCenter={selectedLocation || { lat: -1.9441, lng: 30.0619 }} defaultZoom={13} onClick={onMapClick} mapId="register_asset_map" className="w-full h-full">
                    {selectedLocation && <Marker position={selectedLocation} />}
                  </Map>
                </div>
                <div className="lg:w-3/5 p-12 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-8">
                    <div className="flex justify-between items-start">
                      <h3 className="text-3xl font-black text-primary font-headline tracking-tighter">{isEditing ? 'Modify Land Asset' : t('addAsset')}</h3>
                      <button onClick={() => setShowRegisterModal(false)} className="text-outline hover:text-primary text-2xl font-black p-2">×</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase text-outline">Unique Parcel Identifier (UPI)</label>
                        <input type="text" value={upiInput} onChange={(e) => validateUPI(e.target.value)} className="w-full bg-surface-container-low border-b-2 p-4 font-bold text-primary outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-outline">Asset Label</label>
                        <input type="text" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} className="w-full bg-surface-container-low border-b-2 p-4 font-bold text-primary outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-outline">Address</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-surface-container-low border-b-2 p-4 font-bold text-primary outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-outline">HA Size</label>
                        <input type="number" value={size} onChange={(e) => setSize(e.target.value)} className="w-full bg-surface-container-low border-b-2 p-4 font-bold text-primary outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-outline">Valuation ({currency})</label>
                        <input type="number" value={valuation} onChange={(e) => setValuation(e.target.value)} className="w-full bg-surface-container-low border-b-2 p-4 font-bold text-primary outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-outline">Purchase Date</label>
                        <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full bg-surface-container-low border-b-2 p-4 font-bold text-primary outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-outline">Zoning</label>
                        <select value={zoning} onChange={(e) => setZoning(e.target.value)} className="w-full bg-surface-container-low border-b-2 p-4 font-bold text-primary outline-none">
                          <option>Residential (R1)</option><option>Commercial (C1)</option><option>Industrial (I1)</option><option>Agricultural (A1)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleRegister} disabled={!isVerified || !titleInput || isValidating} className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl mt-8">
                    {isValidating ? 'Verification In Progress...' : (isEditing ? 'Save Modifications' : 'Record New Asset')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDocumentModal && selectedAsset && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-[3rem] p-12 max-w-3xl w-full shadow-2xl relative">
                <button onClick={() => setShowDocumentModal(false)} className="absolute top-8 right-8 text-outline text-2xl font-black">×</button>
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-20 h-20 rounded-[2rem] bg-surface-container-low flex items-center justify-center text-primary border border-outline-variant/30"><ShieldCheck size={40} /></div>
                  <div><h3 className="text-3xl font-black text-primary font-headline tracking-tighter">Land Title & Agreement</h3><p className="text-[10px] text-outline font-black uppercase tracking-widest mt-1">Registry UPI: {selectedAsset.upi}</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="p-8 rounded-3xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between h-48">
                    <div><div className="flex items-center gap-2 mb-2"><User size={16} className="text-primary/50" /><span className="text-[10px] font-black uppercase text-outline">Registered Owner</span></div><p className="text-xl font-bold text-primary font-headline leading-tight">Estate Stewardship Trust</p></div>
                    <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit">VERIFIED LEGAL ENTITY</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between h-48">
                    <div><div className="flex items-center gap-2 mb-2"><Stamp size={16} className="text-primary/50" /><span className="text-[10px] font-black uppercase text-outline">Document Status</span></div><p className="text-xl font-bold text-primary font-headline leading-tight">Full Mutual Agreement</p></div>
                    <p className="text-[10px] font-black text-primary/60">DIGITALLY STAMPED 2026</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[ { name: 'Purchase Land Agreement', date: selectedAsset.purchaseDate, type: 'HEIR_SECURE' }, { name: 'National Land Registry Certificate', date: 'APR 20, 2026', type: 'BLOCKCHAIN_SYNC' } ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-6 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl group cursor-pointer hover:border-primary/30">
                      <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center"><FileText size={20} /></div><div><p className="text-sm font-bold text-primary">{doc.name}</p><p className="text-[10px] text-outline font-medium uppercase mt-0.5">Last Audited: {doc.date}</p></div></div>
                      <div className="flex items-center gap-6"><span className="text-[8px] font-black text-primary/40 uppercase tracking-widest">{doc.type}</span><Download size={18} className="text-outline group-hover:text-primary transition-colors" /></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </APIProvider>
  );
}
