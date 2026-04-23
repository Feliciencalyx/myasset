import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { API_BASE } from '../config';

// --- Types ---
export interface LandAsset {
  id: string;
  upi: string;
  title: string;
  location: { lat: number; lng: number };
  address: string;
  zoning: string;
  masterPlan: string;
  size: string;
  purchaseDate: string;
  expiryDate: string;
  status: string;
  remainingYears: number;
  valuation: string;
}

export interface Vehicle {
  id: string;
  model: string;
  reg: string;
  insuranceExpiry: string;
  status: string;
  owner: string;
  location: string;
  lastService: string;
  img: string;
}

export interface Residential {
  id: string;
  name: string;
  location: string;
  status: string;
  tenant: string | null;
  leaseStart: string | null;
  leaseEnd: string | null;
  monthlyRent: string;
  valuation: string; // New: Manual Valuation Entry
  appreciation: string;
  img: string;
  linkedUPI?: string;
}

interface EstateContextType {
  landAssets: LandAsset[];
  vehicleFleet: Vehicle[];
  residentialAssets: Residential[];
  activeSearchUPI: string | null;
  setActiveSearchUPI: (upi: string | null) => void;
  activeTab: string; 
  setActiveTab: (tab: string) => void; 
  addLandAsset: (asset: Omit<LandAsset, 'id'>) => Promise<void>;
  updateLandAsset: (id: string, asset: Omit<LandAsset, 'id'>) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<void>;
  addResidentialAsset: (asset: Omit<Residential, 'id'>) => Promise<void>;
  updateResidentialAsset: (id: string, asset: Omit<Residential, 'id'>) => Promise<void>;
  removeLandAsset: (id: string) => Promise<void>;
  removeVehicle: (id: string) => Promise<void>;
  removeResidentialAsset: (id: string) => Promise<void>;
  totalConsolidatedValue: string;
  totalLandHA: string;
  totalResidentialYield: string;
  loading: boolean;
}

const EstateContext = createContext<EstateContextType | undefined>(undefined);

export function EstateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { formatCurrency } = useLanguage();
  const [landAssets, setLandAssets] = useState<LandAsset[]>([]);
  const [vehicleFleet, setVehicleFleet] = useState<Vehicle[]>([]);
  const [residentialAssets, setResidentialAssets] = useState<Residential[]>([]);
  const [activeSearchUPI, setActiveSearchUPI] = useState<string | null>(null);
  const [activeTab, setActiveTabInternal] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [land, res, veh] = await Promise.all([
        fetch(`${API_BASE}/api/assets/land`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API_BASE}/api/assets/residential`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API_BASE}/api/assets/vehicles`, { credentials: 'include' }).then(r => r.json())
      ]);

      setLandAssets(land.map((a: any) => {
        const expiry = new Date(a.EXPIRY_DATE);
        const now = new Date();
        const diff = Math.max(0, expiry.getFullYear() - now.getFullYear());
        
        return {
          id: a.ID, upi: a.UPI, title: a.TITLE, address: a.ADDRESS,
          zoning: a.ZONING, masterPlan: a.MASTER_PLAN, size: a.SIZE_HA,
          purchaseDate: a.PURCHASE_DATE, expiryDate: a.EXPIRY_DATE,
          status: a.STATUS, valuation: a.VALUATION || '0',
          location: { lat: Number(a.LAT), lng: Number(a.LNG) },
          remainingYears: diff
        };
      }));

      setResidentialAssets(res.map((a: any) => ({
        id: a.ID, name: a.NAME, location: a.LOCATION, status: a.STATUS,
        tenant: a.TENANT, leaseStart: a.LEASE_START, leaseEnd: a.LEASE_END,
        monthlyRent: a.MONTHLY_RENT, valuation: a.VALUATION || '0', appreciation: a.APPRECIATION, img: a.IMG_URL,
        linkedUPI: a.LINKED_UPI
      })));

      setVehicleFleet(veh.map((v: any) => ({
        id: v.ID, model: v.MODEL, reg: v.REG, insuranceExpiry: v.INSURANCE_EXPIRY,
        status: v.STATUS, owner: v.OWNER, location: v.LOCATION,
        lastService: v.LAST_SERVICE, img: v.IMG_URL
      })));
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [user]);

  const addLandAsset = async (asset: Omit<LandAsset, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE}/api/assets/land`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        //@ts-ignore
        credentials: 'include',
        body: JSON.stringify(asset)
      });
      if (response.ok) {
        await fetchAssets();
      }
    } catch (err) {}
  };

  const updateLandAsset = async (id: string, asset: Omit<LandAsset, 'id'>) => {
    try {
      await fetch(`${API_BASE}/api/assets/land/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        //@ts-ignore
        credentials: 'include',
        body: JSON.stringify(asset)
      });
      await fetchAssets();
    } catch (err) {}
  };

  const addResidentialAsset = async (asset: Omit<Residential, 'id'>) => {
    try {
      await fetch(`${API_BASE}/api/assets/residential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        //@ts-ignore
        credentials: 'include',
        body: JSON.stringify(asset)
      });
      await fetchAssets();
    } catch (err) {}
  };

  const updateResidentialAsset = async (id: string, asset: Omit<Residential, 'id'>) => {
    try {
      await fetch(`${API_BASE}/api/assets/residential/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        //@ts-ignore
        credentials: 'include',
        body: JSON.stringify(asset)
      });
      await fetchAssets();
    } catch (err) {}
  };
  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    try {
      await fetch(`${API_BASE}/api/assets/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        //@ts-ignore
        credentials: 'include',
        body: JSON.stringify(vehicle)
      });
      await fetchAssets();
    } catch (err) {}
  };

  const removeLandAsset = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/assets/land/${id}`, { method: 'DELETE', credentials: 'include' });
      await fetchAssets();
    } catch (e) {}
  };

  const removeVehicle = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/assets/vehicles/${id}`, { method: 'DELETE', credentials: 'include' });
      await fetchAssets();
    } catch (e) {}
  };

  const removeResidentialAsset = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/assets/residential/${id}`, { method: 'DELETE', credentials: 'include' });
      await fetchAssets();
    } catch (e) {}
  };

  const parseCurrency = (val: string) => Number(val ? val.toString().replace(/[^0-9.-]+/g,"") : 0);
  
  const landVal = landAssets.reduce((sum, item) => sum + parseCurrency(item.valuation), 0);
  const resVal = residentialAssets.reduce((sum, item) => sum + parseCurrency(item.valuation), 0); 
  
  const totalLandHA = landAssets.reduce((sum, item) => sum + Number(item.size ? item.size.toString().replace(/[^0-9.]+/g,"") : 0), 0).toFixed(1) + ' HA';
  const totalYield = residentialAssets.reduce((sum, item) => sum + parseCurrency(item.monthlyRent), 0);

  return (
    <EstateContext.Provider value={{
      landAssets, vehicleFleet, residentialAssets,
      activeSearchUPI, setActiveSearchUPI,
      activeTab, setActiveTab: setActiveTabInternal,
      addLandAsset, updateLandAsset, addVehicle, addResidentialAsset, updateResidentialAsset,
      removeLandAsset, removeVehicle, removeResidentialAsset,
      totalConsolidatedValue: formatCurrency(landVal + resVal),
      totalLandHA,
      totalResidentialYield: formatCurrency(totalYield),
      loading
    }}>
      {children}
    </EstateContext.Provider>
  );
}

export function useEstate() {
  const context = useContext(EstateContext);
  if (context === undefined) {
    throw new Error('useEstate must be used within an EstateProvider');
  }
  return context;
}
