import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';

type Language = 'en' | 'rw' | 'fr';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

const translations: Translations = {
  // Navigation & General
  dashboard: { en: 'Estate Overview', rw: 'Incamake y’Umutungo', fr: 'Aperçu du Patrimoine' },
  family: { en: 'Family Stewardship', rw: 'Uburere bw’Umuryango', fr: 'Gouvernance Familiale' },
  assets: { en: 'Land Registry', rw: 'Ibitabo by’Ubutaka', fr: 'Registre Foncier' },
  residential: { en: 'Residential System', rw: 'Amazu Yo Guturamo', fr: 'Système Résidentiel' },
  vehicles: { en: 'Vehicle Fleet', rw: 'Ibinyabiziga', fr: 'Parc Automobile' },
  settings: { en: 'Settings', rw: 'Igenamiterere', fr: 'Paramètres' },
  logout: { en: 'Logout', rw: 'Sohoka', fr: 'Déconnexion' },
  searchPortfolio: { en: 'Search portfolio...', rw: 'Shakisha...', fr: 'Rechercher...' },
  notificationCenter: { en: 'Notification Center', rw: 'Imenyesha', fr: 'Centre de Notifications' },
  viewAllActivity: { en: 'View All Activity', rw: 'Reba Ibikorwa Byose', fr: 'Voir Toute l’Activité' },
  familyId: { en: 'Family Estate ID', rw: 'Nomero y’Umuryango', fr: 'ID du Domaine' },
  registrySync: { en: 'Registry Synchronized', rw: 'Ibitabo Byizewe', fr: 'Registre Synchronisé' },
  support: { en: 'Support', rw: 'Inama n’ubufasha', fr: 'Support' },
  portfolio: { en: 'Portfolio', rw: 'Umutungo', fr: 'Portfolio' },
  premiumTier: { en: 'Premium Tier', rw: 'Uryo Hejuru', fr: 'Niveau Premium' },
  addNewAsset: { en: 'Add New Asset', rw: 'Andika Umutungo Mushya', fr: 'Ajouter un Actif' },
  viewOnlyMode: { en: 'Family Member Access: View-Only Mode Active', rw: 'Uruhare rw’Umuryango: Reba Gusa', fr: 'Accès Membre: Lecture Seule' },

  // Dashboard
  heritageHeader: { en: 'MyAsset Family Registry', rw: 'Registry y’Umuryango ya MyAsset', fr: 'Registre Familial MyAsset' },
  dashboardDesc: { en: 'Consolidated monitoring of multi-generational estate assets across Rwanda.', rw: 'Igenzura ry’umutungo w’umuryango mu Rwanda rwose.', fr: 'Surveillance consolidée du patrimoine familial à travers le Rwanda.' },
  consolidatedValue: { en: 'Consolidated Value', rw: 'Agaciro k’Umutungo', fr: 'Valeur Consolidée' },
  landAssets: { en: 'Land Assets (UPI)', rw: 'Ubutaka (UPI)', fr: 'Actifs Fonciers' },
  residentialUnits: { en: 'Residential Units', rw: 'Amazu yo Guturamo', fr: 'Unités Résidentielles' },
  vehicleFleet: { en: 'Vehicle Fleet', rw: 'Ikinyabiziga', fr: 'Véhicules' },
  registryCompliance: { en: 'Registry Compliance', rw: 'Ikurikiza Ryizewe', fr: 'Conformité du Registre' },
  estateIntegrity: { en: 'Estate Integrity', rw: 'Ubusugire bw’Umutungo', fr: 'Intégrité du Patrimoine' },
  latestAudit: { en: 'Latest Audit Events', rw: 'Ibyasuzumwe bwa nyuma', fr: 'Derniers Événements d’Audit' },
  exportLedger: { en: 'Export Estate Ledger', rw: 'Sohora Inyandiko z’Umutungo', fr: 'Exporter le Grand Livre' },
  generationalOversight: { en: 'Generational Oversight', rw: 'Igenzura ry’Uruhererekane', fr: 'Surveillance Générationnelle' },
  oversightDesc: { en: 'Grant "Heir" status to family members to ensure continuity in land lease management.', rw: 'Emeza abaragwa mu muryango kugira ngo umutungo ukomeze gucungwa neza.', fr: 'Attribuez le statut d’héritier pour assurer la continuité de la gestion foncière.' },
  manageAccess: { en: 'Manage Family Access', rw: 'Igenzura ry’Abinjira', fr: 'Gérer l’Accès Familial' },

  // Assets (Land)
  wealthRegistry: { en: 'Family Wealth Registry', rw: 'Inyandiko z’Umutungo w’Umuryango', fr: 'Registre de Richesse Familiale' },
  listView: { en: 'List View', rw: 'Urutonde', fr: 'Vue Liste' },
  mapView: { en: 'Map View', rw: 'Ikarita', fr: 'Vue Carte' },
  continuityAlert: { en: 'Generational Continuity Alert', rw: 'Imenyesha ry’Uruhererekane', fr: 'Alerte de Continuité' },
  alertDesc: { en: '30-year lease logic applied. 2 assets require beneficiary verification before 2040.', rw: 'Amategeko y’ubukode bw’imyaka 30. Imitungo 2 ikeneye kwemezwa n’abaragwa mbere ya 2040.', fr: 'Bail de 30 ans appliqué. 2 actifs nécessitent une vérification avant 2040.' },
  auditTimeline: { en: 'Audit Timeline', rw: 'Igihe cy’Igenzura', fr: 'Historique d’Audit' },
  upiLocation: { en: 'UPI & Location', rw: 'UPI n’Ahantu', fr: 'UPI & Emplacement' },
  ownershipDetails: { en: 'Ownership Details', rw: 'Ibiranga Nyirubwite', fr: 'Détails de Propriété' },
  leaseStatus: { en: 'Lease Status', rw: 'Imimerere y’Ubukode', fr: 'Statut du Bail' },
  masterPlanContext: { en: 'Master Plan Context', rw: 'Igishushanyo Mbonera', fr: 'Contexte du Plan Directeur' },
  valuation: { en: 'Valuation', rw: 'Agaciro', fr: 'Évaluation' },
  registryVerified: { en: 'Registry Verified', rw: 'Byemejwe muri Registry', fr: 'Vérifié par le Registre' },
  acquiredByParent: { en: 'Acquired By Parent', rw: 'Byatunzwe n’Ababyeyi', fr: 'Acquis par les Parents' },
  yearsRemaining: { en: 'Years Remaining', rw: 'Imyaka Isigaye', fr: 'Années Restantes' },
  parcelRegistry: { en: 'Rwanda Parcel Registry', rw: 'Ibitabo by’Ubutaka mu Rwanda', fr: 'Registre des Parcelles du Rwanda' },
  parcelDesc: { en: 'Click on a satellite coordinate to define your family asset. All points must be linked to a valid UPI.', rw: 'Kanda ku ikarita kugira ngo ugaragaze umutungo. Ahantu hose hagomba kuba hafite UPI iboneye.', fr: 'Cliquez sur une coordonnée satellite pour définir votre actif. Tous les points doivent être liés à un UPI valide.' },
  masterPlanSync: { en: 'National Master Plan Compliance Sync', rw: 'Igereranya n’Igishushanyo Mbonera', fr: 'Synchro Plan Directeur National' },
  masterPlanDesc: { en: 'Every asset registered in MyAsset is automatically cross-referenced with your regional Master Plan.', rw: 'Umutungo wose wanditse ugereranywa n’igishushanyo mbonera cy’akarere biherereyemo.', fr: 'Chaque actif est automatiquement comparé au plan directeur régional.' },
  browseMasterPlans: { en: 'Browse Open UPI Master Plans', rw: 'Reba Ibishushanyo Mbonera', fr: 'Parcourir les Plans Directeurs' },
  frameworkDesc: { en: 'Official Rwanda land usage framework for all provinces.', rw: 'Amategeko agenga ikoreshwa ry’ubutaka mu Rwanda mu ntara zose.', fr: 'Cadre officiel d’utilisation des terres pour toutes les provinces.' },

  // Residential
  residentialHeader: { en: 'Residential Estate', rw: 'Imitungo y’Inyubako', fr: 'Patrimoine Résidentiel' },
  residentialDesc: { en: 'Tracking family homes, rental yields, and tenant continuity.', rw: 'Gukurikirana amazu y’umuryango, inyungu, n’uburyo akodeshwa.', fr: 'Suivi des résidences familiales, des rendements et des locataires.' },
  occupancyRate: { en: 'Occupancy Rate', rw: 'Ijanisha ry’Abayakodesha', fr: 'Taux d’Occupation' },
  monthlyYield: { en: 'Monthly Yield', rw: 'Inyungu ku kwezi', fr: 'Rendement Mensuel' },
  maintenanceHub: { en: 'Maintenance Hub', rw: 'Ibikorerwa Inyubako', fr: 'Centre de Maintenance' },
  rented: { en: 'Rented', rw: 'Kukodeshwa', fr: 'Loué' },
  available: { en: 'Available', rw: 'Bihari', fr: 'Disponible' },
  familyOccupied: { en: 'Family Occupied', rw: 'Irimo Umuryango', fr: 'Occupé par la Famille' },
  tenantHistory: { en: 'Tenant History', rw: 'Amateka y’Abayakodesha', fr: 'Historique Locataire' },
  manageProperty: { en: 'Manage Property', rw: 'Cunga Inyubako', fr: 'Gérer la Propriété' },

  // Vehicles
  vehiclesDesc: { en: 'Tracking family automotive assets, insurance lifecycles, and registry status.', rw: 'Gukurikirana imodoka z’umuryango, ubwishingizi, n’inyandiko zazo.', fr: 'Suivi des véhicules, des assurances et du statut du registre.' },
  activeFleet: { en: 'Active Fleet', rw: 'Ibinyabiziga Bikoreshwa', fr: 'Flotte Active' },
  insuranceCompliance: { en: 'Insurance Compliance', rw: 'Ubwishingizi', fr: 'Conformité Assurance' },
  upcomingServices: { en: 'Upcoming Services', rw: 'Ibisubizo Bitaha', fr: 'Services à Venir' },
  trackAsset: { en: 'Track Asset', rw: 'Gukurikirana', fr: 'Suivre l’Actif' },
  mobileWealth: { en: 'Securing Mobile Family Wealth', rw: 'Kurinda Umutungo Ukururwa', fr: 'Sécuriser le Patrimoine Mobile' },

  // Vault
  vaultDesc: { en: 'Secure storage for your global land portfolio. Manage deeds, environmental impact assessments, and legal frameworks.', rw: 'Ububiko buzewe bw’inyandiko z’umutungo. Cunga amasezerano, ibyemezo n’amategeko.', fr: 'Stockage sécurisé pour vos titres. Gérez les actes, évaluations et cadres légaux.' },
  secureStorage: { en: 'Secure Storage', rw: 'Ububiko Buzewe', fr: 'Stockage Sécurisé' },
  documentClass: { en: 'Document Class', rw: 'Ubwoko bw’Inyandiko', fr: 'Catégorie de Document' },
  registryCode: { en: 'Registry Code', rw: 'Nomero y’Inyandiko', fr: 'Code du Registre' },
  lastVerified: { en: 'Last Verified', rw: 'Byemejwe bwa nyuma', fr: 'Dernière Vérification' },

  // Settings
  globalPreferences: { en: 'Global Preferences', rw: 'Igenamiterere rusange', fr: 'Préférences' },
  pushNotifications: { en: 'Push Notifications', rw: 'Imenyesha-kubaho', fr: 'Notifications' },
  darkMode: { en: 'Dark Mode', rw: 'Uburyo bwijimye', fr: 'Mode Sombre' },
  language: { en: 'Region & Language', rw: 'Akarere n’Ururimi', fr: 'Région & Langue' },
  securityAccess: { en: 'Security & Access', rw: 'Umutekano n’Iyinjira', fr: 'Sécurité et Accès' },

  // Auth
  secureLogin: { en: 'Secure Login', rw: 'Injira neza', fr: 'Connexion Sécurisée' },
  registerEstate: { en: 'Register Estate', rw: 'Andika Umutungo', fr: 'Enregistrer le Patrimoine' },
  familyStewardship: { en: 'Family Stewardship', rw: 'Uburere bw’Umuryango', fr: 'Gouvernance Familiale' },
  parentAdmin: { en: 'Parent / Admin', rw: 'Umubyeyi / Umuyobozi', fr: 'Parent / Admin' },
  childUser: { en: 'Child / User', rw: 'Umwana / Umukoresha', fr: 'Enfant / Utilisateur' },
  joinRegistry: { en: 'Join your family estate registry', rw: 'Injira muri registry y’umuryango', fr: 'Rejoindre le registre familial' },
  alreadyRegistered: { en: 'Already registered? Login here', rw: 'Waba usanzwe ufite konti? Injira hano', fr: 'Déjà inscrit ? Connectez-vous' },
  legacyTagline: { en: 'Securing family legacy through generational stewardship.', rw: 'Kurinda umurage w’umuryango mu bihe bizaza.', fr: 'Sécuriser l’héritage familial pour les générations futures.' },

  // Family & Stewardship
  registryStewards: { en: 'Registry of Stewards', rw: 'Inama y’Abarinzi b’Umutungo', fr: 'Registre des Intendants' },
  totalMembers: { en: 'Total Members', rw: 'Abagize Umuryango', fr: 'Total des Membres' },
  successionStrategy: { en: 'Digital Inheritance & Succession Strategy', rw: 'Ingamba z’Uruhererekane n’Umurage', fr: 'Stratégie d’Héritage et Succession' },
  successionDesc: { en: 'Define automated asset transfer protocols. Our smart-contract layer ensures seamless handoffs.', rw: 'Andika uko umutungo uzaragawa. Amategeko yacu afasha guhererekanya umurage neza.', fr: 'Définissez les protocoles de transfert. Notre couche technique assure des transitions fluides.' },
  trustDistribution: { en: 'Active Trust Distribution', rw: 'Uko Umutungo Wagabanyijwe', fr: 'Distribution Active du Trust' },
  lockedConsensus: { en: 'All distribution parameters are currently LOCKED under multi-sig consensus.', rw: 'Ibijyanye n’igabana ry’umutungo BIRAFUNZE kugeza hemejwe n’ubuyobozi.', fr: 'Tous les paramètres de distribution sont VERROUILLÉS sous consensus multi-signatures.' },
  configureProtocol: { en: 'Configure Protocol', rw: 'Emeza Amategeko', fr: 'Configurer le Protocole' },

  // Profile
  editProfile: { en: 'Edit Profile', rw: 'Hindura Umwirondoro', fr: 'Modifier le Profil' },
  saveUpdates: { en: 'Save Updates', rw: 'Bika Ibyahinduwe', fr: 'Enregistrer' },
  cancel: { en: 'Cancel', rw: 'Agura', fr: 'Annuler' },
  manageCredentials: { en: 'Manage your personal credentials and estate access levels.', rw: 'Cunga imyirondoro yawe n’uko winjira muri Registry.', fr: 'Gérez vos identifiants et vos niveaux d’accès au domaine.' },
  stewardshipRole: { en: 'Stewardship', rw: 'Uburere', fr: 'Gouvernance' },
  emailAddress: { en: 'Email Address', rw: 'Imeri yawe', fr: 'Adresse E-mail' },
  securityProtocol: { en: 'Security Protocol', rw: 'Umutekano w’Iyinjira', fr: 'Protocole de Sécurité' },
  biometricEnabled: { en: '2FA - Biometric Enabled', rw: 'Umutekano wifashisha urutoki', fr: '2FA - Biométrie Activée' },
  lastRegistryUpdate: { en: 'Last Registry Update', rw: 'Iheruka Kuvugururwa', fr: 'Dernière Mise à Jour' },
  accessExpiration: { en: 'Access Expiration', rw: 'Igihe cyo Gucyurirwa', fr: 'Expiration de l’Accès' },
  revokeAccess: { en: 'Revoke Global Access', rw: 'Hagarika Iyinjira', fr: 'Révoquer l’Accès' }
};

