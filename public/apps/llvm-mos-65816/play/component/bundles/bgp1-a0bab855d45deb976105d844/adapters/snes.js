// The existing bsnes-jg loader owns emulation, ROM loading and fidelity checks.
export function createAdapter() {
  return {
    async start({ canvas, config, ready, error }) {
      canvas.id = 'screen'; canvas.width = 256; canvas.height = 224;
      const requested = new URLSearchParams(location.search).get('game');
      const game = config.games.includes(requested) ? requested : config.game;
      window.BJG_BASE = new URL('./', location.href).href;
      window.BJG_DEFAULT_ROM = game;
      document.getElementById('verify').textContent = config.verifyLabels?.[game] || 'Verify fidelity';
      window.BJG_PLAYER_HOOKS = { ready, error, previews: config.previews || [] };
      // The loader historically accepts ?rom=. Resolve and allowlist in the
      // adapter, then hide that unvalidated parameter from its boot lookup.
      const url = new URL(location.href); url.searchParams.delete('rom');
      history.replaceState(null, '', url);
      const script = document.createElement('script'); script.src = 'adapters/snes-loader.js';
      script.onerror = () => error('Couldn’t download the SNES loader. Check your connection and retry.');
      document.body.appendChild(script);
    },
    pause() { window.__bjgPlayer?.pause(); },
    resume() { window.__bjgPlayer?.resume(); },
    release() { window.__bjgPlayer?.release(); },
    capabilities: { webgl2: false, fidelity: true }
  };
}
