const BASE = '/api/menu';

export async function getMenu() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Error al obtener el menú');
  return res.json();
}

export async function crearItem(item) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Error al crear ítem');
  return res.json();
}

export async function actualizarItem(id, campos) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campos)
  });
  if (!res.ok) throw new Error('Error al actualizar ítem');
  return res.json();
}

export async function eliminarItem(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar ítem');
  return res.json();
}
