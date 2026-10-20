(function () {
  var doc = document.documentElement;
  var raf = window.requestAnimationFrame.bind(window);
  var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 1); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var pt = doc.lang === 'pt-BR';
  var live = document.getElementById('live');

  function say(text) {
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 30);
  }

  var warmed = false;
  function warm() {
    if (warmed) return;
    warmed = true;
    var l = document.createElement('link');
    l.rel = 'preconnect';
    l.href = 'https://www.youtube-nocookie.com';
    document.head.appendChild(l);
  }
  ['pointerover', 'pointerdown'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (e.target.closest && e.target.closest('a[data-yt]')) warm();
    }, { passive: true });
  });

  function plain(e) { return !(e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey); }

  document.addEventListener('click', function (e) {
    if (!e.target.closest || !plain(e)) return;
    var m = e.target.closest('a[data-mp4]');
    if (m) {
      e.preventDefault();
      var poster = m.querySelector('img');
      var box = document.createElement('div');
      box.className = 'video';
      var v = document.createElement('video');
      v.src = m.dataset.mp4;
      if (poster) v.poster = poster.currentSrc || poster.src;
      v.controls = true;
      v.muted = true;
      v.playsInline = true;
      v.autoplay = true;
      v.setAttribute('aria-label', m.dataset.title);
      box.appendChild(v);
      m.replaceWith(box);
      v.play().catch(function () {});
      v.focus();
      return;
    }
    var a = e.target.closest('a[data-yt]');
    if (a) {
      e.preventDefault();
      var wrap = document.createElement('div');
      wrap.className = 'video';
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + a.dataset.yt + '?autoplay=1&mute=1&rel=0&playsinline=1';
      f.title = a.dataset.title;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      wrap.appendChild(f);
      a.replaceWith(wrap);
      f.focus();
      return;
    }
    var c = e.target.closest('[data-copy]');
    if (c) {
      var done = function () {
        c.classList.add('is-copied');
        say(c.dataset.done);
        if (c.dataset.label === undefined && !c.querySelector('code')) {
          c.dataset.label = c.textContent;
          c.textContent = c.dataset.done;
        }
        clearTimeout(c._t);
        c._t = setTimeout(function () {
          c.classList.remove('is-copied');
          if (c.dataset.label !== undefined) { c.textContent = c.dataset.label; delete c.dataset.label; }
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(c.dataset.copy).then(done, function () {});
      }
    }
  });

  var top = document.querySelector('.top');
  var bar = document.querySelector('.progress');
  var stops = [].slice.call(document.querySelectorAll('[data-stop]'));
  var layer = document.querySelector('.route-layer');
  var route = layer && layer.querySelector('.route');
  var fill = route && route.querySelector('.route__fill');
  var dot = route && route.querySelector('.route__dot');
  var dotUse = dot && dot.querySelector('use');
  var here = document.querySelector('.here');
  var sheet = document.getElementById('route-sheet');
  var heroIndex = document.querySelector('.hero .index');
  var dock = document.querySelector('.dock');
  var dockFrom = document.getElementById('hero-ctas');
  var dockUntil = document.querySelector('.night');

  var nodes = [];
  if (route) {
    stops.forEach(function () {
      var n = document.createElement('span');
      n.className = 'route__node';
      route.insertBefore(n, dot);
      nodes.push(n);
    });
  }

  var sheetLinks = [];
  if (sheet && heroIndex) {
    sheet.appendChild(heroIndex.cloneNode(true));
    sheetLinks = [].slice.call(sheet.querySelectorAll('a'));
  }

  var ys = [], vh = 0, docH = 0, dockA = 0, dockB = 0, routeH = 0, routeOn = false;
  var active = -2, atIdx = -2, queued = false;

  function measure() {
    vh = window.innerHeight;
    docH = doc.scrollHeight;
    var sy = window.scrollY;
    ys = stops.map(function (s) {
      var r = (s.querySelector('.num') || s).getBoundingClientRect();
      return r.top + sy + r.height / 2;
    });
    if (dockFrom) dockA = dockFrom.getBoundingClientRect().bottom + sy;
    if (dockUntil) dockB = dockUntil.getBoundingClientRect().top + sy;
    routeOn = !!(route && layer.offsetParent !== null && ys.length > 1);
    if (routeOn) {
      var layerTop = layer.getBoundingClientRect().top + sy;
      routeH = ys[ys.length - 1] - ys[0];
      route.style.top = (ys[0] - layerTop) + 'px';
      route.style.height = routeH + 'px';
      nodes.forEach(function (n, i) { n.style.top = (ys[i] - ys[0]) + 'px'; });
    }
    update();
  }

  function setHere(a) {
    if (!here) return;
    var s = stops[a];
    here.querySelector('.here__num').textContent = s ? s.dataset.num : '00';
    here.querySelector('.here__name').textContent = s ? s.dataset.short : here.dataset.start;
    here.querySelector('use').setAttribute('href', '#i-' + (s ? s.dataset.icon : 'route'));
    here.classList.remove('pop');
    raf(function () { here.classList.add('pop'); });
    sheetLinks.forEach(function (l, i) {
      if (i === a) l.setAttribute('aria-current', 'location');
      else l.removeAttribute('aria-current');
    });
  }

  function update() {
    queued = false;
    var sy = window.scrollY;
    if (top) top.classList.toggle('is-scrolled', sy > 8);
    var max = docH - vh;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, Math.max(0, sy / max)) : 0) + ')';
    var left = docH - (sy + vh);
    var tail = Math.max(0, Math.min(1, 1 - left / (vh * 0.6)));
    var probe = sy + vh * (0.42 + 0.45 * tail);
    var a = -1;
    for (var i = 0; i < ys.length; i++) if (ys[i] <= probe + 4) a = i;
    if (a !== active) { active = a; setHere(a); }
    if (dock) dock.classList.toggle('is-on', sy + vh * 0.2 > dockA && sy + vh < dockB + 40);
    if (!routeOn) return;
    var y = Math.max(0, Math.min(routeH, probe - ys[0]));
    var k = 0, best = Infinity;
    for (var j = 0; j < ys.length; j++) {
      var d = y - (ys[j] - ys[0]);
      if (Math.abs(d) < Math.abs(best)) { best = d; k = j; }
    }
    var R = 90;
    if (Math.abs(best) < R) {
      var t = Math.abs(best) / R;
      y = (ys[k] - ys[0]) + best * t * t;
    }
    dot.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    fill.style.transform = 'scaleY(' + (routeH ? y / routeH : 0).toFixed(4) + ')';
    var at = Math.abs(best) < 34 ? k : -1;
    if (at !== atIdx) {
      atIdx = at;
      dot.classList.toggle('is-at', at >= 0);
      if (at >= 0) dotUse.setAttribute('href', '#i-' + stops[at].dataset.icon);
    }
    for (var n = 0; n < nodes.length; n++) nodes[n].classList.toggle('is-passed', ys[n] - ys[0] <= y + 1);
  }

  var measured = false;
  function start() {
    if (measured) return;
    measured = true;
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
    else window.addEventListener('resize', remeasure);
  }
  function queue() {
    if (!measured) { start(); return; }
    if (!queued) { queued = true; raf(update); }
  }
  window.addEventListener('scroll', queue, { passive: true });

  var remeasure = (function () {
    var pending = false;
    return function () {
      if (pending) return;
      pending = true;
      raf(function () { pending = false; measure(); });
    };
  })();

  function openSheet(open) {
    if (!sheet || !here) return;
    sheet.hidden = !open;
    here.setAttribute('aria-expanded', String(open));
    if (open) {
      var cur = sheet.querySelector('[aria-current]') || sheet.querySelector('a');
      if (cur) cur.focus({ preventScroll: true });
    }
  }
  if (here && sheet) {
    here.addEventListener('click', function () { start(); openSheet(sheet.hidden); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) openSheet(false); });
    document.addEventListener('click', function (e) {
      if (!sheet.hidden && !sheet.contains(e.target) && !here.contains(e.target)) openSheet(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !sheet.hidden) { openSheet(false); here.focus(); }
    });
  }

  document.querySelectorAll('.proof').forEach(function (p) {
    var tabs = [].slice.call(p.querySelectorAll('.proof__tab'));
    var panels = [].slice.call(p.querySelectorAll('.proof__panel'));
    var caps = [].slice.call(p.querySelectorAll('.proof__caps p'));
    function pick(i) {
      tabs.forEach(function (t, j) { t.setAttribute('aria-pressed', String(i === j)); });
      panels.forEach(function (x, j) { x.classList.toggle('is-on', i === j); });
      caps.forEach(function (x, j) { x.classList.toggle('is-on', i === j); });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(i); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (i + d + tabs.length) % tabs.length;
        tabs[n].focus();
        pick(n);
      });
    });
  });

  var eng = document.querySelector('.engrave');
  if (eng) {
    var input = eng.querySelector('input');
    var text = eng.querySelector('textPath');
    input.addEventListener('input', function () {
      text.textContent = input.value || input.placeholder;
      if (reduce) return;
      eng.classList.remove('is-typing');
      raf(function () { eng.classList.add('is-typing'); });
    });
  }

  var race = document.querySelector('.race');
  if (race) {
    var lanes = race.querySelectorAll('.lane');
    var bars = race.querySelectorAll('.track i');
    var outs = race.querySelectorAll('output');
    var T = [11.9, 3.5];
    var SPEED = 3.4;
    var running = false;
    var fmt = function (v) { var s = v.toFixed(1); return (pt ? s.replace('.', ',') : s) + ' s'; };
    var draw = function (t) {
      for (var i = 0; i < 2; i++) {
        var v = Math.min(t, T[i]);
        bars[i].style.transform = 'scaleX(' + (v / T[0]).toFixed(4) + ')';
        outs[i].textContent = fmt(v);
        lanes[i].classList.toggle('is-done', t >= T[i]);
      }
    };
    var run = function () {
      if (running) return;
      running = true;
      var t0 = performance.now();
      var step = function (now) {
        var t = (now - t0) / 1000 * SPEED;
        if (t >= T[0]) { draw(T[0]); running = false; return; }
        draw(t);
        raf(step);
      };
      raf(step);
    };
    race.querySelector('.again').addEventListener('click', function () {
      if (reduce) { draw(T[0]); return; }
      draw(0);
      run();
    });
    if (!reduce && 'IntersectionObserver' in window) {
      draw(0);
      var ro = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { ro.disconnect(); run(); }
      }, { threshold: 0.6 });
      ro.observe(race);
    }
  }

  var sync = document.querySelector('.sync');
  if (sync && !reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      sync.classList.toggle('is-on', es[0].isIntersecting);
    }, { threshold: 0.2 }).observe(sync);
  }

  var rises = document.querySelectorAll('.rise');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    rises.forEach(function (r) { io.observe(r); });
  } else {
    rises.forEach(function (r) { r.classList.add('in'); });
  }

  if (fine && !reduce) {
    document.querySelectorAll('.store .frame').forEach(function (f) {
      var box = null;
      f.addEventListener('pointerenter', function () { box = f.getBoundingClientRect(); });
      f.addEventListener('pointermove', function (e) {
        if (!box) return;
        var x = (e.clientX - box.left) / box.width - 0.5;
        var y = (e.clientY - box.top) / box.height - 0.5;
        f.style.setProperty('--ry', (x * 5).toFixed(2) + 'deg');
        f.style.setProperty('--rx', (-y * 4).toFixed(2) + 'deg');
      });
      f.addEventListener('pointerleave', function () {
        box = null;
        f.style.removeProperty('--rx');
        f.style.removeProperty('--ry');
      });
    });

    var peek = document.querySelector('.peek');
    if (peek && heroIndex && window.innerWidth >= 1000) {
      var pimg = peek.querySelector('img');
      var px = 0, py = 0, tx = 0, ty = 0, on = false, loop = false;
      var tick = function () {
        px += (tx - px) * 0.2;
        py += (ty - py) * 0.2;
        peek.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0) rotate(' + Math.max(-6, Math.min(6, (tx - px) * 0.05)).toFixed(2) + 'deg)';
        if (on || Math.abs(tx - px) > 0.5 || Math.abs(ty - py) > 0.5) raf(tick);
        else loop = false;
      };
      heroIndex.addEventListener('pointermove', function (e) {
        tx = e.clientX + 28;
        ty = e.clientY - 80;
        if (!on) { px = tx; py = ty; }
        var link = e.target.closest('a');
        var src = link && link.dataset.thumb;
        if (src) {
          if (pimg.getAttribute('src') !== src) pimg.src = src;
          on = true;
          peek.classList.add('on');
        } else {
          on = false;
          peek.classList.remove('on');
        }
        if (!loop) { loop = true; raf(tick); }
      });
      heroIndex.addEventListener('pointerleave', function () { on = false; peek.classList.remove('on'); });
    }
  }

  if (window.scrollY > 0) idle(start);
})();
