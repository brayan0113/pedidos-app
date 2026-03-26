const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

const IconBox = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
  </svg>
);
const IconNew = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4"/>
  </svg>
);
const IconClock = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);
const IconCheck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);
const IconTruck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zm-13.5-5H3V6a1 1 0 011-1h9v11m0 0H8.5m7 0V5m0 0h2.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0121 8.414V17h-1.5"/>
  </svg>
);

function StatCard({ label, value, color, iconColor, Icon }) {
  return (
    <div className={`bg-white rounded-xl border-l-4 ${color} p-3 sm:p-4 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide leading-tight">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
        <span className={iconColor}><Icon /></span>
      </div>
    </div>
  );
}

export default function Stats({ stats, esHistorial = false }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
      <StatCard label="Total"      value={stats.total}      color="border-gray-400"   iconColor="text-gray-400"   Icon={IconBox}   />
      <StatCard label="Nuevos"     value={stats.nuevo}      color="border-blue-400"   iconColor="text-blue-400"   Icon={IconNew}   />
      <StatCard label="En proceso" value={stats.en_proceso} color="border-yellow-400" iconColor="text-yellow-500" Icon={IconClock} />
      <StatCard label="Listos"     value={stats.listo}      color="border-green-400"  iconColor="text-green-500"  Icon={IconCheck} />
      <StatCard label="Entregados" value={stats.entregado}  color="border-purple-400" iconColor="text-purple-400" Icon={IconTruck} />
      <div className="bg-white rounded-xl border-l-4 border-amber-500 p-3 sm:p-4 shadow-sm col-span-2 sm:col-span-3 lg:col-span-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide leading-tight">
          {esHistorial ? 'Ingresos total' : 'Ingresos hoy'}
        </p>
        <p className="text-base sm:text-lg font-bold text-amber-600 mt-0.5">{fmtCOP(stats.ingresos_hoy)}</p>
      </div>
    </div>
  );
}
