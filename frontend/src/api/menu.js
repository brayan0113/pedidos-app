import { apiFetch } from './client';

export async function getMenu() {
  const res = await apiFetch('/api/menu');
  if (!res.ok) throw new Error('Error al obtener el menú');
  return res.json();
}

export async function crearItem(item) {
  const res = await apiFetch('/api/menu', {
    method: 'POST',
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Error al crear ítem');
  return res.json();
}

export async function actualizarItem(id, campos) {
  const res = await apiFetch(`/api/menu/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(campos),
  });
  if (!res.ok) throw new Error('Error al actualizar ítem');
  return res.json();
}

export async function eliminarItem(id) {
  const res = await apiFetch(`/api/menu/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar ítem');
  return res.json();
}
