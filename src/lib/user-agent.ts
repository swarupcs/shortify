/**
 * Lightweight User-Agent parser — no dependencies.
 * Returns device type and browser name from a UA string.
 *
 * Device:  'mobile' | 'tablet' | 'desktop'
 * Browser: 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Opera' | 'Samsung' | 'Other'
 */

export type DeviceType  = 'mobile' | 'tablet' | 'desktop';
export type BrowserName = 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Opera' | 'Samsung' | 'Other';

export function parseUserAgent(ua: string | null): {
  device: DeviceType;
  browser: BrowserName;
} {
  if (!ua) return { device: 'desktop', browser: 'Other' };

  const s = ua.toLowerCase();

  // ── Device ──────────────────────────────────────────────────────────
  let device: DeviceType = 'desktop';
  if (/tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    device = 'tablet';
  } else if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry|bb\d+|mobi/i.test(ua)) {
    device = 'mobile';
  }

  // ── Browser ─────────────────────────────────────────────────────────
  // Order matters — more specific checks first
  let browser: BrowserName = 'Other';

  if (/samsungbrowser/i.test(ua)) {
    browser = 'Samsung';
  } else if (/edg\//i.test(ua)) {
    // Edge (Chromium-based) — must come before Chrome
    browser = 'Edge';
  } else if (/opr\//i.test(ua) || /opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/chrome|crios|chromium/i.test(ua)) {
    // Chrome — must come before Safari (Chrome UA includes "Safari")
    browser = 'Chrome';
  } else if (/safari/i.test(ua)) {
    browser = 'Safari';
  }

  return { device, browser };
}
