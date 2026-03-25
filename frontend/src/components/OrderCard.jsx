const ESTADO_CONFIG = {
  nuevo:      { label: 'Nuevo',      bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  en_proceso: { label: 'En proceso', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  listo:      { label: 'Listo',      bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  entregado:  { label: 'Entregado',  bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  cancelado:  { label: 'Cancelado',  bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
};

const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

function fmtFecha(iso) {
  const d = new Date(iso);
  const hoy = new Date();
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);

  const hora = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === hoy.toDateString()) return `Hoy ${hora}`;
  if (d.toDateString() === ayer.toDateString()) return `Ayer ${hora}`;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + hora;
}

export default function OrderCard({ pedido, onClick }) {
  const cfg = ESTADO_CONFIG[pedido.estado] || ESTADO_CONFIG.nuevo;
  const numProductos = pedido.productos?.length || 0;

  return (
    <div
      onClick={() => onClick(pedido)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-green-200 transition-all active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{pedido.cliente}</p>
          {pedido.telefono && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
              <span className="truncate">{pedido.telefono}</span>
            </p>
          )}
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {pedido.productos?.length > 0 && (
        <div className="mb-3 space-y-1">
          {pedido.productos.slice(0, 3).map((p, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-700 truncate">{p.cantidad && `${p.cantidad}x `}{p.nombre}</span>
              {p.precio > 0 && <span className="text-gray-500 shrink-0 ml-2">{fmtCOP(p.precio)}</span>}
            </div>
          ))}
          {numProductos > 3 && (
            <p className="text-xs text-gray-400">+{numProductos - 3} más...</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-50 gap-2">
        <div className="min-w-0">
          <span className="text-xs text-gray-400 block">{fmtFecha(pedido.fecha)}</span>
          {pedido.atendido_por && (
            <span className="text-xs text-indigo-500 truncate block">por {pedido.atendido_por}</span>
          )}
        </div>
        {pedido.total > 0 && (
          <span className="font-bold text-green-600 text-sm shrink-0">{fmtCOP(pedido.total)}</span>
        )}
      </div>
    </div>
  );
}
