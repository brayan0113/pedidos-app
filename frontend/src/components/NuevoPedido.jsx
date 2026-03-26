import { useState, useEffect } from 'react';
import { getMenu } from '../api/menu';
import { crearPedido } from '../api/pedidos';
import { useAuth } from '../context/AuthContext';

export default function NuevoPedido({ onPedidoCreado }) {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');
  const [busquedaMenu, setBusquedaMenu] = useState('');

  useEffect(() => {
    getMenu().then(items => setMenuItems(items.filter(i => i.disponible)));
  }, []);

  const agregarItem = (item) => {
    setCarrito(prev => {
      const existe = prev.find(c => c.item.id === item.id);
      if (existe) return prev.map(c => c.item.id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c);
      return [...prev, { item, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(prev =>
      prev.map(c => c.item.id === id ? { ...c, cantidad: Math.max(0, c.cantidad + delta) } : c)
          .filter(c => c.cantidad > 0)
    );
  };

  const total = carrito.reduce((s, c) => s + c.item.precio * c.cantidad, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cliente.trim()) { setError('El nombre del cliente es requerido'); return; }
    if (carrito.length === 0) { setError('Agrega al menos un producto'); return; }

    setGuardando(true);
    setError('');
    try {
      await crearPedido({
        cliente: cliente.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        notas: notas.trim(),
        productos: carrito.map(c => ({ nombre: c.item.nombre, cantidad: c.cantidad, precio: c.item.precio })),
        total,
        atendido_por: user?.nombre || ''
      });
      setExito(true);
      setCliente(''); setTelefono(''); setDireccion(''); setNotas(''); setCarrito([]);
      setTimeout(() => { setExito(false); onPedidoCreado?.(); }, 1500);
    } catch {
      setError('No se pudo guardar el pedido. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // Filtrar menú por búsqueda
  const itemsFiltrados = busquedaMenu.trim()
    ? menuItems.filter(i =>
        i.nombre.toLowerCase().includes(busquedaMenu.toLowerCase()) ||
        i.categoria.toLowerCase().includes(busquedaMenu.toLowerCase())
      )
    : menuItems;

  const categorias = [...new Set(itemsFiltrados.map(i => i.categoria))];
  const totalItems = carrito.reduce((s, c) => s + c.cantidad, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Panel izquierdo: menú */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Seleccionar productos</h2>
          {totalItems > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems} en carrito
            </span>
          )}
        </div>

        {/* Búsqueda de menú */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busquedaMenu}
            onChange={e => setBusquedaMenu(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {categorias.length === 0 && (
          <p className="text-sm text-gray-400 py-8 text-center">No hay productos disponibles</p>
        )}
        {categorias.map(cat => (
          <div key={cat}>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{cat}</p>
            <div className="space-y-2">
              {itemsFiltrados.filter(i => i.categoria === cat).map(item => {
                const enCarrito = carrito.find(c => c.item.id === item.id);
                return (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.nombre}</p>
                      {item.descripcion && <p className="text-xs text-gray-400 truncate">{item.descripcion}</p>}
                      <p className="text-sm font-semibold text-amber-600 mt-0.5">${item.precio.toLocaleString('es-CO')}</p>
                    </div>
                    {enCarrito ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => cambiarCantidad(item.id, -1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg leading-none"
                        >−</button>
                        <span className="w-6 text-center text-sm font-semibold">{enCarrito.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidad(item.id, 1)}
                          className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center text-white font-bold text-lg leading-none"
                        >+</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => agregarItem(item)}
                        className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Agregar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Panel derecho: datos del pedido */}
      <div className="lg:w-80 space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Datos del pedido</h2>

        {/* Atendido por (info automática) */}
        {user && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
            <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <p className="text-xs text-indigo-700">Atendido por: <span className="font-semibold">{user.nombre}</span></p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Datos cliente */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Nombre del cliente *</label>
              <input
                value={cliente}
                onChange={e => setCliente(e.target.value)}
                placeholder="Ej: María García"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Teléfono</label>
              <input
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="Ej: 3001234567"
                type="tel"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Dirección</label>
              <input
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                placeholder="Ej: Calle 10 #5-20"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Notas</label>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Ej: Sin cebolla, extra salsa..."
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>
          </div>

          {/* Resumen carrito */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Resumen</p>
            {carrito.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Ningún producto seleccionado</p>
            ) : (
              <div className="space-y-2 mb-3">
                {carrito.map(c => (
                  <div key={c.item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 truncate mr-2">{c.item.nombre} <span className="text-gray-400">x{c.cantidad}</span></span>
                    <span className="font-medium shrink-0">${(c.item.precio * c.cantidad).toLocaleString('es-CO')}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span className="text-amber-600">${total.toLocaleString('es-CO')}</span>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          {exito && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
              Pedido creado correctamente
            </div>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
          >
            {guardando ? 'Guardando...' : 'Crear pedido'}
          </button>
        </form>
      </div>
    </div>
  );
}
