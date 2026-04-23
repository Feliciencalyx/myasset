import { Mail, Shield, Building, Calendar, Edit3, Key, Check, X, Loader2, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, ChangeEvent } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Profile() {
  const { profile, updateProfile } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl || '');

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updateProfile({ name, email, photoUrl });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(profile?.name || '');
    setEmail(profile?.email || '');
    setPhotoUrl(profile?.photoUrl || '');
    setIsEditing(false);
    setError(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        setError(t('imageSizeLimit'));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tighter font-headline">{t('profile')}</h2>
          <p className="text-sm text-outline mt-2 font-medium">{t('manageCredentials')}</p>
        </div>
      </header>

      <div className="bg-surface-container-lowest rounded-[3rem] border border-outline-variant/20 shadow-xl overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary to-primary-container relative">
          <div className="absolute -bottom-16 left-12 group">
            <div 
              onClick={() => isEditing && fileInputRef.current?.click()}
              className={`h-32 w-32 rounded-[2.5rem] border-[6px] border-surface-container-lowest overflow-hidden shadow-2xl bg-surface-container-lowest relative ${isEditing ? 'cursor-pointer hover:opacity-90' : ''}`}
            >
              <img 
                src={photoUrl || profile?.photoUrl || "https://picsum.photos/seed/manager/200/200"} 
                alt="Profile avatar" 
                className="w-full h-full object-cover"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-primary/40 flex items-center justify-center text-white backdrop-blur-[2px] transition-opacity">
                   <Camera size={24} />
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </div>

        <div className="pt-20 pb-12 px-12 space-y-12">
          <div className="flex justify-between items-start">
            <div className="flex-1 max-w-md">
              {isEditing ? (
                <div className="space-y-4">
                   <div className="space-y-1">
                    <label className="text-[9px] font-black text-outline uppercase tracking-widest px-1">Display Name</label>
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-2xl font-black text-primary font-headline tracking-tighter w-full bg-surface-container-low px-4 py-2 rounded-xl outline-none border-b-2 border-primary/20 focus:border-primary transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-primary/60 italic px-1">
                    Click the camera icon to upload a new photo from your device.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-3xl font-black text-primary font-headline tracking-tighter">{profile?.name}</h3>
                  <p className="text-xs text-outline font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                    <Shield size={14} className="text-primary/40" /> {profile?.role} {t('stewardshipRole')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div 
                    key="edit-actions"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex gap-3"
                  >
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-primary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      {t('saveUpdates')}
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="bg-surface-container-high text-on-surface-variant px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-surface-container-highest transition-all"
                    >
                      <X size={16} /> {t('cancel')}
                    </button>
                  </motion.div>
                ) : (
                  <motion.button 
                    key="edit-trigger"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setIsEditing(true)}
                    className="bg-surface-container-high text-primary px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary hover:text-white transition-all"
                  >
                    <Edit3 size={16} /> {t('editProfile')}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-error-container/20 border border-error/10 text-error text-[10px] font-bold uppercase tracking-widest rounded-xl">
              Configuration Error: {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10 space-y-4 shadow-inner">
                <div className="flex items-center gap-3 text-primary">
                  <Mail size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('emailAddress')}</span>
                </div>
                {isEditing ? (
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-lg font-bold text-primary w-full bg-surface/50 px-3 py-1 rounded-lg border-b-2 border-primary/20 focus:border-primary outline-none transition-all"
                  />
                ) : (
                  <p className="text-lg font-bold text-primary">{profile?.email}</p>
                )}
              </div>

              <div className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10 space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <Building size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('familyId')}</span>
                </div>
                <p className="text-lg font-bold text-primary font-headline opacity-60 cursor-not-allowed">
                  {profile?.familyId}
                </p>
              </div>
            </div>

            <div className="space-y-6">
               <div className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10 space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <Key size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('securityProtocol')}</span>
                </div>
                <p className="text-lg font-bold text-primary">{t('biometricEnabled')}</p>
              </div>

              <div className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10 space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <Calendar size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('lastRegistryUpdate')}</span>
                </div>
                <p className="text-lg font-bold text-primary text-outline">Today, 10:45 AM</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant/10 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-outline uppercase tracking-widest">{t('accessExpiration')}</p>
              <p className="text-sm font-bold text-primary">Renew needed in 2,450 days</p>
            </div>
            <button className="text-[10px] font-black text-error uppercase tracking-widest hover:underline px-4 py-2">
              {t('revokeAccess')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
