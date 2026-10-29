// Adapter for the existing non-modularized World Foundry Emscripten build.
export function createAdapter() {
  return {
    async start({ canvas, config, ready, error, progress }) {
      window.Module = {
        canvas, arguments: config.arguments, noInitialRun: true,
        locateFile: file => new URL(file, location.href).href,
        print: text => console.log(text), printErr: text => console.error(text),
        setStatus: progress,
        onAbort: detail => error('The game could not start. Retry or choose another way to play.', detail),
        onRuntimeInitialized() {
          try { window.Module.callMain(config.arguments); ready(); }
          catch (e) { error('The game could not start. Retry or choose another way to play.', e); }
        }
      };
      const script = document.createElement('script'); script.src = 'wf_game.js';
      script.onerror = () => error('Couldn’t download the game. Check your connection and retry.');
      document.body.appendChild(script);
    },
    pause() { window.Module?.pauseMainLoop?.(); },
    resume() { window.Module?.resumeMainLoop?.(); },
    release() {},
    capabilities: { webgl2: true, fidelity: false }
  };
}
