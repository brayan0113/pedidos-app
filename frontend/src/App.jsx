import { useState, useEffect, useCallback } from 'react';
import { getPedidos, getStats } from './api/pedidos';
import Header from './components/Header';
import Stats from './components/Stats';
import OrderCard from './components/OrderCard';
import OrderDetail from './components/OrderDetail';
import MenuSection from './components/MenuSection';
import NuevoPedido from './components/NuevoPedido';

const FILTROS = [
  { value: 'todos',      label: 'Todos' },
  { value: 'nuevo',      label: 'Nuevos' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'listo',      label: 'Listos' },
  { value: 'entregado',  label: 'Entregados' },
  { value: 'cancelado',  label: 'Cancelados' },
];

export default function App() {
  const [tab, setTab] = useState('pedidos'); // 'pedidos' | 'nuevo' | 'menu'
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, statsData] = await Promise.all([getPedidos(filtro), getStats()]);
      setPedidos(data);
      setStats(statsData);
      setUltimaActualizacion(new Date());
    } catch (e) {
      setError('No se pudo conectar al servidor. ¿Está el backend corriendo?');
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  // Carga inicial y al cambiar filtro
  useEffect(() => { cargar(); }, [cargar]);

  // Auto-refresh cada 15 segundos
  useEffect(() => {
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, [cargar]);

  const pedidosFiltrados = busqueda.trim()
    ? pedidos.filter(p =>
        p.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.telefono?.includes(busqueda) ||
        p.productos?.some(prod => prod.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
      )
    : pedidos;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        ultimaActualizacion={ultimaActualizacion}
        onRefresh={cargar}
        loading={loading}
      />

      {/* Tabs de navegación */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-0">
            <button
              onClick={() => setTab('pedidos')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'pedidos'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Pedidos
              {stats && stats.nuevo > 0 && (
                <span className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {stats.nuevo}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('nuevo')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'nuevo'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Nuevo pedido
            </button>
            <button
              onClick={() => setTab('menu')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'menu'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              Menú
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {tab === 'menu' ? (
          <MenuSection />
        ) : tab === 'nuevo' ? (
          <NuevoPedido onPedidoCreado={() => { setTab('pedidos'); cargar(); }} />
        ) : (
          <>
            {/* Stats */}
            <Stats stats={stats} />

            {/* Búsqueda */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono o producto..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {FILTROS.map(f => (
                <button
                  key={f.value}
                  onClick={() => { setFiltro(f.value); setBusqueda(''); }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${filtro === f.value
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {f.label}
                  {stats && f.value !== 'todos' && stats[f.value] > 0 && (
                    <span className={`ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full
                      ${filtro === f.value ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {stats[f.value]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Lista de pedidos */}
            {!error && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {pedidosFiltrados.length === 0 ? 'Sin pedidos' :
                      `${pedidosFiltrados.length} pedido${pedidosFiltrados.length !== 1 ? 's' : ''}`}
                  </p>
                </div>

                {pedidosFiltrados.length === 0 && !loading ? (
                  <div className="text-center py-16">
                    <p className="text-5xl mb-3">📭</p>
                    <p className="text-gray-500 font-medium">No hay pedidos</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {busqueda ? 'Intenta otra búsqueda' : 'Los pedidos de WhatsApp aparecerán aquí'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {pedidosFiltrados.map(pedido => (
                      <OrderCard
                        key={pedido.id}
                        pedido={pedido}
                        onClick={setSelectedPedido}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Modal detalle */}
      {selectedPedido && (
        <OrderDetail
          pedido={selectedPedido}
          onClose={() => setSelectedPedido(null)}
          onUpdate={() => {
            cargar();
            setSelectedPedido(null);
          }}
        />
      )}
    </div>
  );
}
