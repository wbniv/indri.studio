/* Shared UI/input/lifecycle; the adapter owns runtime execution. */
import { createAdapter as worldfoundry } from './adapters/worldfoundry.js';
import { createAdapter as snes } from './adapters/snes.js';
(function () {
  'use strict';
  var config = JSON.parse(document.getElementById('wf-player-config').textContent);
  if (config.levels) {
    var selected = new URLSearchParams(location.search).get('level');
    var level = Object.hasOwn(config.levels, selected) ? selected : config.defaultLevel;
    config = Object.assign({}, config, config.levels[level]);
  }
  var adapter = (config.adapter === 'snes' ? snes : worldfoundry)();
  var instanceId = new URLSearchParams(location.search).get('instance') || 'standalone';
  var state = 'idle';
  function notify(next, detail) {
    state = next;
    var message = {type:'browser-game-player',protocol:1,instanceId:instanceId,event:next};
    if (detail) message.detail = String(detail).slice(0,4000);
    if (window.parent !== window) window.parent.postMessage(message,location.origin);
    window.dispatchEvent(new CustomEvent('bgp-state',{detail:message}));
  }
  document.title = config.title;
  document.body.classList.toggle('snes',config.adapter === 'snes');
  document.getElementById('game-title').textContent = config.title;
  document.getElementById('game-subtitle').textContent = config.subtitle;
  document.getElementById('status').textContent = config.status;
  document.getElementById('start-hint').hidden = !config.fullscreenOnPlay;
  var fallback = document.getElementById('fallback'); fallback.href = config.fallbackUrl; fallback.textContent = config.fallbackLabel;
  var canvas = document.getElementById('canvas'); canvas.setAttribute('aria-label',config.canvasLabel);
  if (config.poster) document.getElementById('overlay').style.setProperty('--poster','url('+JSON.stringify(config.poster)+')');
  var actions = document.querySelector('.actions');
  var originals = Array.from(actions.children);
  actions.replaceChildren();
  config.actions.forEach(function (action,i) {
    var button = (originals[i] || originals[1]).cloneNode(true);
    button.dataset.code = action.code; button.setAttribute('aria-label',action.label); button.title = action.label;
    button.classList.toggle('primary',i===config.actions.length-1);
    button.querySelector('.caption').textContent = action.caption;
    if (config.adapter === 'snes') { var svg = button.querySelector('svg'); if (svg) svg.remove(); var symbol = button.querySelector('.symbol'); if (symbol) symbol.textContent = action.caption === 'Select' ? 'SE' : action.caption === 'Start' ? 'ST' : action.caption; else { symbol = document.createElement('span'); symbol.className='symbol';symbol.textContent=action.caption === 'Select' ? 'SE' : action.caption === 'Start' ? 'ST' : action.caption;button.prepend(symbol); } }
    actions.appendChild(button);
  });
  var help = document.getElementById('help'); config.help.forEach(function(text){var paragraph=document.createElement('p');paragraph.textContent=text;help.appendChild(paragraph);});
  document.getElementById('motion').hidden = !config.motionCode;
  document.getElementById('verify').hidden = !adapter.capabilities.fidelity;
  document.getElementById('verify').addEventListener('click',function(){closeMenu();},true);
  document.querySelector('.keyboard-hint').textContent = config.keyboardHint || 'Arrow keys move · Space selects';
  var stage = document.getElementById('stage');
  var overlay = document.getElementById('overlay');
  var play = document.getElementById('play');
  // With config.playIcons the label is a child span beside aria-hidden icons.
  var playLabel = play.querySelector('.play-label') || play;
  // The game does not report its reduced-motion state, so mirror each toggle
  // the shell sends (menu item or a fresh motionCode key press) on <html>.
  var motionReduced = false;
  function toggleMotion() { motionReduced = !motionReduced; document.documentElement.setAttribute('data-reduced-motion',String(motionReduced)); }
  var status = document.getElementById('status');
  var progress = document.getElementById('progress');
  var focus = document.getElementById('focus');
  var restart = document.getElementById('restart');
  var started = false, loading = false, failed = false, paused = false;
  var physical = new Set(), pointers = new Map(), pulseId = 0;
  var menu = document.getElementById('menu'), menuToggle = document.getElementById('menu-toggle');
  var joystick = document.getElementById('joystick'), stick = document.getElementById('stick'), joystickId = null;
  var mapped = config.adapter === 'snes' ? /^(Arrow(Up|Down|Left|Right)|Key[ZXASQW]|Enter|ShiftLeft|ShiftRight)$/ : /^(Arrow(Up|Down|Left|Right)|Key[IJKLWASD]|Space|Digit[0-9]|Numpad[0-9]|Numpad(Add|Subtract|Multiply|Divide|Decimal|Enter))$/;
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
  function emit(type, code) { var e = new KeyboardEvent(type, {code: code, key: code, bubbles: true, cancelable: true}); e.bgpSynthetic = true; e.fywSynthetic = true; window.dispatchEvent(e); }
  function touchOwns(code) { return Array.from(pointers.values()).some(function (p) { return p.has(code); }); }
  function held(code) { return physical.has(code) || touchOwns(code); }
  var aliases = config.adapter === 'snes' ? {} : {KeyI:'ArrowUp',KeyJ:'ArrowLeft',KeyK:'ArrowDown',KeyL:'ArrowRight',KeyW:'ArrowUp',KeyA:'ArrowLeft',KeyS:'ArrowDown',KeyD:'ArrowRight'};
  function feedback() {
    document.querySelectorAll('[data-code]').forEach(function (button) {
      var code = button.dataset.code;
      var pressed = held(code) || Array.from(physical).some(function (key) { return aliases[key] === code; });
      button.setAttribute('aria-pressed',String(pressed));
    });
  }
  function own(id, codes) {
    var next = new Set(codes), previous = pointers.get(id) || new Set();
    var changed = new Set(Array.from(previous).concat(Array.from(next)));
    var before = new Map(); changed.forEach(function (code) { before.set(code,held(code)); });
    if (next.size) pointers.set(id,next); else pointers.delete(id);
    changed.forEach(function (code) { if (before.get(code) !== held(code)) emit(held(code)?'keydown':'keyup',code); });
    feedback();
  }
  function release() {
    var codes = new Set(physical); pointers.forEach(function (set) { set.forEach(function (code) { codes.add(code); }); });
    physical.clear(); pointers.clear(); joystickId = null;
    stick.style.transform = ''; codes.forEach(function (code) { emit('keyup', code); }); adapter.release(); feedback();
  }
  function pulse(code) {
    var id = 'pulse-' + (++pulseId); own(id,[code]);
    setTimeout(function () { own(id,[]); },120);
  }
  function pause(force) {
    release();
    if (started && (!paused || force)) { adapter.pause(); paused = true; notify('paused'); }
  }
  function activate() { if (!started || failed || document.hidden || !menu.hidden) return; canvas.focus({preventScroll:true}); if (paused) { adapter.resume(); paused = false; notify('running'); } audio(); }
  function error(message, detail) {
    if (failed) return; failed = true; loading = false; pause(true); notify('error',message);
    overlay.hidden = false; status.textContent = message; progress.hidden = true;
    play.disabled = false; playLabel.textContent = 'Retry'; focus.disabled = true;
    if (detail) console.error('Browser game player:', detail);
  }
  window.addEventListener('keydown', function (e) {
    if (e.bgpSynthetic) return;
    if (e.code === 'Escape') {
      release(); e.preventDefault(); e.stopImmediatePropagation();
      if (!menu.hidden) closeMenu();
      else if (document.fullscreenElement || document.webkitFullscreenElement) exitFullscreen();
      else openMenu();
      return;
    }
    if (!mapped.test(e.code)) return;
    if (!started || failed || document.activeElement !== canvas) { e.stopImmediatePropagation(); return; }
    var already = held(e.code); physical.add(e.code); feedback(); audio();
    if (e.code === config.motionCode && !already && !e.repeat) toggleMotion();
    e.preventDefault(); if (already && !e.repeat) e.stopImmediatePropagation();
  }, true);
  window.addEventListener('keyup', function (e) {
    if (e.bgpSynthetic || !mapped.test(e.code)) return;
    if (!physical.has(e.code)) { e.stopImmediatePropagation(); return; }
    physical.delete(e.code); feedback(); e.preventDefault();
    if (touchOwns(e.code)) e.stopImmediatePropagation();
  }, true);
  window.addEventListener('blur', function () { pause(); });
  document.addEventListener('visibilitychange', function () {
    // The native browser backend also handles visibility. Apply focus policy
    // after its handler so returning to a tab cannot resume an unfocused game.
    queueMicrotask(function () { pause(true); if (!document.hidden && document.activeElement === canvas) activate(); });
  });
  canvas.addEventListener('blur', function () { pause(); });
  canvas.addEventListener('pointerdown', activate);
  document.querySelectorAll('[data-code]').forEach(function (button) {
    button.setAttribute('aria-pressed','false');
    if (!joystick.contains(button)) {
      button.addEventListener('pointerdown', function (e) {
        if (!started || failed || !menu.hidden) return;
        e.preventDefault(); activate(); button.setPointerCapture(e.pointerId);
        own(e.pointerId,[button.dataset.code]);
      });
      ['pointerup','pointercancel','lostpointercapture'].forEach(function (ev) {
        button.addEventListener(ev,function (e) { own(e.pointerId,[]); });
      });
    }
    button.addEventListener('click', function (e) {
      if (e.detail !== 0 || !started || failed || !menu.hidden) return;
      activate(); pulse(button.dataset.code);
    });
  });
  function steer(e) {
    var rect = joystick.getBoundingClientRect();
    var dx = e.clientX - (rect.left + rect.width/2), dy = e.clientY - (rect.top + rect.height/2);
    var distance = Math.hypot(dx,dy), radius = rect.width/2, codes = [];
    if (distance > radius*.18) {
      if (Math.abs(dx) > distance*.38) codes.push(dx < 0 ? 'ArrowLeft':'ArrowRight');
      if (Math.abs(dy) > distance*.38) codes.push(dy < 0 ? 'ArrowUp':'ArrowDown');
    }
    var scale = distance ? Math.min(1,(radius-16)/distance) : 0;
    stick.style.transform = 'translate('+(dx*scale)+'px,'+(dy*scale)+'px)';
    own(e.pointerId,codes);
  }
  joystick.addEventListener('pointerdown', function (e) {
    if (!started || failed || !menu.hidden || joystickId !== null) return;
    e.preventDefault(); activate(); joystickId = e.pointerId;
    joystick.setPointerCapture(e.pointerId); steer(e);
  });
  joystick.addEventListener('pointermove',function (e) { if (e.pointerId === joystickId) { e.preventDefault(); steer(e); } });
  ['pointerup','pointercancel','lostpointercapture'].forEach(function (ev) {
    joystick.addEventListener(ev,function (e) { if (e.pointerId !== joystickId) return; own(e.pointerId,[]); joystickId = null; stick.style.transform = ''; });
  });
  function openMenu() {
    if (!started || failed) return;
    pause(); menu.hidden = false; menuToggle.setAttribute('aria-expanded','true'); focus.focus({preventScroll:true});
  }
  function closeMenu() { menu.hidden = true; menuToggle.setAttribute('aria-expanded','false'); activate(); }
  menuToggle.addEventListener('click',function () { if (menu.hidden) openMenu(); else closeMenu(); });
  focus.addEventListener('click',closeMenu);
  restart.addEventListener('click', function () { release(); if (confirm(config.restartPrompt)) location.reload(); });
  document.getElementById('controls').addEventListener('click', function () {
    var help = document.getElementById('help'); help.hidden = !help.hidden; this.setAttribute('aria-expanded',String(!help.hidden));
  });
  document.getElementById('motion').addEventListener('click',function () {
    closeMenu(); pulse(config.motionCode); toggleMotion();
  });
  function syncFullscreen() {
    var active = !!(document.fullscreenElement || document.webkitFullscreenElement);
    var label = active ? 'Exit fullscreen' : 'Fullscreen';
    var button = document.getElementById('fullscreen');
    button.setAttribute('aria-label',label); button.title = label;
    document.getElementById('fullscreen-caption').textContent = active ? 'Exit' : 'Fullscreen';
  }
  function enterFullscreen() {
    var button = document.getElementById('fullscreen');
    var request = stage.requestFullscreen || stage.webkitRequestFullscreen;
    if (!request) return;
    try {
      var result = request.call(stage);
      if (result && result.catch) result.catch(syncFullscreen);
    } catch (_) { syncFullscreen(); }
  }
  function exitFullscreen() {
    var exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) { var result = exit.call(document); if (result && result.catch) result.catch(function () {}); }
  }
  document.getElementById('fullscreen').addEventListener('click', function () {
    release();
    if (document.fullscreenElement || document.webkitFullscreenElement) exitFullscreen(); else enterFullscreen();
  });
  function fullscreenChanged() { release(); syncFullscreen(); activate(); height(); }
  document.addEventListener('fullscreenchange', fullscreenChanged);
  document.addEventListener('webkitfullscreenchange', fullscreenChanged);
  stage.addEventListener('webglcontextlost', function (e) { e.preventDefault(); error('Graphics context lost. Restart to continue.'); }, true);
  function begin(userGesture) {
    if (failed) { location.reload(); return; }
    if (loading || started) return;
    if (typeof WebAssembly === 'undefined') { error('This browser does not support WebAssembly. Try another browser.'); return; }
    if (adapter.capabilities.webgl2) {
      var probe = document.createElement('canvas'), gl = probe.getContext('webgl2');
      if (!gl) { error('WebGL 2 is unavailable. Try another browser.'); return; }
      var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    }
    if (userGesture && config.fullscreenOnPlay) enterFullscreen();
    loading = true; play.disabled = true; progress.hidden = false; status.textContent = 'Loading game…'; audio(); notify('loading');
    adapter.start({ canvas:canvas, config:config, error:error,
      progress:function(text) {
        if (started || failed) return;
        var m = text && text.match(/([\d.]+)\s*\/\s*([\d.]+)/);
        if (m) { progress.value=100*Number(m[1])/Number(m[2]);status.textContent='Downloading game… '+Math.round(progress.value)+'%'; }
      },
      ready:function() {
        if (failed) return;
        started=true;loading=false;overlay.hidden=true;focus.disabled=false;restart.disabled=false;
        document.getElementById('touch').hidden=false;
        window.dispatchEvent(new Event('resize'));
        notify('ready'); paused=true; activate();
        if (document.hidden || !menu.hidden || document.activeElement !== canvas) pause(true);
        window.dispatchEvent(new Event('fyw-ready'));
      }
    }).catch(function(e){error('The game could not start. Retry or choose another way to play.',e);});
  }
  play.addEventListener('click',function(){begin(true);});
  window.addEventListener('message',function(event){
    var data=event.data;
    if (event.source !== window.parent || event.origin !== location.origin || !data || data.type !== 'browser-game-player' || data.protocol !== 1 || data.instanceId !== instanceId) return;
    if (data.command === 'start') begin(false);
    else if (data.command === 'pause') pause(true);
    else if (data.command === 'resume') { closeMenu();activate(); }
    else if (data.command === 'restart' && data.confirmed === true) location.reload();
  });
  function height() { if (window.parent !== window) window.parent.postMessage({type:'browser-game-player',protocol:1,instanceId:instanceId,event:'height',height:document.getElementById('player').scrollHeight},location.origin); }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(height).observe(document.getElementById('player'));
  window.addEventListener('resize',height); height();
  window.addEventListener('error', function (e) { if ((loading || started) && e.error) error('The game encountered a problem. Restart to continue.',e.error); });
  window.addEventListener('unhandledrejection', function (e) { if (loading || started) error('The game encountered a problem. Restart to continue.',e.reason); });
  notify('idle');
  if (config.startMode === 'auto') begin(false);
})();
