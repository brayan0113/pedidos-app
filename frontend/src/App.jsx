import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getPedidos } from './api/pedidos';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Stats from './components/Stats';
import OrderCard from './components/OrderCard';
import OrderDetail from './components/OrderDetail';
import MenuSection from './components/MenuSection';
import NuevoPedido from './components/NuevoPedido';
import Login from './components/Login';
import { playNotificationSound, requestNotificationPermission, showBrowserNotification } from './utils/notifications';

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

// Convierte ISO a fecha local 'YYYY-MM-DD'
function fechaLocal(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Fecha local de hoy 'YYYY-MM-DD'
function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

function fmtFechaEncabezado(yyyy_mm_dd) {
  const [y, m, d] = yyyy_mm_dd.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
  fecha.setHours(0, 0, 0, 0);
  if (fecha.getTime() === hoy.getTime()) return 'Hoy';
  if (fecha.getTime() === ayer.getTime()) return 'Ayer';
  return fecha.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Historial agrupado por día ───────────────────────────────────────────────
function HistorialPorDia({ pedidos, onSelectPedido }) {
  const [abiertos, setAbiertos] = useState({});

  const grupos = useMemo(() => {
    const mapa = {};
    for (const p of pedidos) {
      const dia = fechaLocal(p.fecha);
      if (!mapa[dia]) mapa[dia] = [];
      mapa[dia].push(p);
    }
    // ordenar días desc
    return Object.entries(mapa).sort((a, b) => b[0].localeCompare(a[0]));
  }, [pedidos]);

  // Abrir el primer día por defecto
  useEffect(() => {
    if (grupos.length > 0) {
      setAbiertos({ [grupos[0][0]]: true });
    }
  }, [grupos]);

  const toggle = (dia) => setAbiertos(prev => ({ ...prev, [dia]: !prev[dia] }));

  if (grupos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-gray-500 font-medium">No hay pedidos en el historial</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {grupos.map(([dia, pedidosDia]) => {
        const abierto = !!abiertos[dia];
        const totalDia = pedidosDia
          .filter(p => p.estado !== 'cancelado')
          .reduce((s, p) => s + (p.total || 0), 0);
        const titulo = fmtFechaEncabezado(dia);

        return (
          <div key={dia} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Encabezado del día — clickeable */}
            <button
              onClick={() => toggle(dia)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${abierto ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 capitalize">{titulo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {pedidosDia.length} pedido{pedidosDia.length !== 1 ? 's' : ''}
                    {pedidosDia.filter(p => p.estado === 'cancelado').length > 0 && (
                      <span className="text-red-400 ml-1">
                        · {pedidosDia.filter(p => p.estado === 'cancelado').length} cancelado{pedidosDia.filter(p => p.estado === 'cancelado').length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-green-600 text-sm">{fmtCOP(totalDia)}</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </button>

            {/* Pedidos del día */}
            {abierto && (
              <div className="border-t border-gray-100 p-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pedidosDia.map(pedido => (
                  <OrderCard key={pedido.id} pedido={pedido} onClick={onSelectPedido} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Íconos ───────────────────────────────────────────────────────────────────
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

// ─── App ──────────────────────────────────────────────────────────────────────
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
  const [toasts, setToasts] = useState([]);           // notificaciones in-app
  const [sonidoActivo, setSonidoActivo] = useState(   // preferencia guardada
    () => localStorage.getItem('pedidos_sonido') !== 'off'
  );

  // IDs conocidos — null = primera carga (no notificar)
  const knownIds = useRef(null);

  // Solicitar permiso de notificaciones del navegador al montar
  useEffect(() => { requestNotificationPermission(); }, []);

  const addToast = useCallback((pedidosNuevos) => {
    const id = Date.now();
    const msg = pedidosNuevos.length === 1
      ? `Nuevo pedido de ${pedidosNuevos[0].cliente}`
      : `${pedidosNuevos.length} nuevos pedidos`;
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const toggleSonido = useCallback(() => {
    setSonidoActivo(prev => {
      const next = !prev;
      localStorage.setItem('pedidos_sonido', next ? 'on' : 'off');
      return next;
    });
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPedidos();

      if (knownIds.current === null) {
        // Primera carga: registrar IDs existentes sin notificar
        knownIds.current = new Set(data.map(p => p.id));
      } else {
        const nuevos = data.filter(p => !knownIds.current.has(p.id));
        knownIds.current = new Set(data.map(p => p.id));
        if (nuevos.length > 0) {
          if (sonidoActivo) playNotificationSound();
          showBrowserNotification(nuevos);
          addToast(nuevos);
        }
      }

      setPedidos(data);
      setUltimaActualizacion(new Date());
    } catch {
      setError('No se pudo conectar al servidor. ¿Está el backend corriendo?');
    } finally {
      setLoading(false);
    }
  }, [sonidoActivo, addToast]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, [cargar]);

  const cambiarTab = (nuevoTab) => {
    setTab(nuevoTab);
    setBusqueda('');
    setFiltro('todos');
  };

  // Pedidos de hoy usando hora LOCAL (no UTC)
  const pedidosHoy = useMemo(() => {
    const hoy = hoyLocal();
    return pedidos.filter(p => fechaLocal(p.fecha) === hoy);
  }, [pedidos]);

  // Para historial: todos los pedidos EXCEPTO los de hoy
  const pedidosHistorial = useMemo(() => {
    const hoy = hoyLocal();
    return pedidos.filter(p => fechaLocal(p.fecha) !== hoy);
  }, [pedidos]);

  // Lista base según tab
  const pedidosBase = tab === 'historial' ? pedidosHistorial : pedidosHoy;

  // Filtros aplicados (solo para tab 'hoy')
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

  // Pedidos historial filtrados por búsqueda
  const pedidosHistorialFiltrados = useMemo(() => {
    if (!busqueda.trim()) return pedidosHistorial;
    const q = busqueda.toLowerCase();
    return pedidosHistorial.filter(p =>
      p.cliente.toLowerCase().includes(q) ||
      p.telefono?.includes(busqueda) ||
      p.productos?.some(pr => pr.nombre?.toLowerCase().includes(q)) ||
      p.atendido_por?.toLowerCase().includes(q)
    );
  }, [pedidosHistorial, busqueda]);

  const stats = useMemo(() => computeStats(pedidosHoy), [pedidosHoy]);

  const tabs = [
    { key: 'hoy',      label: 'Hoy',      icon: <IconPedidos /> },
    ...(isAdmin ? [{ key: 'historial', label: 'Historial', icon: <IconHistorial /> }] : []),
    { key: 'nuevo',    label: 'Nuevo pedido', icon: <IconNuevo /> },
    ...(isAdmin ? [{ key: 'menu',      label: 'Menú',      icon: <IconMenu /> }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header
        ultimaActualizacion={ultimaActualizacion}
        onRefresh={cargar}
        loading={loading}
        sonidoActivo={sonidoActivo}
        onToggleSonido={toggleSonido}
      />

      {/* Toasts de nuevos pedidos */}
      <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl animate-slide-in"
          >
            <span className="text-lg">🛎️</span>
            {t.msg}
          </div>
        ))}
      </div>

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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex">
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

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {tab === 'menu' && isAdmin && <MenuSection />}
        {tab === 'nuevo' && <NuevoPedido onPedidoCreado={() => { cambiarTab('hoy'); cargar(); }} />}

        {/* ── HOY ── */}
        {tab === 'hoy' && (
          <>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Pedidos de hoy</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            <Stats stats={stats} />

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

            {/* Filtros */}
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {!error && (
              <>
                <p className="text-sm text-gray-500">
                  {pedidosFiltrados.length === 0 ? 'Sin pedidos' :
                    `${pedidosFiltrados.length} pedido${pedidosFiltrados.length !== 1 ? 's' : ''}`}
                </p>
                {pedidosFiltrados.length === 0 && !loading ? (
                  <div className="text-center py-16">
                    <p className="text-5xl mb-3">📭</p>
                    <p className="text-gray-500 font-medium">No hay pedidos hoy</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {busqueda ? 'Intenta otra búsqueda' : 'Los pedidos aparecerán aquí'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {pedidosFiltrados.map(pedido => (
                      <OrderCard key={pedido.id} pedido={pedido} onClick={setSelectedPedido} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── HISTORIAL ── */}
        {tab === 'historial' && isAdmin && (
          <>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Historial de pedidos</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {pedidosHistorial.length} pedido{pedidosHistorial.length !== 1 ? 's' : ''} en días anteriores
              </p>
            </div>

            {/* Búsqueda historial */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar en el historial..."
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

            <HistorialPorDia
              pedidos={pedidosHistorialFiltrados}
              onSelectPedido={setSelectedPedido}
            />
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
