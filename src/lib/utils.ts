import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}


// FIX 5: original checked `!url.startsWith('https://')` twice — first branch
// should catch anything that isn't already http/https, second should upgrade http → https
export function ensureHttps(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }

  return url;
}

export function parseReferrer(referer: string | null): string | null {
  if (!referer) return null;
  try { return new URL(referer).hostname || null; }
  catch { return null; }
}
