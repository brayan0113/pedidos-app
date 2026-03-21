import { useState, useEffect, useCallback } from 'react';
import { getMenu, crearItem, actualizarItem, eliminarItem } from '../api/menu';

const CATEGORIAS = ['Arepas', 'Bebidas', 'Adicionales', 'Combos', 'General'];

const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

const FORM_VACIO = { nombre: '', descripcion: '', categoria: 'Arepas', precio: '' };

export default function MenuSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null); // item completo si editando, null si creando
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMenu();
      setItems(data);
    } catch {
      setError('No se pudo cargar el menú');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirCrear() {
    setEditando(null);
    setForm(FORM_VACIO);
    setModalOpen(true);
  }

  function abrirEditar(item) {
    setEditando(item);
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      categoria: item.categoria || 'General',
      precio: item.precio || ''
    });
    setModalOpen(true);
  }

  async function guardar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setGuardando(true);
    try {
      if (editando) {
        await actualizarItem(editando.id, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          categoria: form.categoria,
          precio: Number(form.precio) || 0
        });
      } else {
        await crearItem({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          categoria: form.categoria,
          precio: Number(form.precio) || 0
        });
      }
      setModalOpen(false);
      cargar();
    } catch {
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function toggleDisponible(item) {
    try {
      await actualizarItem(item.id, { disponible: !item.disponible });
      cargar();
    } catch {
      alert('Error al cambiar disponibilidad');
    }
  }

  async function borrar(id) {
    try {
      await eliminarItem(id);
      setConfirmDelete(null);
      cargar();
    } catch {
      alert('Error al eliminar');
    }
  }

  // Agrupar por categoría
  const porCategoria = items.reduce((acc, item) => {
    const cat = item.categoria || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const totalDisponibles = items.filter(i => i.disponible).length;
  const totalPausados = items.filter(i => !i.disponible).length;

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Menú</h2>
          <p className="text-sm text-gray-500">
            {items.length} ítem{items.length !== 1 ? 's' : ''} —{' '}
            <span className="text-green-600 font-medium">{totalDisponibles} disponibles</span>
            {totalPausados > 0 && (
              <span className="text-orange-500 font-medium"> · {totalPausados} pausados</span>
            )}
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Agregar
        </button>
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

      {/* Vacío */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🫓</p>
          <p className="text-gray-500 font-medium">No hay ítems en el menú</p>
          <p className="text-sm text-gray-400 mt-1">Agrega los productos que ofreces</p>
        </div>
      )}

      {/* Items por categoría */}
      {Object.entries(porCategoria).map(([cat, catItems]) => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catItems.map(item => (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${
                  item.disponible ? 'border-gray-100' : 'border-orange-100 bg-orange-50/40'
                }`}
              >
                {/* Nombre + badge */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className={`font-semibold text-sm leading-tight ${item.disponible ? 'text-gray-900' : 'text-gray-500'}`}>
                    {item.nombre}
                  </p>
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.disponible
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    {item.disponible ? 'Disponible' : 'Pausado'}
                  </span>
                </div>

                {item.descripcion && (
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.descripcion}</p>
                )}

                <p className="text-green-600 font-bold text-sm mb-3">{fmtCOP(item.precio)}</p>

                {/* Acciones */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {/* Toggle disponibilidad */}
                  <button
                    onClick={() => toggleDisponible(item)}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
                      item.disponible
                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {item.disponible ? 'Pausar' : 'Activar'}
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => abrirEditar(item)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => setConfirmDelete(item)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal agregar/editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{editando ? 'Editar ítem' : 'Nuevo ítem del menú'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-3">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Arepa de Choclo"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                >
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Precio (COP)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ej: 8000"
                  value={form.precio}
                  onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Ingredientes o descripción breve..."
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || !form.nombre.trim()}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 text-center">
            <p className="text-3xl mb-3">🗑️</p>
            <h3 className="font-bold text-gray-900 mb-1">¿Eliminar ítem?</h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-medium text-gray-700">"{confirmDelete.nombre}"</span> se eliminará permanentemente del menú.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => borrar(confirmDelete.id)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
