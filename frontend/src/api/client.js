// Cliente HTTP con auth automática y manejo de sesión expirada
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('pedidos_token');

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('pedidos_token');
    localStorage.removeItem('pedidos_user');
    window.location.reload();
    throw new Error('Sesión expirada');
  }

  return res;
}
