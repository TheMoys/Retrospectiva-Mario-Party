/**
 * Network URL Resolver for Mobile QR Code Pairing
 * Automatically determines LAN IP so physical phones on Wi-Fi connect seamlessly.
 */

// Host machine LAN IP detected on local network
export const DEFAULT_LAN_IP = '172.22.101.100';

export function getMobileJoinUrl(roomCode: string, customBaseUrl?: string): string {
  if (typeof window === 'undefined') return '';

  if (customBaseUrl) {
    const base = customBaseUrl.replace(/\/$/, '');
    return `${base}/?room=${roomCode}&mode=controller`;
  }

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const pathname = window.location.pathname;

  // If running on localhost or 127.0.0.1, use LAN IP so mobile phones can connect over Wi-Fi
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const targetHost = isLocal ? DEFAULT_LAN_IP : hostname;

  return `${protocol}//${targetHost}${port}${pathname}?room=${roomCode}&mode=controller`;
}

export function getQrCodeImageUrl(url: string, size: number = 180): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
}
