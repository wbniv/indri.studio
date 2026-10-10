/* Chapter-owned browser shell. All gameplay remains in the pinned native engine. */
(function () {
  'use strict';
  var canvas = document.getElementById('canvas');
  var stage = document.getElementById('stage');
  var overlay = document.getElementById('overlay');
  var play = document.getElementById('play');
  var status = document.getElementById('status');
  var progress = document.getElementById('progress');
  var focus = document.getElementById('focus');
  var restart = document.getElementById('restart');
  var started = false, loading = false, failed = false, paused = false;
  var physical = new Set(), pointers = new Map();
  var mapped = /^(Arrow(Up|Down|Left|Right)|Key[IJKL]|Space|Digit[0-9]|Numpad[0-9]|Numpad(Add|Subtract|Multiply|Divide|Decimal|Enter))$/;
  var audioContexts = [];
  // Capture contexts before the engine loads, then unlock on a real gesture.
  var AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    function Tracked() { var c = new (Function.prototype.bind.apply(AC, [null].concat(Array.prototype.slice.call(arguments))))(); audioContexts.push(c); return c; }
    Tracked.prototype = AC.prototype;
    window.AudioContext = Tracked;
    if (window.webkitAudioContext) window.webkitAudioContext = Tracked;
  }
  function audio() { audioContexts.forEach(function (c) { if (c.state === 'suspended') c.resume().catch(function () {}); }); }
  function emit(type, code) { var e = new KeyboardEvent(type, {code: code, key: code, bubbles: true, cancelable: true}); e.fywSynthetic = true; window.dispatchEvent(e); }
  function touchOwns(code) { return Array.from(pointers.values()).some(function (p) { return p.code === code; }); }
  function release() {
    var codes = new Set(physical); pointers.forEach(function (p) { codes.add(p.code); p.button.setAttribute('aria-pressed','false'); });
    physical.clear(); pointers.clear(); codes.forEach(function (code) { emit('keyup', code); });
  }
  function pause(force) {
    release();
    if (started && window.Module && typeof Module.pauseMainLoop === 'function' && (!paused || force)) { Module.pauseMainLoop(); paused = true; }
  }
  function activate() { if (!started || failed || document.hidden) return; canvas.focus({preventScroll:true}); if (paused && typeof Module.resumeMainLoop === 'function') { Module.resumeMainLoop(); paused = false; } audio(); }
  function error(message, detail) {
    if (failed) return; failed = true; loading = false; release();
    overlay.hidden = false; status.textContent = message; progress.hidden = true;
    play.disabled = false; play.textContent = 'Retry'; focus.disabled = true;
    if (detail) console.error('Finding Your Way:', detail);
  }
  window.addEventListener('keydown', function (e) {
    if (e.fywSynthetic) return;
    if (e.code === 'Escape') {
      release(); e.preventDefault(); e.stopImmediatePropagation();
      if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
      else { canvas.blur(); focus.focus(); }
      return;
    }
    if (!mapped.test(e.code)) return;
    if (!started || failed || document.activeElement !== canvas) { e.stopImmediatePropagation(); return; }
    physical.add(e.code); audio();
  }, true);
  window.addEventListener('keyup', function (e) {
    if (e.fywSynthetic || !mapped.test(e.code)) return;
    if (!physical.has(e.code)) { e.stopImmediatePropagation(); return; }
    physical.delete(e.code);
    if (touchOwns(e.code)) e.stopImmediatePropagation();
  }, true);
  window.addEventListener('blur', function () { pause(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden || document.activeElement !== canvas) pause(true); else activate(); });
  canvas.addEventListener('blur', function () { pause(); });
  canvas.addEventListener('pointerdown', activate);
  document.querySelectorAll('[data-code]').forEach(function (button) {
    button.setAttribute('aria-pressed','false');
    button.addEventListener('pointerdown', function (e) {
      if (!started || failed) return;
      e.preventDefault(); activate(); button.setPointerCapture(e.pointerId);
      var code = button.dataset.code, already = physical.has(code) || touchOwns(code);
      pointers.set(e.pointerId,{code:code,button:button}); button.setAttribute('aria-pressed','true');
      if (!already) emit('keydown',code);
    });
    button.addEventListener('click', function (e) {
      if (e.detail !== 0 || !started || failed) return;
      activate(); var code = button.dataset.code;
      if (physical.has(code) || touchOwns(code)) return;
      emit('keydown',code); setTimeout(function () { if (!physical.has(code) && !touchOwns(code)) emit('keyup',code); },120);
    });
    function up(e) {
      var p = pointers.get(e.pointerId); if (!p) return;
      pointers.delete(e.pointerId);
      if (!touchOwns(p.code)) { p.button.setAttribute('aria-pressed','false'); if (!physical.has(p.code)) emit('keyup',p.code); }
    }
    ['pointerup','pointercancel','lostpointercapture'].forEach(function (ev) { button.addEventListener(ev,up); });
  });
  focus.addEventListener('click', activate);
  restart.addEventListener('click', function () { release(); if (confirm('Restart the chapter? Your current progress will be lost.')) location.reload(); });
  document.getElementById('controls').addEventListener('click', function () {
    release(); var help = document.getElementById('help'); help.hidden = !help.hidden; this.setAttribute('aria-expanded',String(!help.hidden));
  });
  document.getElementById('fullscreen').addEventListener('click', function () {
    release();
    if (document.fullscreenElement) { document.exitFullscreen().catch(function () {}); return; }
    var request = stage.requestFullscreen || stage.webkitRequestFullscreen;
    if (!request) { this.textContent = 'Fullscreen unavailable'; return; }
    try { var result = request.call(stage); if (result && result.catch) result.catch(function () { document.getElementById('fullscreen').textContent = 'Play inline'; }); } catch (_) { this.textContent = 'Play inline'; }
  });
  document.addEventListener('fullscreenchange', function () { release(); activate(); });
  stage.addEventListener('webglcontextlost', function (e) { e.preventDefault(); error('Graphics context lost. Restart to continue.'); }, true);
  play.addEventListener('click', function () {
    if (failed) { location.reload(); return; }
    if (loading || started) return;
    if (typeof WebAssembly === 'undefined') { error('This browser does not support WebAssembly. Try another browser or Android.'); return; }
    var probe = document.createElement('canvas'), gl = probe.getContext('webgl2');
    if (!gl) { error('WebGL 2 is unavailable. Try another browser or Android.'); return; }
    var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    loading = true; play.disabled = true; progress.hidden = false; status.textContent = 'Loading game…'; audio();
    fetch('config.json').then(function (r) { if (!r.ok) throw Error('Configuration HTTP '+r.status); return r.json(); }).then(function (config) {
      window.Module = {
        canvas:canvas, arguments:config.arguments, noInitialRun:true,
        locateFile:function (file) { return new URL(file,location.href).href; },
        print:function (text) { console.log(text); }, printErr:function (text) { console.error(text); },
        setStatus:function (text) { if (started || failed) return; var m = text && text.match(/([\d.]+)\s*\/\s*([\d.]+)/); if (m) { progress.value = 100*Number(m[1])/Number(m[2]); status.textContent = 'Downloading game… '+Math.round(progress.value)+'%'; } },
        onAbort:function (detail) { error('The game could not start. Retry or choose another way to play.',detail); },
        onRuntimeInitialized:function () {
          try {
            window.Module.callMain(config.arguments);
            if (failed) return;
            started = true; loading = false; overlay.hidden = true;
            focus.disabled = false; restart.disabled = false;
            document.getElementById('touch').hidden = !('ontouchstart' in window || navigator.maxTouchPoints > 0);
            activate();
            window.dispatchEvent(new Event('fyw-ready'));
          } catch (e) { error('The game could not start. Retry or choose another way to play.',e); }
        }
      };
      var script = document.createElement('script'); script.src = 'wf_game.js'; script.onerror = function () { error('Couldn’t download the game. Check your connection and retry.'); }; document.body.appendChild(script);
    }).catch(function (e) { error('Couldn’t load the game. Check your connection and retry.',e); });
  });
  function height() { if (window.parent !== window) window.parent.postMessage({type:'fyw-player-height',height:document.getElementById('player').scrollHeight},location.origin); }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(height).observe(document.getElementById('player'));
  window.addEventListener('resize',height); height();
  window.addEventListener('unhandledrejection', function (e) { if (loading || started) error('The game encountered a problem. Restart to continue.',e.reason); });
})();