interface LanguageContextType {
  language: Language;
  currency: string;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatCurrency: (value: number) => string;
  convertToBase: (localValue: number) => number; 
  convertToLocal: (baseValue: number) => number;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    if (saved) return saved as Language;
    
    // Auto-detect based on locale
    const locale = navigator.language.toLowerCase();
    if (locale.includes('rw')) return 'rw';
    if (locale.includes('fr')) return 'fr';
    return 'en';
  });

  const currency = useMemo(() => {
    // Advanced Geo-Timezone Detection
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = navigator.language.toLowerCase();

    // Rwanda Detection
    if (tz === 'Africa/Kigali' || locale.includes('rw')) return 'RWF';
    
    // Europe / French Detection
    if (tz.startsWith('Europe/') || locale.includes('fr') || locale.includes('be') || locale.includes('ch')) return 'EUR';
    
    // Middle East (Common for diaspora stewards)
    if (tz.includes('Dubai') || tz.includes('Riyadh')) return 'AED';

    // UK
    if (tz === 'Europe/London' || locale.includes('gb')) return 'GBP';

    // Default to Global Base
    return 'USD';
  }, [language]);

  const exchangeRates: Record<string, number> = {
    'RWF': 1315,
    'EUR': 0.92,
    'AED': 3.67,
    'GBP': 0.79,
    'USD': 1
  };

  const formatCurrency = (value: number) => {
    // We assume incoming 'value' is stored in USD
    const convertedValue = value * (exchangeRates[currency] || 1);
    
    return new Intl.NumberFormat(localeForCurrency(currency), {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(convertedValue);
  };

  const convertToBase = (localValue: number) => {
    const rate = exchangeRates[currency] || 1;
    return localValue / rate;
  };

  const convertToLocal = (baseValue: number) => {
    const rate = exchangeRates[currency] || 1;
    return baseValue * rate;
  };

  const localeForCurrency = (curr: string) => {
    switch(curr) {
      case 'RWF': return 'rw-RW';
      case 'EUR': return 'fr-FR';
      case 'AED': return 'ar-AE';
      case 'GBP': return 'en-GB';
      default: return 'en-US';
    }
  };

  const t = (key: string) => {
    if (!translations[key]) return key;
    return translations[key][language];
  };

  const updateLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, currency, setLanguage: updateLanguage, t, formatCurrency, convertToBase, convertToLocal }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
