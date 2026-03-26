// ─── SONIDO ───────────────────────────────────────────────────────────────────
export function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const tone = (freq, start, duration, volume = 0.25) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    };

    // Dos tonos ascendentes — tipo "ding-dong"
    const t = ctx.currentTime;
    tone(830, t,        0.25);
    tone(1046, t + 0.2, 0.35);
  } catch (e) {
    console.warn('[Pedify] No se pudo reproducir sonido:', e);
  }
}

// ─── NOTIFICACIÓN DEL NAVEGADOR ───────────────────────────────────────────────
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showBrowserNotification(pedidos) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const count = pedidos.length;
  const title = count === 1
    ? `🛎️ Nuevo pedido de ${pedidos[0].cliente}`
    : `🛎️ ${count} nuevos pedidos`;

  const body = count === 1
    ? pedidos[0].productos?.map(p => `${p.cantidad ?? ''}x ${p.nombre}`).join(', ') || ''
    : pedidos.map(p => p.cliente).join(', ');

  try {
    const notif = new Notification(title, { body, icon: '/favicon.ico', tag: 'nuevo-pedido' });
    setTimeout(() => notif.close(), 6000);
  } catch (e) {
    console.warn('[Pedify] No se pudo mostrar notificación:', e);
  }
}
