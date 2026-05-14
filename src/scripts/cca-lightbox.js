(function() {
  const dlg = document.getElementById('fm-lightbox');
  if (!dlg) return;
  const img = dlg.querySelector('img');
  const cap = dlg.querySelector('figcaption');
  const closeBtn = dlg.querySelector('.fm-close');
  const prevBtn = dlg.querySelector('.fm-prev');
  const nextBtn = dlg.querySelector('.fm-next');
  const upBtn = dlg.querySelector('.fm-up');
  const downBtn = dlg.querySelector('.fm-down');
  const buttons = Array.from(document.querySelectorAll('.fm-grid button[data-style]'));
  const TYPES = ['memory', 'skill', 'subagent', 'slash-command'];
  const TYPE_LABEL = { memory: 'memory', skill: 'skill', subagent: 'subagent', 'slash-command': 'slash command' };
  let styleIdx = -1;
  let typeIdx = 0;
  let opener = null;

  function urlFor(style, type) {
    const typePart = type === 'memory' ? '' : `-${type}`;
    return `/img/cca-styles/style-${style}${typePart}-full.avif`;
  }

  function render() {
    if (styleIdx < 0) return;
    const btn = buttons[styleIdx];
    const style = btn.dataset.style;
    const type = TYPES[typeIdx];
    img.src = urlFor(style, type);
    img.alt = `${btn.dataset.title} (${TYPE_LABEL[type]})`;
    cap.textContent = `${btn.dataset.title} · ${TYPE_LABEL[type]} — ${btn.dataset.desc}`;
    if (!dlg.open && typeof dlg.showModal === 'function') dlg.showModal();
  }

  function step(dStyle, dType) {
    if (styleIdx < 0) return;
    if (dStyle) styleIdx = (styleIdx + dStyle + buttons.length) % buttons.length;
    if (dType) typeIdx = (typeIdx + dType + TYPES.length) % TYPES.length;
    render();
  }

  buttons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      opener = btn;
      styleIdx = idx;
      typeIdx = TYPES.indexOf(btn.dataset.type);
      if (typeIdx < 0) typeIdx = 0;
      render();
    });
  });
  closeBtn.addEventListener('click', () => dlg.close());
  prevBtn.addEventListener('click', () => step(-1, 0));
  nextBtn.addEventListener('click', () => step(1, 0));
  upBtn.addEventListener('click', () => step(0, -1));
  downBtn.addEventListener('click', () => step(0, 1));

  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1, 0); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1, 0); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); step(0, -1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); step(0, 1); }
  });

  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });

  dlg.addEventListener('close', () => {
    styleIdx = -1;
    if (opener && typeof opener.focus === 'function') opener.focus();
    img.removeAttribute('src');
  });
})();
