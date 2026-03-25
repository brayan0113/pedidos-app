import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPedidos } from './api/pedidos';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Stats from './components/Stats';
import OrderCard from './components/OrderCard';
import OrderDetail from './components/OrderDetail';
import MenuSection from './components/MenuSection';
import NuevoPedido from './components/NuevoPedido';
import Login from './components/Login';

const FILTROS = [
  { value: 'todos',      label: 'Todos' },
  { value: 'nuevo',      label: 'Nuevos' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'listo',      label: 'Listos' },
  { value: 'entregado',  label: 'Entregados' },
  { value: 'cancelado',  label: 'Cancelados' },
];

function computeStats(lista) {
  return {
    total:      lista.length,
    nuevo:      lista.filter(p => p.estado === 'nuevo').length,
    en_proceso: lista.filter(p => p.estado === 'en_proceso').length,
    listo:      lista.filter(p => p.estado === 'listo').length,
    entregado:  lista.filter(p => p.estado === 'entregado').length,
    cancelado:  lista.filter(p => p.estado === 'cancelado').length,
    ingresos_hoy: lista
      .filter(p => p.estado !== 'cancelado')
      .reduce((s, p) => s + (p.total || 0), 0),
  };
}

// Íconos reutilizables
const IconPedidos = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
  </svg>
);
const IconHistorial = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);
const IconNuevo = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
  </svg>
);
const IconMenu = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
  </svg>
);

export default function App() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return <AppInner />;
}

function AppInner() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('hoy');
  const [pedidos, setPedidos] = useState([]);
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
      const data = await getPedidos();
      setPedidos(data);
      setUltimaActualizacion(new Date());
    } catch {
      setError('No se pudo conectar al servidor. ¿Está el backend corriendo?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, [cargar]);

  // Limpiar búsqueda y filtro al cambiar de tab
  const cambiarTab = (nuevoTab) => {
    setTab(nuevoTab);
    setBusqueda('');
    setFiltro('todos');
  };

  const HOY = new Date().toISOString().slice(0, 10);

  // Pedidos de hoy
  const pedidosHoy = useMemo(
    () => pedidos.filter(p => p.fecha.startsWith(HOY)),
    [pedidos, HOY]
  );

  // Pedidos según tab activo
  const pedidosBase = tab === 'historial' ? pedidos : pedidosHoy;

  // Aplicar filtro de estado y búsqueda
  const pedidosFiltrados = useMemo(() => {
    let lista = filtro !== 'todos' ? pedidosBase.filter(p => p.estado === filtro) : pedidosBase;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(p =>
        p.cliente.toLowerCase().includes(q) ||
        p.telefono?.includes(busqueda) ||
        p.productos?.some(pr => pr.nombre?.toLowerCase().includes(q)) ||
        p.atendido_por?.toLowerCase().includes(q)
      );
    }
    return lista;
  }, [pedidosBase, filtro, busqueda]);

  // Stats para el tab activo
  const stats = useMemo(() => computeStats(pedidosBase), [pedidosBase]);

  // Tabs según rol
  const tabs = [
    { key: 'hoy',      label: 'Hoy',      icon: <IconPedidos /> },
    ...(isAdmin ? [{ key: 'historial', label: 'Historial', icon: <IconHistorial /> }] : []),
    { key: 'nuevo',    label: 'Nuevo pedido', icon: <IconNuevo /> },
    ...(isAdmin ? [{ key: 'menu',      label: 'Menú',      icon: <IconMenu /> }] : []),
  ];

  const mostrarLista = tab === 'hoy' || tab === 'historial';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header ultimaActualizacion={ultimaActualizacion} onRefresh={cargar} loading={loading} />

      {/* Tabs desktop */}
      <div className="hidden md:block bg-white border-b border-gray-200 sticky top-[61px] z-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => cambiarTab(t.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.key
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.icon}
                {t.label}
                {t.key === 'hoy' && stats.nuevo > 0 && (
                  <span className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {stats.nuevo}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navegación inferior móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex safe-pb">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => cambiarTab(t.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 transition-colors ${
              tab === t.key ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <div className="relative">
              {t.icon}
              {t.key === 'hoy' && stats.nuevo > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {stats.nuevo > 9 ? '9+' : stats.nuevo}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">{t.label === 'Nuevo pedido' ? 'Nuevo' : t.label}</span>
          </button>
        ))}
      </nav>

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {tab === 'menu' && isAdmin && <MenuSection />}
        {tab === 'nuevo' && <NuevoPedido onPedidoCreado={() => { cambiarTab('hoy'); cargar(); }} />}

        {mostrarLista && (
          <>
            {/* Título del tab */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">
                  {tab === 'historial' ? 'Historial de pedidos' : 'Pedidos de hoy'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {tab === 'historial'
                    ? `${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''} en total`
                    : new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            {/* Stats */}
            <Stats stats={stats} esHistorial={tab === 'historial'} />

            {/* Búsqueda */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono, producto o mesero..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Filtros de estado */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
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
                  {f.value !== 'todos' && stats[f.value] > 0 && (
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

            {/* Lista */}
            {!error && (
              <>
                <p className="text-sm text-gray-500">
                  {pedidosFiltrados.length === 0 ? 'Sin pedidos' :
                    `${pedidosFiltrados.length} pedido${pedidosFiltrados.length !== 1 ? 's' : ''}`}
                </p>

                {pedidosFiltrados.length === 0 && !loading ? (
                  <div className="text-center py-16">
                    <p className="text-5xl mb-3">📭</p>
                    <p className="text-gray-500 font-medium">No hay pedidos</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {busqueda
                        ? 'Intenta otra búsqueda'
                        : tab === 'hoy'
                          ? 'Aún no hay pedidos hoy'
                          : 'Los pedidos de WhatsApp aparecerán aquí'}
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
          onUpdate={() => { cargar(); setSelectedPedido(null); }}
        />
      )}
    </div>
  );
}
