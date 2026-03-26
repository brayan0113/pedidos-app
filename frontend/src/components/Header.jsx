import { useAuth } from '../context/AuthContext';

export default function Header({ ultimaActualizacion, onRefresh, loading, sonidoActivo, onToggleSonido }) {
  const { user, logout, isAdmin } = useAuth();

  const hora = ultimaActualizacion
    ? ultimaActualizacion.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo + título */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4.5 h-4.5 w-[18px] h-[18px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 leading-tight text-sm sm:text-base tracking-tight">Pedify</h1>
            <p className="text-xs text-gray-400 hidden sm:block">Actualizado: {hora}</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Botón sonido */}
          {onToggleSonido && (
            <button
              onClick={onToggleSonido}
              title={sonidoActivo ? 'Silenciar notificaciones' : 'Activar notificaciones'}
              className={`p-1.5 rounded-lg transition-colors ${
                sonidoActivo
                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                  : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {sonidoActivo ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M9 9H5l-2 2v2l2 2h4l5 5V4L9 9z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
                </svg>
              )}
            </button>
          )}

          {/* Botón actualizar */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span className="hidden sm:inline">{loading ? 'Cargando...' : 'Actualizar'}</span>
          </button>

          {/* Usuario + rol */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-gray-800 leading-tight">{user.nombre}</span>
                <span className={`text-xs leading-tight font-medium ${isAdmin ? 'text-purple-600' : 'text-blue-600'}`}>
                  {isAdmin ? 'Admin' : 'Mesero'}
                </span>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`}>
                {user.nombre[0]?.toUpperCase()}
              </div>
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
