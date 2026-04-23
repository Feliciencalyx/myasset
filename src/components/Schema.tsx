import { 
  ShieldCheck, 
  Database,
  Key,
  Link2,
  Cpu,
  Navigation
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Schema() {
  const tables = [
    { 
      name: 'Users', 
      tag: 'CORE', 
      color: 'primary',
      fields: [
        { name: 'user_id', type: 'UUID [PK]', pk: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'role', type: 'ENUM' },
        { name: 'email', type: 'VARCHAR' },
      ]
    },
    { 
      name: 'Assets', 
      tag: 'CRITICAL', 
      color: 'primary-dark',
      highlight: true,
      fields: [
        { name: 'asset_id', type: 'UUID [PK]', pk: true },
        { name: 'portfolio_id', type: '[FK]', fk: true },
        { name: 'type', type: 'ENUM' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'upi', type: 'UNIQUE', special: true },
      ]
    },
    { 
      name: 'Locations', 
      color: 'surface',
      fields: [
        { name: 'location_id', type: 'UUID [PK]', pk: true },
        { name: 'asset_id', type: '[FK] [1:1]', fk: true },
        { name: 'region', type: 'VARCHAR' },
        { name: 'coordinates', type: 'POINT' },
      ]
    }
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, #002d28 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }}></div>

      <div className="relative z-10 space-y-16">
        <header className="max-w-4xl">
          <div className="flex items-center gap-3 text-on-tertiary-container bg-tertiary-container/10 px-4 py-1.5 rounded-full w-fit mb-6 border border-white/10">
            <ShieldCheck size={14} className="text-on-tertiary-container" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-on-tertiary-container">System Architecture & Schema</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black font-headline text-primary tracking-tighter mb-6 leading-tight">Terra Asset Data Model</h1>
          <p className="text-on-surface-variant text-xl leading-relaxed max-w-2xl font-medium">
            A multi-layered ecosystem defining relationships between land stewards, trust portfolios, and physical assets across the Rwandan region.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start relative">
          {/* Schematic SVG Overlay (Simplified) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-outline/20 stroke-2 fill-none" style={{ zIndex: 0 }}>
            <path d="M 250 350 H 350 V 450 H 450" />
            <path d="M 650 450 H 750 V 350 H 850" />
          </svg>

          {tables.map((table, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.15 }}
              key={i} 
              className={`relative z-10 bg-white rounded-[2rem] shadow-2xl border border-outline-variant/10 overflow-hidden ${
                table.highlight ? 'scale-110 md:-translate-y-8 ring-4 ring-primary/5' : i === 2 ? 'md:translate-y-12' : ''
              }`}
            >
              <div className={`p-5 flex items-center justify-between ${
                table.color === 'primary' ? 'bg-primary-container text-white' :
                table.color === 'primary-dark' ? 'bg-primary text-white' :
                'bg-surface-container-high text-primary'
              }`}>
                <span className="font-headline font-black text-sm uppercase tracking-widest flex items-center gap-3">
                  {i === 0 ? <Database size={16} /> : i === 1 ? <Cpu size={16} /> : <MapPin size={16} />}
                  {table.name}
                </span>
                {table.tag && <span className="text-[9px] font-black bg-white/20 px-2.5 py-1 rounded-md">{table.tag}</span>}
              </div>

              <div className="p-8 space-y-4">
                {table.fields.map((field, idx) => (
                  <div key={idx} className={`flex justify-between items-center text-xs pb-3 ${idx < table.fields.length - 1 ? 'border-b border-surface-container' : ''}`}>
                    <span className={`font-bold flex items-center gap-2 ${field.pk || field.fk ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {field.pk && <Key size={12} className="text-on-tertiary-container" />}
                      {field.fk && <Link2 size={12} className="text-primary/60" />}
                      {field.name}
                    </span>
                    <span className={`font-mono text-[9px] font-bold ${field.special ? 'text-tertiary' : 'text-outline'}`}>
                      {field.type}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="pt-12">
          <div className="glass-panel border border-outline-variant/20 rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-center gap-10 shadow-sm">
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-[0.2em] text-outline uppercase">Total Schema Objects</p>
              <p className="text-4xl font-black text-primary font-headline">42 <span className="text-lg font-medium text-outline">Entities</span></p>
            </div>
            <div className="hidden md:block h-12 w-[1px] bg-outline-variant/30"></div>
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-[0.2em] text-outline uppercase">Relationship Density</p>
              <p className="text-4xl font-black text-primary font-headline">2.4 <span className="text-lg font-medium text-outline">Avg/Table</span></p>
            </div>
            <div className="hidden md:block h-12 w-[1px] bg-outline-variant/30"></div>
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-[0.2em] text-outline uppercase">Schema Integrity</p>
              <div className="flex items-center gap-3">
                <p className="text-4xl font-black text-[#1b4f48] font-headline">Healthy</p>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapPin({ size, className }: { size: number, className?: string }) {
  return <Navigation size={size} className={className} />;
}
