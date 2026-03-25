import { apiFetch } from './client';

export async function getPedidos(estado) {
  const url = estado && estado !== 'todos' ? `/api/pedidos?estado=${estado}` : '/api/pedidos';
  const res = await apiFetch(url);
  if (!res.ok) throw new Error('Error al obtener pedidos');
  return res.json();
}

export async function getStats() {
  const res = await apiFetch('/api/stats');
  if (!res.ok) throw new Error('Error al obtener estadísticas');
  return res.json();
}

export async function actualizarEstado(id, estado) {
  const res = await apiFetch(`/api/pedidos/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) throw new Error('Error al actualizar estado');
  return res.json();
}

export async function eliminarPedido(id) {
  const res = await apiFetch(`/api/pedidos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar pedido');
  return res.json();
}

export async function crearPedido(pedido) {
  const res = await fetch('/webhook/pedido', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...pedido, fuente: 'presencial' }),
  });
  if (!res.ok) throw new Error('Error al crear pedido');
  return res.json();
}
