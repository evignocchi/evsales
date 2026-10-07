/* evsales.it */
(() => {
  'use strict';

  // ---- Config: fill these before launch -------------------------------
  const CONFIG = {
    calLink: '',            // Cal.com event, e.g. 'enea-vignocchi/45min'
    calOrigin: 'https://cal.com',
    linkedin: '',           // e.g. 'https://www.linkedin.com/in/...'
    piva: '',               // Partita IVA
    // Optional: also send the answers to a HubSpot form (public Forms API, no key).
    hubspot: { portalId: '', formGuid: '' },
  };
  // ----------------------------------------------------------------------

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  // ---- Static config into the page
  // until filled in, the LinkedIn links stay visible with a red "da inserire" note
  $$('[data-linkedin]').forEach(a => {
    if (CONFIG.linkedin) { a.href = CONFIG.linkedin; $$('[data-todo]', a).forEach(n => n.remove()); }
    else a.addEventListener('click', e => e.preventDefault());
  });
  if (CONFIG.piva) $$('[data-piva]').forEach(n => { n.textContent = CONFIG.piva; });
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  // ---- Nav border on scroll
  const nav = $('#nav');
  const onScrollNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  // ---- Backlit panes follow the pointer
  $$('[data-light]').forEach(p => {
    p.addEventListener('pointermove', e => {
      const r = p.getBoundingClientRect();
      p.style.setProperty('--mx', `${e.clientX - r.left}px`);
      p.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // ---- Reveal on view
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  $$('[data-reveal], .map, .timebar, .import').forEach(el => io.observe(el));

  // ---- Problem statement lights up word by word while scrolling
  const statement = $('[data-words]');
  let words = [];
  if (statement) {
    const text = statement.textContent.trim();
    statement.setAttribute('aria-label', text);
    statement.textContent = '';
    text.split(/\s+/).forEach((w, i, arr) => {
      const s = document.createElement('span');
      s.className = 'w'; s.textContent = w; s.setAttribute('aria-hidden', 'true');
      statement.appendChild(s);
      if (i < arr.length - 1) statement.appendChild(document.createTextNode(' '));
    });
    words = $$('.w', statement);
  }
  const paintWords = () => {
    if (!words.length) return;
    const r = statement.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
    const n = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('on', reduce || i < n));
  };

  // ---- Scene: scattered contacts fly into the pipeline
  const scene = $('#scena');
  const board = scene && $('.board', scene);
  const frost = scene && $('.board__frost', scene);
  const caps = scene ? $$('[data-cap]', scene) : [];
  const frs = scene ? $$('.fr', scene).map((el, i) => {
    const [fx, fy, fr] = el.dataset.from.split(',').map(Number);
    return { el, i, fx, fy, fr, to: +el.dataset.to, messy: $('.fr__messy', el), clean: $('.fr__clean', el), box: null };
  }) : [];
  let capIdx = 0;

  const measureScene = () => {
    if (!board) return;
    const b = board.getBoundingClientRect();
    frs.forEach(f => {
      const s = $(`[data-slot="${f.to}"]`, board).getBoundingClientRect();
      f.box = { x: s.left - b.left, y: s.top - b.top, w: s.width, h: s.height };
      f.bw = b.width; f.bh = b.height;
      f.el.style.width = `${s.width}px`;
      f.el.style.height = `${s.height}px`;
    });
  };

  const paintScene = () => {
    if (!scene || !frs.length || !frs[0].box) return;
    const r = scene.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = reduce ? 1 : clamp(-r.top / Math.max(total, 1));
    const small = window.innerWidth < 760;

    // glass clears between 18% and 50%
    const g = ease(clamp((p - 0.18) / 0.32));
    frost.style.setProperty('--fb', `${(1 - g) * 16}px`);
    frost.style.setProperty('--fa', `${(1 - g) * 0.55}`);

    frs.forEach(f => {
      const start = 0.3 + f.i * 0.035;
      const t = ease(clamp((p - start) / 0.28));
      // drift a little while still scattered
      const drift = Math.sin((p * 6) + f.i) * 6 * (1 - t);
      const sx = clamp((f.fx / 100) * f.bw - f.box.w / 2 + (small ? 0 : f.box.w * 0.2), 0, f.bw - f.box.w);
      const sy = (f.fy / 100) * f.bh;
      const x = sx + (f.box.x - sx) * t;
      const yv = sy + (f.box.y - sy) * t + drift;
      const rot = f.fr * (1 - t);
      const blur = Math.max(0, (1 - g) * 1.4 - t * 1.4);
      const sc = small ? 0.62 + 0.38 * t : 1;
      f.el.style.transform = `translate3d(${x.toFixed(1)}px, ${yv.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      f.el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
      const c = clamp((t - 0.7) / 0.3);
      f.clean.style.opacity = c;
      f.messy.style.opacity = 1 - c;
    });

    const ci = p < 0.3 ? 0 : p < 0.62 ? 1 : 2;
    if (ci !== capIdx) {
      caps.forEach((c, i) => c.classList.toggle('on', i === ci));
      capIdx = ci;
    }
  };

  // ---- One scroll loop for the scroll-driven pieces
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { paintWords(); paintScene(); ticking = false; });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { measureScene(); onScroll(); }, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measureScene(); onScroll(); });
  measureScene(); onScroll();

  // ---- Automation feed
  const feed = $('#feed');
  const FEED = [
    { ico: 'i-bell', b: 'Promemoria a Marco', s: 'Elettrica Ferri: preventivo senza risposta da 3 giorni', t: '09:00' },
    { ico: 'i-user', b: 'Nuovo contatto assegnato a Laura', s: 'Richiesta dal sito, zona Parma', t: '09:14' },
    { ico: 'i-clock', b: 'Attività per Paolo', s: 'Gatti Costruzioni fermo da 60 giorni: richiamare', t: '10:02' },
    { ico: 'i-mail', b: 'Riepilogo del lunedì inviato', s: '5 clienti da richiamare, 2 preventivi fermi', t: '07:30' },
  ];
  if (feed) {
    const make = (it) => {
      const d = document.createElement('div');
      d.className = 'feed__item';
      d.innerHTML = `<span class="ico"><svg class="i"><use href="#${it.ico}"/></svg></span><p><b></b><span></span></p><time></time>`;
      $('b', d).textContent = it.b; $('p span', d).textContent = it.s; $('time', d).textContent = it.t;
      return d;
    };
    if (reduce) {
      FEED.slice(0, 3).forEach(it => feed.appendChild(make(it)));
    } else {
      let k = 0, timer = null;
      const push = () => {
        feed.appendChild(make(FEED[k % FEED.length])); k++;
        while (feed.children.length > 3) feed.firstElementChild.remove();
      };
      push();
      const fio = new IntersectionObserver(([en]) => {
        if (en.isIntersecting && !timer) timer = setInterval(push, 2600);
        else if (!en.isIntersecting && timer) { clearInterval(timer); timer = null; }
      });
      fio.observe(feed);
    }
  }

  // ---- Case: before / after
  const seg = $('.seg');
  if (seg) {
    const tabs = $$('[role="tab"]', seg);
    const toast = $('#toast');
    let toastT;
    const select = (tab) => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      const v = tab.id === 'tab-dopo' ? 'dopo' : 'prima';
      seg.dataset.v = v;
      clearTimeout(toastT);
      toast.classList.remove('on');
      if (v === 'dopo') toastT = setTimeout(() => toast.classList.add('on'), reduce ? 0 : 900);
    };
    tabs.forEach(t => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const n = tabs[(tabs.indexOf(t) + 1) % 2]; n.focus(); select(n);
        }
      });
    });
    // show the "after" on its own once, the first time the demo is seen
    const demoIO = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { demoIO.disconnect(); setTimeout(() => { if (seg.dataset.v === 'prima' && !seg.dataset.touched) select(tabs[1]); }, reduce ? 0 : 2600); }
    }, { threshold: 0.5 });
    demoIO.observe($('.views'));
    tabs.forEach(t => t.addEventListener('pointerdown', () => { seg.dataset.touched = '1'; }));
  }

  // ---- Lead form
  const form = $('#lead');
  if (form) {
    const steps = $$('.fstep', form);
    const bars = $$('.progress i');
    const label = $('#progress-label');
    const next = $('#next');
    const back = $('#back');
    const err = $('#err');
    let cur = 1;
    const last = steps.length;

    const values = () => {
      const fd = new FormData(form);
      return {
        team: fd.get('team') || '',
        contatti: fd.getAll('contatti'),
        strumenti: fd.getAll('strumenti').concat(fd.get('altro') ? [fd.get('altro')] : []),
        nome: (fd.get('nome') || '').trim(),
        azienda: (fd.get('azienda') || '').trim(),
        email: (fd.get('email') || '').trim(),
        telefono: (fd.get('telefono') || '').trim(),
        privacy: !!fd.get('privacy'),
      };
    };

    const canGo = () => {
      const v = values();
      if (cur === 1) return !!v.team;
      if (cur === 2) return v.contatti.length > 0;
      return true;
    };
    const refresh = () => { next.disabled = !canGo(); };

    const go = (n, focus = true) => {
      cur = clamp(n, 1, last);
      steps.forEach(s => s.classList.toggle('on', +s.dataset.step === cur));
      bars.forEach((b, i) => b.classList.toggle('on', i < cur));
      label.textContent = `Passo ${cur} di ${last}`;
      back.hidden = cur === 1 || cur === last;
      next.hidden = cur === last;
      next.innerHTML = cur === 4 ? 'Scegli giorno e ora <svg class="i"><use href="#i-arrow"/></svg>' : 'Continua <svg class="i"><use href="#i-arrow"/></svg>';
      refresh();
      if (focus) {
        const first = $('.fstep.on input', form) || $('.fstep.on legend', form);
        if (first) first.focus({ preventScroll: true });
      }
      if (cur === last) openCal();
    };

    const validateContact = () => {
      const fields = ['nome', 'azienda', 'email'].map(n => form.elements[n]);
      let msg = '';
      fields.forEach(f => f.removeAttribute('aria-invalid'));
      for (const f of fields) {
        if (!f.value.trim()) { f.setAttribute('aria-invalid', 'true'); msg = msg || `Manca ${f.labels[0].textContent.toLowerCase()}.`; }
      }
      const em = form.elements.email;
      if (em.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim())) { em.setAttribute('aria-invalid', 'true'); msg = msg || 'L\'email non sembra corretta: controlla che ci sia la @ e il dominio.'; }
      if (!msg && !form.elements.privacy.checked) msg = 'Per continuare spunta il consenso privacy.';
      err.textContent = msg;
      const bad = $('[aria-invalid="true"]', form);
      if (bad) bad.focus();
      return !msg;
    };

    form.addEventListener('change', () => {
      refresh();
      // single choice: move on by itself
      if (cur === 1 && values().team) setTimeout(() => go(2), reduce ? 0 : 260);
    });
    form.addEventListener('input', refresh);
    back.addEventListener('click', () => go(cur - 1));
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!canGo()) return;
      if (cur === 4) {
        if (!validateContact()) return;
        sendHubspot(values());
      }
      go(cur + 1);
    });

    // prefill from hero chips or a link like evsales.it/?team=2-5#prenota
    const setTeam = (t) => {
      const r = $$('input[name="team"]', form).find(i => i.value === t);
      if (r) { r.checked = true; go(2, false); }
    };
    $$('[data-team]').forEach(b => b.addEventListener('click', () => {
      setTeam(b.dataset.team);
      $('#prenota').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      setTimeout(() => { const f = $('.fstep.on input', form); if (f) f.focus({ preventScroll: true }); }, reduce ? 0 : 700);
    }));
    const qs = new URLSearchParams(location.search);
    if (qs.get('team')) setTeam(qs.get('team'));
    ['nome', 'azienda', 'email'].forEach(k => { if (qs.get(k)) form.elements[k].value = qs.get(k); });

    go(cur, false);
    document.addEventListener('ev-consent', () => { if (cur === last) openCal(); });

    // ---- Cal.com
    function summaryText(v) {
      return [
        `Persone in vendita: ${v.team}`,
        `Contatti oggi: ${v.contatti.join(', ') || 'non indicato'}`,
        `Strumenti: ${v.strumenti.join(', ') || 'non indicato'}`,
        v.telefono ? `Telefono: ${v.telefono}` : '',
      ].filter(Boolean).join('\n');
    }
    function openCal() {
      const v = values();
      const sum = $('#summary');
      sum.innerHTML = '';
      [['Persone in vendita', v.team], ['Contatti oggi', v.contatti.join(', ')], ['Strumenti', v.strumenti.join(', ') || 'nessuno indicato']].forEach(([k, val]) => {
        const p = document.createElement('p'); const b = document.createElement('b');
        b.textContent = `${k}: `; p.appendChild(b); p.appendChild(document.createTextNode(val)); sum.appendChild(p);
      });
      const box = $('#cal');
      const direct = CONFIG.calLink ? `${CONFIG.calOrigin}/${CONFIG.calLink}?name=${encodeURIComponent(v.nome)}&email=${encodeURIComponent(v.email)}&notes=${encodeURIComponent(summaryText(v))}` : '';
      if (!CONFIG.calLink) {
        box.innerHTML = '<div class="cal__gate"><p><b>Il calendario non è ancora collegato.</b> Ho ricevuto le tue risposte qui sopra: appena il sito è online qui scegli giorno e ora.</p></div>';
        return;
      }
      if (store.get('ev-consent') !== 'yes') {
        box.innerHTML = '';
        const g = document.createElement('div'); g.className = 'cal__gate';
        g.innerHTML = '<p>Il calendario è fornito da Cal.com, un servizio esterno che usa i suoi cookie. Lo carico solo con il tuo permesso.</p><button type="button" class="btn">Carica il calendario <svg class="i"><use href="#i-cal"/></svg></button><a class="link" target="_blank" rel="noopener">Oppure aprilo su cal.com <svg class="i"><use href="#i-arrow"/></svg></a>';
        $('a', g).href = direct;
        $('button', g).addEventListener('click', () => { setConsent('yes'); openCal(); });
        box.appendChild(g);
        return;
      }
      box.innerHTML = '<div id="cal-inline" style="width:100%;min-height:520px"></div>';
      loadCal();
      window.Cal('init', 'ev45', { origin: CONFIG.calOrigin });
      window.Cal.ns.ev45('inline', {
        elementOrSelector: '#cal-inline',
        calLink: CONFIG.calLink,
        config: { layout: 'month_view', name: v.nome, email: v.email, notes: summaryText(v) },
      });
      window.Cal.ns.ev45('ui', { theme: 'light', hideEventTypeDetails: false, layout: 'month_view', cssVarsPerTheme: { light: { 'cal-brand': '#2348f2' } } });
    }
    function loadCal() {
      if (window.Cal) return;
      (function (C, A, L) { const p = function (a, ar) { a.q.push(ar); }; const d = C.document; C.Cal = C.Cal || function () { const cal = C.Cal; const ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, 'https://app.cal.com/embed/embed.js', 'init');
    }
    function sendHubspot(v) {
      const h = CONFIG.hubspot;
      if (!h.portalId || !h.formGuid) return;
      const fields = [
        ['firstname', v.nome], ['company', v.azienda], ['email', v.email], ['phone', v.telefono],
        ['message', summaryText(v)],
      ].filter(([, val]) => val).map(([name, value]) => ({ name, value }));
      fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${h.portalId}/${h.formGuid}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields, context: { pageUri: location.href, pageName: document.title } }),
      }).catch(() => { /* booking still works without it */ });
    }
  }

  // ---- Cookie banner
  const banner = $('#cookie');
  function setConsent(v) { store.set('ev-consent', v); banner.classList.remove('on'); }
  if (banner) {
    // shown after the first scroll, so it never covers the first viewport
    if (!store.get('ev-consent')) {
      const show = () => { if (window.scrollY > 200) { banner.classList.add('on'); window.removeEventListener('scroll', show); } };
      window.addEventListener('scroll', show, { passive: true });
    }
    $$('[data-consent]', banner).forEach(b => b.addEventListener('click', () => {
      setConsent(b.dataset.consent);
      if (b.dataset.consent === 'yes') document.dispatchEvent(new Event('ev-consent'));
    }));
    $$('[data-cookie-open]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); banner.classList.add('on'); }));
  }
})();
