(function () {
  'use strict';

  /* ---------- Settings for the live site ---------- */
  var CONFIG = {
    mode: 'live',                 // 'live' posts the report form to /api/subscribe. 'prototype' shows a message instead.
    site: 'https://hughduffie.com/values-exercise',
    showPricing: true,
    pricing: [{ name: 'Advisory', price: '£1,250 a month' }, { name: 'Sprint', price: 'One-off' }],
    links: {
      book: '/contact',
      advisory: '/advisory',
      library: '/resources',
      brand: '/resources/brand-guidelines-in-figma',
      creative: '/resources/creative-strategy-for-founders',
      creators: '/resources/creator-marketing'
    }
  };

  /* ---------- Data ---------- */
  var THEMES = {
    INT: { name: 'Integrity and trust',
      means: 'You decide by asking what is right before what is quick. People tend to trust you because you say what you will do and then do it.',
      brand: 'In a brand, this shows up as plain claims, clear pricing and standing behind the product when something goes wrong.',
      watch: 'Decisions can slow down when the honest option costs money. You may also judge others by your own standard.' },
    GRO: { name: 'Growth and learning',
      means: 'You treat most situations as a chance to learn something, and you are comfortable with not knowing yet.',
      brand: 'It helps a brand test, read the results and change course without ego. Teams like this tend to improve faster than they plan.',
      watch: 'Learning can turn into a reason to wait. Set a date for acting on what you already know.' },
    CON: { name: 'Connection and care',
      means: 'You put relationships first and you notice how the people around you are doing.',
      brand: 'It builds loyal customers and teams that stay. Community, customer service and creator relationships tend to be strong.',
      watch: 'Hard conversations can get put off. Kind and clear can be the same sentence.' },
    DRV: { name: 'Drive and achievement',
      means: 'You want to do things well and see results. Targets and standards motivate you.',
      brand: 'It gets things shipped and measured. Growth plans have owners and dates.',
      watch: 'Pace can crowd out rest and reflection. Check each quarter what you are optimising for.' },
    FRE: { name: 'Freedom and balance',
      means: 'You protect your time, your energy and your room to choose how you work.',
      brand: 'It tends to produce focused brands and calm teams that do a few things properly.',
      watch: 'Other people\'s urgency can become your problem. Agree what is urgent before the week starts.' },
    CRE: { name: 'Creativity and curiosity',
      means: 'You want to make new things and try different ways of doing them.',
      brand: 'It produces distinctive creative and fresh formats, and it finds angles competitors miss.',
      watch: 'Novelty can win over consistency. A good idea still needs repeating before people remember it.' },
    PUR: { name: 'Purpose and impact',
      means: 'You want your work to matter beyond the numbers.',
      brand: 'A mission people believe can bring customers in and keep a team together, as long as the product backs it up.',
      watch: 'A mission the product does not support reads as marketing. Check each claim against the facts.' },
    SEC: { name: 'Security and stability',
      means: 'You prefer solid ground: predictable revenue, clear roles and rules that hold.',
      brand: 'It builds reliable operations, healthy cash and processes that scale.',
      watch: 'Steady can turn into slow. Decide how much of your budget is for trying new things.' },
    INF: { name: 'Influence and standing',
      means: 'You like leading, being recognised and having a say in direction.',
      brand: 'It helps a founder build a profile, make decisions and take responsibility for results.',
      watch: 'Recognition can steer choices more than evidence does. Ask what you would do if nobody found out.' }
  };
  var THEME_KEYS = Object.keys(THEMES);

  var RAW = 'A better world:PUR|Ability to forgive:CON|Accountability:INT|Achievement:DRV|Activity and involvement:DRV|Advancement and promotion:DRV|Adventure:CRE|Aesthetic/arts:CRE|Affection (love and caring):CON|Affiliation (close relationships):CON|Altruism:PUR|Ambition:DRV|Authenticity:INT|Authority:INF|Balance:FRE|Caring:CON|Challenge:DRV|Change and variety:CRE|Civic virtue:PUR|Collaboration/cooperation:CON|Community:CON|Compassion:CON|Competence:DRV|Competition:DRV|Courage:DRV|Creativity:CRE|Decisiveness:DRV|Democracy:PUR|Ecological awareness:PUR|Effectiveness:DRV|Efficiency:DRV|Empathy:CON|Enjoyment:FRE|Enthusiasm:CRE|Equality:PUR|Ethical practice:INT|Excellence:DRV|Fairness:INT|Fame:INF|Family:CON|Fast living:CRE|Financial security:SEC|Flexibility:FRE|Friendships:CON|Giving:CON|Growth:GRO|Happiness:FRE|Having a family:CON|Health:FRE|Helping other people:CON|Public service:PUR|Honesty:INT|Humor:CRE|Independence:FRE|Influence:INF|Inner harmony:FRE|Innovation:CRE|Integrity:INT|Intellectual status:INF|Job security:SEC|Justice:INT|Knowledge:GRO|Leadership:INF|Learning:GRO|Location:FRE|Logic:GRO|Loyalty:CON|Market position:INF|Meaningful work:PUR|Merit:DRV|Nature:PUR|Obedience:SEC|Order/stability/conformity:SEC|Personal development:GRO|Physical challenge/fitness:DRV|Pleasure:FRE|Politeness:CON|Political freedom:FRE|Power and authority:INF|Pride:DRV|Privacy:FRE|Purity:INT|Recognition (respect from others):INF|Reflection/ Self awareness:GRO|Religion:PUR|Reputation:INF|Respect:INT|Responsibility:INT|Security:SEC|Self control:SEC|Self-respect:INT|Serenity:FRE|Social recognition:INF|Sophistication:CRE|Spirituality:PUR|Stability:SEC|Status:INF|Supervising others:INF|Time freedom:FRE|Truth:INT|Wealth:SEC|Wisdom:GRO|Working under pressure:DRV|Working alone:FRE';
  var VALUES = RAW.split('|').map(function (s) { var i = s.lastIndexOf(':'); return { name: s.slice(0, i), theme: s.slice(i + 1) }; })
    .sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
  var VT = {}; VALUES.forEach(function (v) { VT[v.name] = v.theme; });

  var TENSIONS = [
    { title: 'Steady and moving', a: ['Stability', 'Security', 'Job security', 'Financial security', 'Order/stability/conformity'], b: ['Adventure', 'Change and variety', 'Challenge', 'Innovation', 'Fast living'],
      ask: 'You want things to hold steady and you want them to move. When a new channel puts steady revenue at risk, which one wins? Decide the rule before the moment arrives.' },
    { title: 'Together and alone', a: ['Collaboration/cooperation', 'Community', 'Affiliation', 'Friendships'], b: ['Independence', 'Working alone', 'Privacy'],
      ask: 'You value working with people and working on your own. Which parts of your week need other people, and which need protecting from them?' },
    { title: 'Money and meaning', a: ['Wealth', 'Financial security', 'Advancement and promotion', 'Market position'], b: ['Meaningful work', 'A better world', 'Altruism', 'Giving', 'Public service'],
      ask: 'You care about earning and about the work meaning something. What return makes the work sustainable, and what would you turn down even if it paid well?' },
    { title: 'Drive and balance', a: ['Ambition', 'Achievement', 'Competition', 'Working under pressure', 'Challenge'], b: ['Balance', 'Inner harmony', 'Serenity', 'Time freedom', 'Family', 'Health'],
      ask: 'You want to push and you want to protect your energy. What does a good week look like, and what tells you that you have gone too far?' }
  ];

  var EXAMPLE = {
    picked: ['Honesty', 'Learning', 'Family', 'Creativity', 'Community', 'Independence', 'Excellence', 'Courage', 'Fairness', 'Balance'],
    crossed: ['Independence', 'Excellence', 'Courage', 'Fairness', 'Balance'],
    ranked: ['Honesty', 'Learning', 'Family', 'Creativity', 'Community']
  };

  /* ---------- State ---------- */
  var KEY = 'hd-values-v1';
  var S = blank();
  function blank() { return { stage: 'pick', picked: [], custom: [], crossed: [], remaining: [], cutOrder: [], ranked: [], defs: {}, name: '', example: false, cand: null }; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); if (o && o.stage && !o.example) S = Object.assign(blank(), o); } } catch (e) {}
  }

  /* ---------- Helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function themeOf(v) {
    if (VT[v]) return VT[v];
    for (var i = 0; i < S.custom.length; i++) if (S.custom[i].name === v) return S.custom[i].theme || '';
    return '';
  }
  function isMine(v) { return !VT[v]; }
  function allValues() { return VALUES.map(function (v) { return v.name; }).concat(S.custom.map(function (c) { return c.name; })); }
  function dm(subject, pal, title) { return DotMatrix.svg(DotMatrix.subjects[subject](), pal, { title: title }); }
  function chip(v, extra) {
    return '<button type="button" class="chip' + (isMine(v) ? ' mine' : '') + (extra && extra.cls ? ' ' + extra.cls : '') + '" data-a="' + (extra && extra.a || 'toggle') + '" data-v="' + esc(v) + '"' +
      (extra && extra.pressed !== undefined ? ' aria-pressed="' + extra.pressed + '"' : '') + (extra && extra.disabled ? ' disabled' : '') + '>' + esc(v) + '</button>';
  }
  function scrollToStage() { var el = $('progress'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  /* ---------- Progress ---------- */
  var STEPS = [['pick', 'Pick ten'], ['cut10', 'Cut to five'], ['rounds', 'Cut to one'], ['sense', 'Sense check'], ['report', 'Report']];
  function renderProgress() {
    var idx = STEPS.map(function (s) { return s[0]; }).indexOf(S.stage);
    var steps = '<ol class="steps">' + STEPS.map(function (s, i) { return '<li class="' + (i < idx ? 'done' : i === idx ? 'now' : '') + '"' + (i === idx ? ' aria-current="step"' : '') + '>' + s[1] + '</li>'; }).join('') + '</ol>';
    var nums = [10, 5, 4, 3, 2, 1];
    var cur = S.stage === 'pick' || S.stage === 'cut10' ? 10 : S.stage === 'rounds' ? S.remaining.length : 1;
    var curIdx = nums.indexOf(cur);
    var dots = '<div class="count-dots" aria-hidden="true">' + nums.map(function (n, i) { return '<span class="s' + i + ' ' + (i < curIdx ? 'done' : i === curIdx ? 'now' : '') + '">' + n + '</span>'; }).join('') + '</div>';
    $('progress').innerHTML = steps + dots;
  }

  /* ---------- Stages ---------- */
  function render() {
    var stageWrap = $('stage-wrap'), report = $('report'); $('top').hidden = S.stage === 'report';
    if (S.stage === 'report') { stageWrap.hidden = true; report.hidden = false; renderReport(); return; }
    report.hidden = true; stageWrap.hidden = false;
    renderProgress();
    var st = $('stage');
    if (S.stage === 'pick') st.innerHTML = pickView();
    else if (S.stage === 'cut10') st.innerHTML = cutView();
    else if (S.stage === 'rounds') st.innerHTML = roundsView();
    else st.innerHTML = senseView();
    save();
  }

  function pickView() {
    return '<div class="stage-head"><p class="eyebrow">Step 1 of 4</p><h2>Pick your ten</h2>' +
      '<p>From this list of values, work and personal, select the ten that matter most to you. Think of them as guides for how to behave, or as parts of a way of life you value. If one is missing, add your own.</p></div>' +
      '<div class="tools"><label class="sr" for="q">Search the list</label><input id="q" type="search" placeholder="Search the list" autocomplete="off"></div>' +
      '<div class="chips" id="chips">' + allValues().map(function (v) { return chip(v, { pressed: S.picked.indexOf(v) > -1, disabled: S.picked.length >= 10 && S.picked.indexOf(v) < 0 }); }).join('') + '</div>' +
      '<details class="add"><summary>Add a value of your own</summary><div class="addform">' +
      '<div class="field"><label for="cn">Your value</label><input id="cn" type="text" maxlength="40" autocomplete="off"></div>' +
      '<div class="field"><label for="ct">Closest theme</label><select id="ct"><option value="">Not sure</option>' + THEME_KEYS.map(function (k) { return '<option value="' + k + '">' + esc(THEMES[k].name) + '</option>'; }).join('') + '</select></div>' +
      '<button type="button" class="btn small" data-a="addCustom">Add</button></div></details>' +
      '<div class="tray" id="tray">' + trayHtml() + '</div>';
  }
  function trayHtml() {
    var n = S.picked.length;
    return '<div class="tray-list">' + (n ? S.picked.map(function (v) { return chip(v, { pressed: true }).replace('aria-pressed="true"', 'aria-pressed="true" aria-label="Remove ' + esc(v) + '"'); }).join('') : 'Your ten will appear here.') + '</div>' +
      '<div class="tray-act"><span class="tally"><b>' + n + '</b> of 10 picked</span><button type="button" class="btn primary" data-a="toCut"' + (n === 10 ? '' : ' disabled') + '>Continue</button></div>';
  }
  function updatePick() {
    var chips = document.querySelectorAll('#chips .chip');
    for (var i = 0; i < chips.length; i++) {
      var v = chips[i].getAttribute('data-v'), on = S.picked.indexOf(v) > -1;
      chips[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      chips[i].disabled = !on && S.picked.length >= 10;
    }
    $('tray').innerHTML = trayHtml(); save();
  }

  function cutView() {
    var n = S.crossed.length;
    return '<div class="stage-head"><p class="eyebrow">Step 2 of 4</p><h2>Cut to five</h2>' +
      '<p>Imagine you are only allowed five values. Which five would you give up? Select them to cross them off.</p></div>' +
      '<div class="chips big">' + S.picked.map(function (v) { var on = S.crossed.indexOf(v) > -1; return chip(v, { a: 'cross10', cls: on ? 'crossed' : '', pressed: on }); }).join('') + '</div>' +
      '<div class="act-row"><button type="button" class="btn ghost" data-a="backPick">Back</button><button type="button" class="btn primary" data-a="toRounds"' + (n === 5 ? '' : ' disabled') + '>Continue</button><span class="tally"><b>' + n + '</b> of 5 crossed off</span></div>';
  }

  function roundsView() {
    var keep = S.remaining.length - 1;
    return '<div class="stage-head"><p class="eyebrow">Step 3 of 4</p><h2>Now you can keep ' + keep + '</h2>' +
      '<p>Which one do you give up? Select it, then cross it off. Keep going until one value is left.</p></div>' +
      '<div class="chips big">' + S.remaining.map(function (v) { return chip(v, { a: 'cand', cls: S.cand === v ? 'cand' : '', pressed: S.cand === v }); }).join('') + '</div>' +
      '<div class="act-row"><button type="button" class="btn primary" data-a="cross"' + (S.cand ? '' : ' disabled') + '>' + (S.cand ? 'Cross off ' + esc(S.cand) : 'Cross off') + '</button>' +
      (S.cutOrder.length ? '<button type="button" class="btn ghost" data-a="undo">Undo last</button>' : '<button type="button" class="btn ghost" data-a="backCut">Back</button>') + '</div>' +
      (S.cutOrder.length ? '<div class="rounds-note"><span>Crossed off so far:</span>' + S.cutOrder.map(function (v) { return chip(v, { a: 'noop', cls: 'faded' }); }).join('') + '</div>' : '');
  }

  function senseView() {
    var items = S.ranked.map(function (v, i) {
      var t = themeOf(v);
      return '<li class="rank"><div class="n" aria-hidden="true">' + (i + 1) + '</div><div><h3>' + esc(v) + '</h3>' +
        '<p class="tagline">' + (t ? esc(THEMES[t].name) : 'Your own value') + '</p>' +
        '<label class="sr" for="def' + i + '">What ' + esc(v) + ' means to you</label>' +
        '<textarea id="def' + i + '" data-def="' + esc(v) + '" placeholder="What does this mean to you, in your own words? (optional)">' + esc(S.defs[v] || '') + '</textarea></div>' +
        '<div class="mv"><button type="button" data-a="up" data-i="' + i + '" aria-label="Move ' + esc(v) + ' up"' + (i === 0 ? ' disabled' : '') + '>&uarr;</button>' +
        '<button type="button" data-a="down" data-i="' + i + '" aria-label="Move ' + esc(v) + ' down"' + (i === 4 ? ' disabled' : '') + '>&darr;</button></div></li>';
    }).join('');
    return '<div class="stage-head"><p class="eyebrow">Step 4 of 4</p><h2>Sense check</h2>' +
      '<p>This is your order, from the last value standing to the first one you cut. Does it feel right? If something belongs higher, move it. Then say in your own words what each value means to you.</p></div>' +
      '<ol class="rank-list">' + items + '</ol>' +
      '<div class="rest-list"><h3>Also on your list of ten</h3><div class="chips">' + S.crossed.map(function (v) { return chip(v, { a: 'noop', cls: 'faded' }).replace(' faded', ''); }).join('') + '</div></div>' +
      '<div class="field name"><label for="nm">Your name (optional, shown on the report)</label><input id="nm" type="text" maxlength="60" value="' + esc(S.name) + '" autocomplete="name"></div>' +
      '<div class="act-row"><button type="button" class="btn ghost" data-a="redo">Redo the cuts</button><button type="button" class="btn primary" data-a="toReport">See my report</button></div>';
  }

  /* ---------- Report ---------- */
  function themeScores() {
    var sc = {}, w = [5, 4, 3, 2, 1];
    THEME_KEYS.forEach(function (k) { sc[k] = 0; });
    S.ranked.forEach(function (v, i) { var t = themeOf(v); if (t) sc[t] += w[i]; });
    S.crossed.forEach(function (v) { var t = themeOf(v); if (t) sc[t] += 0.5; });
    return sc;
  }
  function barSvg(n, top) {
    var out = '<svg viewBox="0 0 216 14" role="img" aria-label="' + n + ' of 12">';
    for (var i = 0; i < 12; i++) out += '<circle class="' + (i < n ? (top ? 'top' : 'on') : 'off') + '" cx="' + (i * 18 + 7) + '" cy="7" r="' + (i < n ? 6 : 2.5) + '"/>';
    return out + '</svg>';
  }
  function tensionHtml() {
    var all = S.ranked.concat(S.crossed), out = [];
    TENSIONS.forEach(function (t) {
      var a = all.filter(function (v) { return t.a.indexOf(v) > -1; }), b = all.filter(function (v) { return t.b.indexOf(v) > -1; });
      if (a.length && b.length) out.push('<div class="tension"><h4>' + esc(t.title) + '</h4><p class="pair">' + esc(a.join(', ')) + ' and ' + esc(b.join(', ')) + '</p><p>' + esc(t.ask) + '</p></div>');
    });
    return out;
  }
  function summaryText(sc, sorted) {
    var lines = ['My core values', ''];
    S.ranked.forEach(function (v, i) { lines.push((i + 1) + '. ' + v); });
    lines.push('', 'Also on my list: ' + S.crossed.join(', '));
    var top = sorted.filter(function (k) { return sc[k] > 0; }).slice(0, 2).map(function (k) { return THEMES[k].name; });
    if (top.length) lines.push('Strongest themes: ' + top.join(', '));
    return lines.join('\n');
  }
  function postText() {
    return ['I did a values exercise this week. Ten values, cut down to one.', '', 'My top five:'].concat(S.ranked.map(function (v, i) { return (i + 1) + '. ' + v; }))
      .concat(['', 'The one I kept when everything else went: ' + S.ranked[0] + '.', '', 'It is a free exercise from Hugh Duffie, who had it from Mike De Giorgio of Greenhouse Sports. Takes about 20 minutes: ' + CONFIG.site]).join('\n');
  }

  function guidesHtml() {
    var G = [
      { s: 'terminal', p: 'brand', t: 'Proper brand guidelines in Figma, in 30 minutes', d: 'Turn your brand book into a working Figma system, built with code, so every email, ad and deck comes out on brand.', l: CONFIG.links.brand },
      { s: 'brief', p: 'green', t: 'Creative strategy, for founders', d: 'What creative strategy is, why it has become the priority in paid social, and how to brief it.', l: CONFIG.links.creative },
      { s: 'avatarBadge', p: 'blue', t: 'Creator marketing for consumer brands', d: 'Finding, briefing and paying creators, and turning their best content into ads.', l: CONFIG.links.creators }
    ];
    return G.map(function (g) {
      return '<a class="guide" href="' + esc(g.l) + '"><div class="cover">' + dm(g.s, g.p, g.t + ' cover') + '</div><h4>' + esc(g.t) + '</h4><p>' + esc(g.d) + '</p><span class="go">Get the guide &rarr;</span></a>';
    }).join('');
  }

  function renderReport() {
    var sc = themeScores();
    var sorted = THEME_KEYS.slice().sort(function (a, b) { return sc[b] - sc[a]; });
    var max = sc[sorted[0]] || 1;
    var topV = S.ranked[0], topT = themeOf(topV);
    var date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    var def1 = S.defs[topV] ? esc(S.defs[topV]) : 'This is the value you kept when everything else was cut.';
    var strong = sorted.filter(function (k) { return sc[k] > 0; }).slice(0, 2);
    var tens = tensionHtml();
    var qs = ['When did "' + topV + '" last cost you something, and was it worth it?',
      'Who on your team, or which customer, would say you act on "' + topV + '"? What would they point to?',
      'What is one thing you would stop doing this quarter if "' + topV + '" came first?'];
    var html = '';
    if (S.example) html += '<div class="banner"><span><b>Example report.</b> These values are sample answers, not yours.</span><button type="button" class="btn small" data-a="restart">Start your own</button></div>';
    html += '<div class="rep-head"><p class="eyebrow">Your report</p><h2>' + (S.name ? esc(S.name) + '\'s core values' : 'Your core values') + '</h2><p class="meta">' + date + '</p></div>';
    html += '<div class="top-value"><div><p class="eyebrow">Your most important value</p><h3>' + esc(topV) + '</h3><p>' + def1 + '</p>' + (topT ? '<span class="tag">' + esc(THEMES[topT].name) + '</span>' : '') + '</div><div class="big-one" aria-hidden="true">1</div></div>';
    html += '<div><div class="sec-title"><h3>Your top five</h3><p>In the order you kept them.</p></div><ol class="five">' + S.ranked.map(function (v, i) {
      var t = themeOf(v);
      return '<li><div class="n" aria-hidden="true">' + (i + 1) + '</div><div><h4>' + esc(v) + '</h4><p class="tagline">' + (t ? esc(THEMES[t].name) : 'Your own value') + '</p>' + (S.defs[v] ? '<p class="def">' + esc(S.defs[v]) + '</p>' : '') + '</div></li>';
    }).join('') + '</ol><div class="also"><span class="label">Also on your list:</span>' + S.crossed.map(function (v) { return '<span class="pill">' + esc(v) + '</span>'; }).join('') + '</div></div>';

    html += '<div><div class="sec-title"><h3>What your values say</h3><p>Your ten values sit in nine themes. Higher-ranked values count for more. This is a prompt for thinking, not a test result.</p></div><div class="profile"><div class="bars" role="group" aria-label="Values by theme">' +
      sorted.map(function (k, i) { var n = sc[k] > 0 ? Math.max(1, Math.round(sc[k] / max * 12)) : 0; return '<div class="bar"><span>' + esc(THEMES[k].name) + '</span>' + barSvg(n, i === 0 && sc[k] > 0) + '</div>'; }).join('') +
      '</div><div class="themes">' + (strong.length ? strong.map(function (k, i) {
        var t = THEMES[k];
        return '<div class="theme-card"><p class="eyebrow">' + (i === 0 ? 'Strongest theme' : 'Next strongest') + '</p><h4>' + esc(t.name) + '</h4><dl><div><dt>What it tends to mean</dt><dd>' + esc(t.means) + '</dd></div><div><dt>In brand and growth work</dt><dd>' + esc(t.brand) + '</dd></div><div><dt>Watch for</dt><dd>' + esc(t.watch) + '</dd></div></dl></div>';
      }).join('') : '<div class="theme-card"><p>Your own values are not tied to a theme, so there is no theme summary. Add a closest theme when you add a value to see one.</p></div>') + '</div></div></div>';

    if (tens.length) html += '<div><div class="sec-title"><h3>Where your values pull against each other</h3><p>Two things you value can ask for different choices. Naming them early makes the choice easier later.</p></div><div class="tensions">' + tens.join('') + '</div></div>';

    html += '<div><div class="sec-title"><h3>Three questions to take away</h3></div><ol class="questions">' + qs.map(function (q) { return '<li><span>' + esc(q) + '</span></li>'; }).join('') + '</ol></div>';

    html += '<div><div class="sec-title"><h3>Keep it or share it</h3><p>Copy your values as text, or as a LinkedIn post you can edit.</p></div><div class="share">' +
      '<div class="card"><h4>Copy your summary</h4><pre id="sumtxt">' + esc(summaryText(sc, sorted)) + '</pre><div><button type="button" class="btn small" data-a="copy" data-t="sumtxt">Copy summary</button> <button type="button" class="btn small ghost" data-a="copy" data-t="posttxt">Copy as a LinkedIn post</button></div><pre id="posttxt" hidden>' + esc(postText()) + '</pre><p class="status" id="copystatus" role="status"></p></div>' +
      '<form class="card email" id="emailform"><h4>Get this report by email</h4><p>Put your email in and the report arrives in your inbox.</p><div class="field"><label for="em">Email address</label><input id="em" type="email" required autocomplete="email"></div>' +
      '<label class="check"><input type="checkbox" id="consent" required> <span>Yes, send me the report, and occasional emails with marketing and growth resources from Hugh. Unsubscribe at any time.</span></label>' +
      '<div><button type="submit" class="btn primary small">Email me the report</button></div><p class="status" id="emailstatus" role="status"></p></form></div></div>';

    html += '<div class="band"><div class="sec-title"><p class="eyebrow">More free resources</p><h3>Guides from the library</h3><p>Short, practical guides for marketers and founders at consumer brands.</p></div><div class="guides">' + guidesHtml() + '</div><div><a class="btn ghost small" href="' + esc(CONFIG.links.library) + '">See the full guide library</a></div></div>';

    html += '<div class="band"><div class="offer"><div class="sec-title"><p class="eyebrow">Working with Hugh</p><h3>An advisor and coach in your corner</h3><p>Your values show up in every brand decision, written down or not. Hugh advises and coaches a small number of consumer brand founders on growth, alongside a full-time operating role.</p>' +
      '<ul><li>A clear view across Klaviyo, Shopify and Meta of where you are and what to do next.</li><li>Help prioritising your next moves.</li><li>An investor lens: ignore sunk costs, and ask whether the business is investable today and what would need to be true.</li><li>Introductions to suppliers, partners and people.</li><li>Experience across bootstrapped, angel-backed, VC-backed, private equity and large corporate growth investment.</li></ul></div>' +
      '<div class="tiers">' + (CONFIG.showPricing ? CONFIG.pricing.map(function (p) { return '<div class="tier"><b>' + esc(p.name) + '</b><span>' + esc(p.price) + '</span></div>'; }).join('') : '') +
      '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px"><a class="btn" href="' + esc(CONFIG.links.book) + '">Get in touch</a><a class="btn ghost" href="' + esc(CONFIG.links.advisory) + '">About the advisory</a></div></div></div></div>';

    html += '<div class="act-row"><button type="button" class="btn ghost" data-a="restart">Start again</button></div>';
    $('report').innerHTML = html;
    save();
    var form = $('emailform'); if (form) form.addEventListener('submit', onEmail);
  }

  /* ---------- Lead capture ---------- */
  function submitLead(p) {
    if (CONFIG.mode === 'prototype') return Promise.resolve({ sent: false });
    return fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        form: 'values', email: p.email, consent: p.consent, firstName: S.name || '',
        topValue: p.topValue, values: p.values, themes: p.themes, notes: p.notes
      })
    }).then(function (r) { if (!r.ok) throw new Error('Request failed'); return { sent: true }; });
  }
  function leadThemes() {
    try { var out = []; S.ranked.concat(S.crossed).forEach(function (v) { var k = themeOf(v); var n = k && THEMES[k] ? THEMES[k].name : ''; if (n && out.indexOf(n) < 0) out.push(n); }); return out; } catch (e) { return []; }
  }
  function leadNotes() {
    try { return S.ranked.map(function (v) { var d = (S.defs && S.defs[v]) || ''; return d ? v + ': ' + d : ''; }).filter(Boolean).join(' | '); } catch (e) { return ''; }
  }
  function onEmail(e) {
    e.preventDefault();
    var st = $('emailstatus'), email = $('em').value.trim();
    submitLead({ email: email, consent: $('consent').checked, resource: 'values-exercise', topValue: S.ranked[0], values: S.ranked.concat(S.crossed), themes: leadThemes(), notes: leadNotes() }).then(function (r) {
      st.textContent = r.sent ? 'Thanks. Check your inbox.' : 'Prototype only: no email was sent. On the site this form posts to Klaviyo.';
    }, function () { st.textContent = 'Something went wrong. Please try again.'; });
  }

  function copyText(id, btn) {
    var el = $(id), txt = el.textContent, st = $('copystatus');
    function done(ok) { st.textContent = ok ? 'Copied.' : 'Copy did not work here. Select the text and copy it.'; if (!ok) { el.hidden = false; var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } }
    try { navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(false); }); } catch (e) { done(false); }
  }

  /* ---------- Events ---------- */
  function go(stage) {
    S.stage = stage; render();
    if (stage === 'report') $('report').scrollIntoView({ behavior: 'smooth', block: 'start' }); else scrollToStage();
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
    var a = el.getAttribute('data-a'), v = el.getAttribute('data-v');
    switch (a) {
      case 'start': scrollToStage(); break;
      case 'example':
        S = blank(); S.example = true; S.picked = EXAMPLE.picked.slice(); S.crossed = EXAMPLE.crossed.slice(); S.ranked = EXAMPLE.ranked.slice(); S.stage = 'report'; render();
        $('report').scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
      case 'toggle': {
        var i = S.picked.indexOf(v);
        if (i > -1) S.picked.splice(i, 1); else if (S.picked.length < 10) S.picked.push(v);
        updatePick(); break; }
      case 'addCustom': {
        var nm = $('cn').value.trim();
        if (!nm || allValues().some(function (x) { return x.toLowerCase() === nm.toLowerCase(); })) { $('cn').focus(); break; }
        S.custom.push({ name: nm, theme: $('ct').value }); if (S.picked.length < 10) S.picked.push(nm);
        var q = $('q') ? $('q').value : ''; render(); if (q) { $('q').value = q; filter(q); } break; }
      case 'toCut': S.crossed = []; go('cut10'); break;
      case 'backPick': go('pick'); break;
      case 'cross10': {
        var j = S.crossed.indexOf(v);
        if (j > -1) S.crossed.splice(j, 1); else if (S.crossed.length < 5) S.crossed.push(v);
        render(); break; }
      case 'toRounds': S.remaining = S.picked.filter(function (x) { return S.crossed.indexOf(x) < 0; }); S.cutOrder = []; S.cand = null; go('rounds'); break;
      case 'backCut': go('cut10'); break;
      case 'cand': S.cand = v; render(); break;
      case 'cross':
        if (!S.cand) break;
        S.cutOrder.push(S.cand); S.remaining = S.remaining.filter(function (x) { return x !== S.cand; }); S.cand = null;
        if (S.remaining.length === 1) { S.ranked = [S.remaining[0]].concat(S.cutOrder.slice().reverse()); go('sense'); } else render();
        break;
      case 'undo': { var last = S.cutOrder.pop(); if (last) S.remaining.push(last); S.cand = null; render(); break; }
      case 'redo': S.remaining = S.picked.filter(function (x) { return S.crossed.indexOf(x) < 0; }); S.cutOrder = []; S.cand = null; go('rounds'); break;
      case 'up': case 'down': {
        var k = parseInt(el.getAttribute('data-i'), 10), d = a === 'up' ? -1 : 1, t = k + d;
        if (t < 0 || t > 4) break;
        var tmp = S.ranked[k]; S.ranked[k] = S.ranked[t]; S.ranked[t] = tmp; render();
        var nb = document.querySelector('[data-a="' + a + '"][data-i="' + t + '"]'); if (nb && !nb.disabled) nb.focus(); break; }
      case 'toReport': S.example = false; go('report'); break;
      case 'copy': copyText(el.getAttribute('data-t'), el); break;
      case 'restart': S = blank(); try { localStorage.removeItem(KEY); } catch (er) {} render(); window.scrollTo({ top: 0, behavior: 'smooth' }); break;
      default: break;
    }
  });
  function filter(q) {
    q = q.toLowerCase();
    var chips = document.querySelectorAll('#chips .chip');
    for (var i = 0; i < chips.length; i++) chips[i].hidden = q && chips[i].getAttribute('data-v').toLowerCase().indexOf(q) < 0;
  }
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'q') filter(t.value);
    else if (t.hasAttribute && t.hasAttribute('data-def')) { S.defs[t.getAttribute('data-def')] = t.value; save(); }
    else if (t.id === 'nm') { S.name = t.value; save(); }
  });

  /* ---------- Start ---------- */
  /* hero art is a static illustration on the site */
  load();
  if (S.stage === 'rounds' && !S.remaining.length) S.stage = 'cut10';
  render();
})();
