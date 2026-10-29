import { fywFrameAncestors } from './fyw-frame-policy.mjs';

export function contentSecurityPolicy(nonce, pathname) {
  return `default-src 'self'; ` +
    `frame-src 'self' https://biohack.net; ` +
    `font-src 'self' fonts.gstatic.com; ` +
    `style-src 'self' 'unsafe-inline' fonts.googleapis.com; ` +
    `script-src 'self' 'strict-dynamic' 'nonce-${nonce}' 'unsafe-inline' 'wasm-unsafe-eval'; ` +
    `img-src 'self' data:; ` +
    `object-src 'none'; ` +
    `base-uri 'self'; ` +
    `frame-ancestors ${fywFrameAncestors(pathname)}`;
}
