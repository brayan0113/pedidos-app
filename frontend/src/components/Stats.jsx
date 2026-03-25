const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

function StatCard({ label, value, color, icon }) {
  return (
    <div className={`bg-white rounded-xl border-l-4 ${color} p-3 sm:p-4 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide leading-tight">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
        <span className="text-xl sm:text-2xl">{icon}</span>
      </div>
    </div>
  );
}

export default function Stats({ stats, esHistorial = false }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
      <StatCard label="Total" value={stats.total} color="border-gray-400" icon="📦" />
      <StatCard label="Nuevos" value={stats.nuevo} color="border-blue-400" icon="🆕" />
      <StatCard label="En proceso" value={stats.en_proceso} color="border-yellow-400" icon="⏳" />
      <StatCard label="Listos" value={stats.listo} color="border-green-400" icon="✅" />
      <StatCard label="Entregados" value={stats.entregado} color="border-purple-400" icon="🚚" />
      <div className="bg-white rounded-xl border-l-4 border-green-500 p-3 sm:p-4 shadow-sm col-span-2 sm:col-span-3 lg:col-span-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide leading-tight">
          {esHistorial ? 'Ingresos total' : 'Ingresos hoy'}
        </p>
        <p className="text-base sm:text-lg font-bold text-green-600 mt-0.5">{fmtCOP(stats.ingresos_hoy)}</p>
      </div>
    </div>
  );
}
