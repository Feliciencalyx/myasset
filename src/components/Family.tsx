import { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Key, 
  MoreHorizontal,
  Mail,
  Phone,
  ShieldAlert,
  UserPlus,
  ArrowUpRight,
  X,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE } from '../config';

export default function Family() {
  const { isAdmin, user } = useAuth();
  const { t } = useLanguage();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'USER'
  });
  const [showPassword, setShowPassword] = useState(false);

  const adminName = user?.fullName?.split(' ')[0] || 'Family';

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/family/members`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE}/api/family/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      if (response.ok) {
        setShowAddModal(false);
        setFormData({ fullName: '', email: '', password: '', role: 'USER' });
        fetchMembers();
      }
    } catch (err) {
      console.error('Failed to add member:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black text-primary tracking-tighter font-headline">{t('family', { adminName })}</h2>
          <p className="text-sm text-outline mt-2 font-medium">{t('managingGenerational')}</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl"
          >
            <UserPlus size={18} /> {t('addFamilyMember')}
          </button>
        )}
      </header>

      {/* Governance Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: t('governanceLevel'), value: `Level 4: ${t('multiGenerational')}`, sub: 'Complex Trust Structure', icon: ShieldCheck },
          { label: t('activeAccessTokens'), value: `${members.length + 9} / 15`, sub: '3 Pending Revocation', icon: Key },
          { label: t('securityStatus'), value: 'Secure', sub: 'Last Audit: 4h ago', icon: ShieldAlert },
        ].map((item, i) => (
          <div key={i} className="p-10 rounded-[2.5rem] bg-surface-container-low border border-outline-variant/10 flex flex-col justify-between h-56">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
              <item.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">{item.label}</p>
              <h4 className="text-2xl font-black text-primary font-headline mt-1">{item.value}</h4>
              <p className="text-xs text-on-surface-variant/70 mt-1">{item.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Family Roster */}
      <section className="space-y-8">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-3xl font-black text-primary tracking-tighter font-headline">{t('registryStewards')}</h3>
          <p className="text-[10px] font-black text-outline uppercase tracking-widest">{t('totalMembers')}: {members.length}</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-outline/40">Accessing Family Ledger...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {members.map((member, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={member.id}
                className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-primary/10 group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img 
                      src={member.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} 
                      alt={member.name} 
                      className="w-20 h-20 rounded-2xl object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-surface-container-lowest flex items-center justify-center ${
                      member.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-primary'
                    }`}>
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-primary font-headline">{member.name}</h4>
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mt-0.5">{member.role}</p>
                    <div className="flex gap-4 mt-4 text-[10px] font-bold text-outline uppercase tracking-tighter">
                      <span className="flex items-center gap-1.5"><Mail size={12} className="text-primary" /> {member.email}</span>
                      <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-primary" /> {member.role === 'ADMIN' ? 'Full Access' : 'Limited View'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                      member.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container-high text-primary'
                    }`}>
                      {member.status}
                    </span>
                    <p className="text-[10px] text-outline mt-2 font-bold flex items-center gap-1 hover:text-primary transition-colors">
                      {t('accessLedger')} <ArrowUpRight size={12} />
                    </p>
                  </div>
                  <button className="p-3 rounded-xl hover:bg-surface-container-high transition-colors">
                    <MoreHorizontal size={20} className="text-outline" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Succession Visualization */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-primary p-12 rounded-[3rem] text-white space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <h3 className="text-4xl font-black font-headline tracking-tighter relative z-10 leading-tight">{t('successionStrategy')}</h3>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm relative z-10">
            {t('successionDesc')}
          </p>
          <div className="pt-8 flex gap-4 relative z-10">
            <button className="bg-white text-primary px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all">{t('configureProtocol')}</button>
            <button className="text-white border border-white/20 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">{t('reviewRoadmap')}</button>
          </div>
        </div>

        <div className="bg-surface-container-low p-10 rounded-[3rem] border border-outline-variant/10 space-y-8">
          <h4 className="text-2xl font-black text-primary font-headline tracking-tight">{t('trustDistribution')}</h4>
          <div className="space-y-6">
            {[
            { label: t('directBeneficiaries'), p: 75, color: 'primary' },
            { label: t('philanthropicEscrow'), p: 15, color: 'tertiary' },
            { label: t('systemMaintenanceFund'), p: 10, color: 'outline' },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-primary">
                  <span>{stat.label}</span>
                  <span>{stat.p}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.p}%` }}
                    className={`h-full ${
                      stat.color === 'primary' ? 'bg-primary' :
                      stat.color === 'tertiary' ? 'bg-tertiary-container' : 'bg-outline'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4">
             <div className="flex items-center gap-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
                <div className="bg-primary/5 p-3 rounded-xl text-primary font-black">
                  <ShieldCheck size={20} />
                </div>
                <p className="text-[10px] font-bold text-outline leading-snug">
                  {t('lockedConsensus')}
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-8 right-8 text-outline/40 hover:text-primary transition-colors p-2"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-10">
                <h3 className="text-4xl font-black text-primary font-headline tracking-tighter">Add Steward</h3>
                <p className="text-[10px] text-outline font-black uppercase tracking-widest mt-2">Grant access to the family registry</p>
              </div>

              <form onSubmit={handleAddMember} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-4">Full Name</label>
                  <input 
                    required
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="e.g. Marie Louise"
                    className="w-full px-8 py-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 focus:border-primary outline-none transition-all font-bold text-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-4">Email Address</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="steward@myasset-registry.com"
                    className="w-full px-8 py-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 focus:border-primary outline-none transition-all font-bold text-primary"
                  />
                </div>

                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-4">Initial Password</label>
                  <input 
                    required
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-8 py-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 focus:border-primary outline-none transition-all font-bold text-primary"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-[3.2rem] text-outline/40"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-4">Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-8 py-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 focus:border-primary outline-none transition-all font-bold text-primary appearance-none"
                  >
                    <option value="USER">BENEFICIARY / HEIR</option>
                    <option value="ADMIN">CO-TRUSTEE / ADMIN</option>
                  </select>
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <ShieldCheck size={18} />}
                  Add Steward to Registry
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
