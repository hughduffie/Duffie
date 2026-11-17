/*
 * HD Advisory dot-matrix illustration engine.
 * Follows brand/illustration-style.md: 28 x 28 grid, 20px pitch, "on" dots 14px,
 * "off" dots 5px at 16% opacity, dots only, no text.
 *
 * Works in a browser (window.DotMatrix) and in Node (module.exports).
 * Cell values: 0 off, 1 dark, 2 accent, 3 white.
 */
(function (root) {
  var N = 28;

  // Palettes from brand/illustration-style.md, plus "ink" (the dark deck
  // colours used in the LinkedIn content plan deck: #121418 and #A1FF32).
  var PAL = {
    blue: { bg: '#D3E4FF', dark: '#0B2559', accent: '#0061FE', white: '#FFFFFF' },
    purple: { bg: '#F0D3FE', dark: '#4A1560', accent: '#E292FE', white: '#FFFFFF' },
    green: { bg: '#E4FFB8', dark: '#1F3A06', accent: '#A1FF32', white: '#FFFFFF' },
    brand: { bg: '#0061FE', dark: '#FFFFFF', accent: '#A1FF32', white: '#FFFFFF' },
    ink: { bg: '#121418', dark: '#FFFFFF', accent: '#A1FF32', white: '#FFFFFF' }
  };

  function mk() {
    var g = [];
    for (var r = 0; r < N; r++) { g.push([]); for (var c = 0; c < N; c++) g[r].push(0); }
    return g;
  }
  function set(g, c, r, v) {
    c = Math.round(c); r = Math.round(r);
    if (c >= 0 && c < N && r >= 0 && r < N) g[r][c] = v;
  }
  function disc(g, cx, cy, rad, v, filter) {
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      if (Math.hypot(c - cx, r - cy) <= rad && (!filter || filter(c, r))) g[r][c] = v;
    }
  }
  function ring(g, cx, cy, r0, r1, v) {
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var d = Math.hypot(c - cx, r - cy);
      if (d >= r0 && d <= r1) g[r][c] = v;
    }
  }
  function ell(g, cx, cy, a, b, v, filter) {
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var x = (c - cx) / a, y = (r - cy) / b;
      if (x * x + y * y <= 1 && (!filter || filter(c, r))) g[r][c] = v;
    }
  }
  function clearEll(g, cx, cy, a, b) {
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var x = (c - cx) / a, y = (r - cy) / b;
      if (x * x + y * y <= 1) g[r][c] = 0;
    }
  }
  function rect(g, c0, r0, c1, r1, v) {
    for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) set(g, c, r, v);
  }
  function line(g, x0, y0, x1, y1, v) {
    var steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
    for (var i = 0; i <= steps; i++) {
      var t = steps ? i / steps : 0;
      set(g, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, v);
    }
  }
  function px(g, list, v) { list.forEach(function (p) { set(g, p[0], p[1], v); }); }

  /* ---- Subjects ---- */

  // Whitelisting guide: creator avatar, accent badge, white check.
  function avatarBadge() {
    var g = mk();
    disc(g, 12.5, 9.5, 5.6, 1);
    ell(g, 12.5, 28, 12, 11.5, 1, function (c, r) { return r >= 17; });
    // clear zone around the badge, then the badge
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      if (Math.hypot(c - 21.5, r - 21.5) <= 7.3) g[r][c] = 0;
    }
    disc(g, 21.5, 21.5, 5.9, 2);
    px(g, [[18, 21], [19, 22], [20, 23], [21, 22], [22, 21], [23, 20], [24, 19]], 3);
    return g;
  }

  // Meta GEM and Andromeda guide: two-arm spiral galaxy.
  function galaxy() {
    var g = mk(), cx = 13.5, cy = 13.5;
    function wrap(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var d = Math.hypot(c - cx, r - cy);
      if (d > 13.7) continue;
      var ang = Math.atan2(r - cy, c - cx);
      var on = d <= 3.3 || Math.abs(wrap(ang - 0.4 * d)) < 0.55 || Math.abs(wrap(ang - 0.4 * d - Math.PI)) < 0.55;
      if (on) g[r][c] = d > 10 ? 2 : 1;
    }
    return g;
  }

  // Message, hook, angle, format, offer guide: five bars with square bullets.
  function brief() {
    var g = mk(), lens = [18, 13, 19, 10, 15];
    for (var i = 0; i < 5; i++) {
      var r0 = 3 + i * 5;
      rect(g, 2, r0, 4, r0 + 2, 1);
      rect(g, 7, r0, 7 + lens[i] - 1, r0 + 2, 1);
    }
    return g;
  }

  // Claude Code guide: terminal window (use the "brand" palette).
  function terminal() {
    var g = mk();
    rect(g, 1, 3, 26, 3, 1); rect(g, 1, 24, 26, 24, 1);
    rect(g, 1, 3, 1, 24, 1); rect(g, 26, 3, 26, 24, 1);
    rect(g, 1, 6, 26, 6, 1);
    px(g, [[4, 4], [6, 4], [8, 4]], 2);
    px(g, [[4, 9], [5, 10], [4, 11]], 2);
    rect(g, 8, 10, 17, 10, 3);
    rect(g, 4, 14, 20, 14, 3);
    rect(g, 4, 16, 14, 16, 3);
    rect(g, 4, 18, 18, 18, 3);
    rect(g, 4, 20, 5, 22, 2);
    return g;
  }

  // Values exercise: 10, 5, 4, 3, 2, 1 dots, the last one in accent.
  // Fewer values means a bigger mark: each row has fewer, larger discs.
  function funnel() {
    var g = mk();
    var rows = [
      { n: 10, pitch: 2, y: 1, rad: 0 },
      { n: 5, pitch: 5, y: 4.5, rad: 1 },
      { n: 4, pitch: 6, y: 9, rad: 1.5 },
      { n: 3, pitch: 7, y: 14, rad: 2 },
      { n: 2, pitch: 9, y: 19.5, rad: 2.2 },
      { n: 1, pitch: 0, y: 25, rad: 2.6 }
    ];
    rows.forEach(function (row, i) {
      for (var k = 0; k < row.n; k++) {
        var x = 13.5 + (k - (row.n - 1) / 2) * row.pitch;
        var v = i === 5 ? 2 : 1;
        if (row.rad === 0) set(g, x, row.y, v); else disc(g, Math.round(x), Math.round(row.y), row.rad, v);
      }
    });
    return g;
  }

  // Post 1, the video post worked: video camera with a lens and a record dot.
  function camera() {
    var g = mk();
    rect(g, 2, 9, 19, 20, 1);
    disc(g, 10.5, 14.5, 4.9, 0);
    disc(g, 10.5, 14.5, 3.2, 2);
    px(g, [[3, 10], [4, 10], [3, 11], [4, 11]], 2);
    for (var c = 21; c <= 26; c++) {
      var h = 2.5 + (c - 21) * 0.9;
      for (var r = 0; r < N; r++) if (Math.abs(r - 14.5) <= h) set(g, c, r, 1);
    }
    return g;
  }

  // Post 2, coaching: two speech bubbles in conversation.
  function bubbles() {
    var g = mk();
    rect(g, 2, 3, 17, 13, 1);
    px(g, [[2, 3], [17, 3], [2, 13], [17, 13]], 0);
    px(g, [[4, 14], [5, 14], [6, 14], [4, 15], [5, 15], [4, 16]], 1);
    // clear a gap around the front bubble
    for (var r = 11; r <= 23; r++) for (var c = 9; c <= 26; c++) g[r][c] = 0;
    rect(g, 10, 12, 25, 22, 1);
    px(g, [[10, 12], [25, 12], [10, 22], [25, 22]], 0);
    px(g, [[21, 23], [22, 23], [23, 23], [22, 24], [23, 24], [23, 25]], 2);
    px(g, [[14, 17], [17, 17], [20, 17]], 2);
    return g;
  }

  // Post 3, values exercise: the 10 to 1 funnel.
  function values() { return funnel(); }

  // Post 4, the new role at Sunrise: a sun on the horizon with accent rays.
  function sunrise() {
    var g = mk(), cx = 13.5, cy = 19;
    disc(g, cx, cy, 7.5, 1, function (c, r) { return r <= 19; });
    rect(g, 1, 21, 26, 23, 1);
    for (var k = 0; k <= 6; k++) {
      var a = Math.PI + k * Math.PI / 6;
      for (var d = 9.8; d <= 13; d += 0.3) set(g, cx + d * Math.cos(a), cy + d * Math.sin(a), 2);
    }
    return g;
  }

  // Post 5, Gypsy Hill: a wagon wheel.
  function wheel() {
    var g = mk(), cx = 13.5, cy = 13.5;
    ring(g, cx, cy, 11.3, 12.5, 1);
    for (var k = 0; k < 8; k++) {
      var a = k * Math.PI / 4;
      for (var d = 4; d <= 11; d += 0.25) set(g, cx + d * Math.cos(a), cy + d * Math.sin(a), 1);
    }
    disc(g, cx, cy, 3.6, 0);
    disc(g, cx, cy, 2.3, 2);
    return g;
  }

  // Post 6, Curious Brew: a pint with an accent head.
  function pint() {
    var g = mk();
    for (var r = 9; r <= 25; r++) {
      var hw = 7.5 - ((r - 9) / 16) * 2.5;
      for (var c = 0; c < N; c++) if (Math.abs(c - 13.5) <= hw) g[r][c] = 1;
    }
    rect(g, 6, 5, 21, 8, 2);
    [[8, 4, 10], [12, 4, 15], [17, 4, 19]].forEach(function (b) { rect(g, b[0], 3, b[2], 4, 2); });
    rect(g, 6, 9, 21, 9, 0);
    rect(g, 10, 12, 10, 22, 0);
    return g;
  }

  // Post 7, advisory: two people side by side, the second in front.
  function pair() {
    var g = mk();
    disc(g, 8.5, 9.5, 4.2, 1);
    ell(g, 8.5, 26, 7.5, 9.5, 1, function (c, r) { return r >= 15; });
    clearEll(g, 19.5, 26, 9, 11);
    disc(g, 19.5, 9.5, 5.2, 0);
    disc(g, 19.5, 9.5, 4.2, 2);
    ell(g, 19.5, 26, 7.5, 9.5, 1, function (c, r) { return r >= 15; });
    return g;
  }

  // Post 8, brands as IP owners: a TV (the give) and three small products (the takes).
  function tv() {
    var g = mk();
    rect(g, 2, 6, 25, 6, 1); rect(g, 2, 19, 25, 19, 1);
    rect(g, 2, 6, 2, 19, 1); rect(g, 25, 6, 25, 19, 1);
    line(g, 13.5, 5, 9, 1, 1); line(g, 13.5, 5, 18, 1, 1);
    for (var i = 0; i < 6; i++) rect(g, 11 + i, 9 + i, 11 + i, 16 - i, 2);
    rect(g, 5, 20, 6, 21, 1); rect(g, 21, 20, 22, 21, 1);
    rect(g, 5, 24, 7, 26, 1); rect(g, 12, 24, 14, 26, 1); rect(g, 19, 24, 21, 26, 1);
    return g;
  }

  // Post 9, Days: an alcohol-free can with a zero on it.
  function can() {
    var g = mk();
    rect(g, 8, 5, 19, 24, 1);
    rect(g, 9, 3, 18, 4, 1);
    rect(g, 9, 25, 18, 26, 1);
    disc(g, 13.5, 14.5, 4.9, 0);
    ring(g, 13.5, 14.5, 2.2, 3.9, 2);
    rect(g, 10, 6, 10, 9, 0);
    rect(g, 10, 20, 10, 23, 0);
    return g;
  }

  /* ---- Rendering ---- */

  function svg(g, pal, opts) {
    opts = opts || {};
    var p = typeof pal === 'string' ? PAL[pal] : pal;
    var size = N * 20, out = [];
    out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '"' +
      (opts.className ? ' class="' + opts.className + '"' : '') +
      (opts.title ? ' role="img" aria-label="' + opts.title + '"' : ' aria-hidden="true"') + '>');
    if (opts.title) out.push('<title>' + opts.title + '</title>');
    if (opts.bg !== false) out.push('<rect width="' + size + '" height="' + size + '" fill="' + p.bg + '"/>');
    out.push('<g fill="' + p.dark + '" fill-opacity="0.16">');
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      if (!g[r][c]) out.push('<circle cx="' + (c * 20 + 10) + '" cy="' + (r * 20 + 10) + '" r="2.5"/>');
    }
    out.push('</g>');
    [[1, p.dark], [2, p.accent], [3, p.white]].forEach(function (pair) {
      var pts = [];
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
        if (g[r][c] === pair[0]) pts.push('<circle cx="' + (c * 20 + 10) + '" cy="' + (r * 20 + 10) + '" r="7"/>');
      }
      if (pts.length) out.push('<g fill="' + pair[1] + '">' + pts.join('') + '</g>');
    });
    out.push('</svg>');
    return out.join('');
  }

  function stats(g) {
    var on = 0, acc = 0;
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) { if (g[r][c]) on++; if (g[r][c] === 2) acc++; }
    return { on: on, accent: acc, accentShare: on ? acc / on : 0 };
  }

  var api = {
    N: N, PAL: PAL, svg: svg, stats: stats,
    subjects: {
      avatarBadge: avatarBadge, galaxy: galaxy, brief: brief, terminal: terminal, funnel: funnel,
      camera: camera, bubbles: bubbles, values: values, sunrise: sunrise, wheel: wheel,
      pint: pint, pair: pair, tv: tv, can: can
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DotMatrix = api;
})(typeof window !== 'undefined' ? window : this);

