import { ConnectionStatus } from '@/types/game';

/**
 * Network URL & Connection Status Helpers for Mobile QR Code Pairing
 */

export function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function isTunnelDiscoverySupported(): boolean {
  const metaEnv = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
  return isLocalHost() && Boolean(metaEnv?.DEV);
}

export function isPublicHttpsOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:' && !isLocalHost();
}

export async function fetchLocalTunnelUrl(): Promise<string | null> {
  if (!isTunnelDiscoverySupported()) return null;
  try {
    const res = await fetch('/api/tunnel');
    if (!res.ok) return null;
    const data = (await res.json()) as { active?: boolean; url?: string | null };
    if (data.active && typeof data.url === 'string' && data.url.startsWith('https://')) {
      return data.url;
    }
    return null;
  } catch {
    return null;
  }
}

export function getMobileJoinUrl(roomCode: string, customBaseUrl?: string): string {
  if (typeof window === 'undefined') return '';

  const normalizedRoom = (roomCode || 'STAR').trim().toUpperCase();
  const pathname = window.location.pathname || '/';

  if (customBaseUrl) {
    const base = customBaseUrl.replace(/\/$/, '');
    return `${base}${pathname}?room=${encodeURIComponent(normalizedRoom)}&mode=controller`;
  }

  return `${window.location.origin}${pathname}?room=${encodeURIComponent(normalizedRoom)}&mode=controller`;
}

export function getQrCodeImageUrl(url: string, size: number = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below handles non-HTTPS local preview contexts or restricted permissions
  }

  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export interface ConnectionStatusMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
  isAnimated: boolean;
}

export function getConnectionStatusMeta(
  status: ConnectionStatus,
  roomCode?: string
): ConnectionStatusMeta {
  const cleanRoom = roomCode?.trim().toUpperCase();

  switch (status) {
    case 'connected':
      return {
        label: cleanRoom ? `En línea · Sala ${cleanRoom}` : 'En línea',
        badgeClass: 'bg-emerald-950/90 border-emerald-400/50 text-emerald-200',
        dotClass: 'bg-emerald-400',
        isAnimated: false,
      };
    case 'reconnecting':
      return {
        label: 'Reconectando...',
        badgeClass: 'bg-amber-950/90 border-amber-400/50 text-amber-200',
        dotClass: 'bg-amber-400',
        isAnimated: true,
      };
    case 'offline':
      return {
        label: 'Sin conexión',
        badgeClass: 'bg-rose-950/90 border-rose-400/50 text-rose-200',
        dotClass: 'bg-rose-400',
        isAnimated: false,
      };
    case 'connecting':
    default:
      return {
        label: 'Conectando...',
        badgeClass: 'bg-amber-950/90 border-amber-400/50 text-amber-200',
        dotClass: 'bg-amber-400',
        isAnimated: true,
      };
  }
}
