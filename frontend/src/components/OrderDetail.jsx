import { useState } from 'react';
import { actualizarEstado, eliminarPedido } from '../api/pedidos';
import { useAuth } from '../context/AuthContext';

const ESTADOS = [
  { value: 'nuevo',      label: 'Nuevo',      color: 'bg-blue-500' },
  { value: 'en_proceso', label: 'En proceso', color: 'bg-yellow-500' },
  { value: 'listo',      label: 'Listo',      color: 'bg-green-500' },
  { value: 'entregado',  label: 'Entregado',  color: 'bg-purple-500' },
  { value: 'cancelado',  label: 'Cancelado',  color: 'bg-red-500' },
];

const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

export default function OrderDetail({ pedido, onClose, onUpdate }) {
  const { isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!pedido) return null;

  const handleEstado = async (nuevoEstado) => {
    setSaving(true);
    try {
      await actualizarEstado(pedido.id, nuevoEstado);
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    try {
      await eliminarPedido(pedido.id);
      onUpdate();
      onClose();
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  const fecha = new Date(pedido.fecha).toLocaleString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Handle móvil */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-900">Detalle del pedido</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Info cliente */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-amber-600">{pedido.cliente[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{pedido.cliente}</p>
              {pedido.telefono && (
                <a href={`https://wa.me/${pedido.telefono.replace(/\D/g, '')}`}
                   target="_blank" rel="noopener noreferrer"
                   className="text-sm text-green-600 hover:underline flex items-center gap-1 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {pedido.telefono}
                </a>
              )}
              <p className="text-xs text-gray-400 mt-1">{fecha}</p>
              {pedido.fuente && (
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${
                  pedido.fuente === 'presencial'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-green-50 text-green-600'
                }`}>
                  {pedido.fuente === 'presencial' ? 'Presencial' : 'WhatsApp'}
                </span>
              )}
            </div>
          </div>

          {/* Atendido por */}
          {pedido.atendido_por && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5">
              <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <p className="text-sm text-indigo-700">
                <span className="font-medium">Atendido por:</span> {pedido.atendido_por}
              </p>
            </div>
          )}

          {/* Productos */}
          {pedido.productos?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Productos</p>
              <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                {pedido.productos.map((p, i) => (
                  <div key={i} className="flex justify-between items-center px-3 py-2.5">
                    <span className="text-sm text-gray-800">
                      {p.cantidad && <span className="font-semibold text-amber-600 mr-1">{p.cantidad}x</span>}
                      {p.nombre}
                    </span>
                    {p.precio > 0 && <span className="text-sm font-medium text-gray-700">{fmtCOP(p.precio * (p.cantidad || 1))}</span>}
                  </div>
                ))}
              </div>
              {pedido.total > 0 && (
                <div className="flex justify-between items-center mt-2 px-3">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-base font-bold text-amber-600">{fmtCOP(pedido.total)}</span>
                </div>
              )}
            </div>
          )}

          {/* Dirección */}
          {pedido.direccion && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Dirección</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5">{pedido.direccion}</p>
            </div>
          )}

          {/* Notas */}
          {pedido.notas && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notas</p>
              <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2.5">{pedido.notas}</p>
            </div>
          )}

          {/* Cambiar estado */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cambiar estado</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {ESTADOS.map(e => (
                <button
                  key={e.value}
                  onClick={() => handleEstado(e.value)}
                  disabled={saving || pedido.estado === e.value}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all
                    ${pedido.estado === e.value
                      ? `${e.color} text-white shadow-sm scale-95`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                    disabled:cursor-not-allowed`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer — solo admin puede eliminar */}
        {isAdmin && (
          <div className="px-5 py-3 border-t border-gray-100">
            <button
              onClick={handleDelete}
              disabled={saving}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors
                ${confirmDelete
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
            >
              {confirmDelete ? '¿Confirmar eliminación?' : 'Eliminar pedido'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
