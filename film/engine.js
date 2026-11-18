/* Film engine: every frame is a pure function of time t (seconds), so a renderer can step through frames
   deterministically. Scenes are built from small builders; nothing here uses CSS transitions or timers. */
(function () {
  var W = 1280, H = 720;
  var clamp = function (x, a, b) { return Math.min(b, Math.max(a, x)); };
  var ease = function (p) { return 1 - Math.pow(1 - p, 3); };
  var prog = function (t, t0, d) { return ease(clamp((t - t0) / (d || 0.5), 0, 1)); };

  var stage = document.getElementById('stage');
  var fx = [];   // per-frame functions: fn(t)
  var DUR = 30;

  function el(tag, cls, html, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    (parent || stage).appendChild(e);
    return e;
  }
  /* appear: fade + rise from t0 over d; optional disappearance at tOut */
  function appear(e, t0, d, o) {
    o = o || {};
    var dy = o.dy == null ? 14 : o.dy, dx = o.dx || 0, tOut = o.out;
    e.style.opacity = 0;
    fx.push(function (t) {
      var p = prog(t, t0, d || 0.5), q = tOut == null ? 0 : prog(t, tOut, 0.4);
      e.style.opacity = p * (1 - q);
      e.style.transform = 'translate(' + (dx * (1 - p)) + 'px,' + (dy * (1 - p)) + 'px)' + (o.scale ? ' scale(' + (o.scale + (1 - o.scale) * p) + ')' : '');
    });
    return e;
  }
  function bar(e, t0, d, pct) { fx.push(function (t) { e.style.width = (pct * prog(t, t0, d)) + '%'; }); }
  function count(e, t0, d, from, to, fmt) {
    fx.push(function (t) { var v = from + (to - from) * prog(t, t0, d); e.textContent = fmt ? fmt(v) : Math.round(v).toLocaleString('en-US'); });
  }
  function typeText(e, t0, cps, text) {
    fx.push(function (t) { var n = clamp(Math.floor((t - t0) * cps), 0, text.length); e.textContent = text.slice(0, n); });
  }
  function toggle(e, t0, cls) { fx.push(function (t) { e.classList.toggle(cls, t >= t0); }); }
  function setText(e, pairs) { fx.push(function (t) { var s = pairs[0][1]; pairs.forEach(function (p) { if (t >= p[0]) s = p[1]; }); e.textContent = s; }); }

  var money = function (v) { return '$' + Math.round(v).toLocaleString('en-US'); };

  /* shared chrome: headline, caption, app window */
  function chrome(cfg) {
    el('div', 'grid', '');
    el('div', 'tag', 'ILLUSTRATIVE DATA');
    var head = el('div', 'head', cfg.head);
    appear(head, 0.2, 0.8, { dy: 10 });
    var cap = el('div', 'cap', '');
    fx.push(function (t) {
      var txt = '';
      cfg.caps.forEach(function (c) { if (t >= c[0]) txt = c[1]; });
      cap.textContent = txt;
      var last = cfg.caps.length ? 1 : 0;
      cap.style.opacity = txt ? 1 : 0;
    });
    el('div', 'foot', '<span class="dot"></span>Realify × ROI Minds');
    var prog = el('div', 'progress', '<i></i>');
    var bar = prog.firstChild;
    fx.push(function (t) { bar.style.width = (100 * clamp(t / DUR, 0, 1)) + '%'; });
  }
  function win(title, w, x, y, h) {
    var s = 'width:' + w + 'px;left:' + x + 'px;top:' + y + 'px;' + (h ? 'height:' + h + 'px;' : '');
    var wi = el('div', 'win', '<div class="wt"><span class="rf">Realify</span><span class="wc">' + title + '</span></div><div class="wb"></div>');
    wi.setAttribute('style', s);
    return wi;
  }
  var body = function (w) { return w.querySelector('.wb'); };

  /* ---------------- scenes ---------------- */
  var SCENES = {};

  // A1 — one queue for every brand
  SCENES.A1 = function () {
    DUR = 30;
    chrome({ head: 'One queue for <b>every brand.</b>', caps: [[1, 'Agents work every brand overnight.'], [9, 'Each decision arrives with its reason, forecast and limit.'], [19, 'Your manager approves in a click, or the agent acts inside the limit.']] });
    var w = win('Decisions · all brands', 760, 260, 150, 470);
    appear(w, 0.6, 0.7, { dy: 24 });
    var b = body(w);
    el('div', 'sub', '<span>14 brands</span><span id="qn">0 waiting</span>', b);
    var rows = [
      ['Fashion brand', 'Pause 3 ad groups on products out of stock', 'Marketer', 'ACT'],
      ['Home décor brand', 'Hold the throw-pillow price at its floor', 'Pricer', 'ACT'],
      ['Beauty brand', 'Reorder 1,200 units inside the cash ceiling', 'Planner', 'ACT'],
      ['Jewelry brand', 'File 6 fee claims with evidence attached', 'Controller', 'ACT'],
      ['Supplements brand', 'Move $1,900 a week off non-converting terms', 'Marketer', 'ACT'],
      ['Fashion brand', 'Raise bids on the best-selling size run', 'Marketer', 'ACT']
    ];
    var list = el('div', 'rows', '', b);
    rows.forEach(function (r, i) {
      var row = el('div', 'drow', '<div class="dd"><b>' + r[1] + '</b><span>' + r[0] + ' · ' + r[2] + '</span></div><div class="btns"><em>Reject</em><strong>Approve</strong></div><div class="ok">✓ Approved</div>', list);
      appear(row, 3 + i * 0.9, 0.5, { dx: 18, dy: 0 });
      var ap = row.querySelector('.ok'), btns = row.querySelector('.btns');
      fx.push(function (t) { var done = t >= 17 + i * 1.5; ap.style.opacity = done ? 1 : 0; btns.style.opacity = done ? 0 : 1; row.style.background = done ? 'rgba(79,212,155,.08)' : ''; });
    });
    var qn = b.querySelector('#qn');
    fx.push(function (t) { var n = 0; rows.forEach(function (r, i) { if (t >= 3 + i * 0.9 && t < 17 + i * 1.5) n++; }); qn.textContent = n + ' waiting'; });
    var night = el('div', 'chip night', 'Overnight · 02:10', stage); night.style.cssText = 'left:90px;top:170px';
    appear(night, 1.4, 0.5); fx.push(function (t) { night.style.opacity = t < 1.4 ? 0 : t > 9 ? Math.max(0, 1 - (t - 9)) : 1; });
    var morn = el('div', 'chip morn', 'Morning · manager reviews', stage); morn.style.cssText = 'left:90px;top:170px';
    morn.style.opacity = 0; fx.push(function (t) { morn.style.opacity = clamp((t - 10) / 0.6, 0, 1); });
  };

  // A2 — four signals, one plan
  SCENES.A2 = function () {
    DUR = 30;
    chrome({ head: 'Weighs them <b>together.</b>', caps: [[1.5, 'Four signals arrive for one product.'], [10, 'A price cut, an ad push and low stock cannot all go ahead.'], [20, 'One plan: each signal decided against the others.']] });
    var cards = [
      ['PRICE', '−8%', 'a rival cut its price', 70, 130], ['STOCK', '9 days', 'of cover · next delivery in 24', 780, 130],
      ['ADS', '3 campaigns', 'spending below the margin floor', 70, 330], ['LISTING', '2 images', 'missing from the listing', 780, 330]
    ];
    cards.forEach(function (c, i) {
      var e = el('div', 'sig', '<small>' + c[0] + '</small><b>' + c[1] + '</b><span>' + c[2] + '</span><em class="w">Weighed in the plan</em>');
      e.style.cssText = 'left:' + c[3] + 'px;top:' + c[4] + 'px';
      appear(e, 1.5 + i * 0.7, 0.6, { dx: i % 2 ? 30 : -30, dy: 0 });
      var w = e.querySelector('.w'); fx.push(function (t) { w.style.opacity = clamp((t - (20 + i * 0.8)) / 0.5, 0, 1); });
    });
    var hub = el('div', 'hub', '<i></i><i></i><i></i><b>D</b><small>DIRECTOR</small>');
    appear(hub, 0.8, 0.8, { dy: 0, scale: 0.8 });
    var verdict = el('div', 'verdict', '<b>Plan</b><ul><li>Hold price at the floor</li><li>Pause the 3 campaigns until stock lands</li><li>Fix the 2 images, then restart ads</li></ul>');
    verdict.style.cssText = 'left:430px;top:490px';
    appear(verdict, 21, 0.8, { dy: 14 });
  };

  // A3 — every decision scored
  SCENES.A3 = function () {
    DUR = 28;
    chrome({ head: 'Every decision, <b>scored.</b>', caps: [[1.5, 'Each move is written down with its own forecast.'], [9, 'Thirty days later, the result is set beside it.'], [18, 'Your client sees what each change earned.']] });
    var w = win('Decision record · one brand', 880, 200, 150, 350);
    appear(w, 0.6, 0.6, { dy: 20 });
    var b = body(w);
    el('div', 'sub', '<span>Decision</span><span>Forecast → day 30</span>', b);
    var rows = [['Pause 3 ad groups on out-of-stock products', 4200, 4650], ['Hold price at floor on best seller', 1800, 1650], ['Move $1,900/wk off non-converting terms', 3100, 3560], ['Reorder 1,200 units, shipped by sea', 2600, 2450]];
    rows.forEach(function (r, i) {
      var row = el('div', 'srow', '<div class="sn">' + r[0] + '</div><div class="bars"><div class="bf"><i></i></div><div class="ba"><i></i></div></div><div class="sv"><span class="f">' + money(r[1]) + '</span><span class="a"></span></div>', b);
      appear(row, 2.5 + i * 0.7, 0.5, { dx: 16, dy: 0 });
      var maxv = 5000, bf = row.querySelector('.bf i'), ba = row.querySelector('.ba i'), av = row.querySelector('.a');
      bar(bf, 3.0 + i * 0.7, 0.8, r[1] / maxv * 100);
      bar(ba, 10 + i * 1.2, 1.2, r[2] / maxv * 100);
      var hit = r[2] >= r[1];
      fx.push(function (t) { var p = prog(t, 10 + i * 1.2, 1.2); av.textContent = p > 0.02 ? money(r[2] * p) : ''; av.className = 'a ' + (hit ? 'up' : 'dn'); });
    });
    var sum = el('div', 'summary', '<span>Forecast met or beaten</span><b id="hit">0 of 4</b>', stage);
    sum.style.cssText = 'left:200px;top:540px'; appear(sum, 17, 0.6);
    var hit = sum.querySelector('#hit'); fx.push(function (t) { hit.textContent = (t >= 15 ? 2 : 0) + (t >= 17 ? 1 : 0) + ' of 4'; });
    fx.push(function (t) { hit.textContent = '2 of 4'; });
  };

  // B1 — ads that respect margin and stock
  SCENES.B1 = function () {
    DUR = 32;
    chrome({ head: 'Ads that respect <b>margin and stock.</b>', caps: [[1.5, 'Every campaign is checked against margin, stock and the Buy Box.'], [10, 'Spend on products that cannot earn stops.'], [20, 'The budget moves to products that can.']] });
    var w = win('Campaigns · one brand', 880, 200, 150, 480);
    appear(w, 0.6, 0.6, { dy: 20 });
    var b = body(w);
    el('div', 'sub', '<span>Campaign</span><span>Daily spend · status</span>', b);
    var rows = [['Linen sheets · Sponsored Products', 210, 'ok', 'Earning: margin 34%'], ['Throw pillow · Sponsored Products', 160, 'stock', 'Out of stock: 0 days of cover'], ['Duvet cover · Sponsored Brands', 190, 'floor', 'Below margin floor: 6%'], ['Bath towels · Sponsored Products', 140, 'ok', 'Earning: margin 29%'], ['Candle set · Sponsored Display', 120, 'buybox', 'Lost the Buy Box']];
    rows.forEach(function (r, i) {
      var row = el('div', 'crow', '<div class="cn"><b>' + r[0] + '</b><span class="why">' + r[3] + '</span></div><div class="cb"><i></i></div><div class="cs"><span class="amt">' + money(r[1]) + '</span><em class="st">Running</em></div>', b);
      appear(row, 2.5 + i * 0.6, 0.5, { dx: 16, dy: 0 });
      var why = row.querySelector('.why'), st = row.querySelector('.st'), bi = row.querySelector('.cb i'), amt = row.querySelector('.amt');
      bar(bi, 3 + i * 0.6, 0.8, r[1] / 2.4);
      var bad = r[2] !== 'ok', tChk = 6 + i * 0.4, tFix = 11 + i * 1.3;
      fx.push(function (t) {
        why.style.opacity = t >= tChk ? 1 : 0;
        why.className = 'why ' + (bad ? 'bad' : 'good');
        if (bad && t >= tFix) { st.textContent = 'Paused'; st.className = 'st paused'; bi.parentNode.style.opacity = .35; amt.textContent = '$0'; }
        else if (!bad && t >= 21) { st.textContent = 'Budget raised'; st.className = 'st up'; amt.textContent = money(r[1] + (r[0].indexOf('Linen') === 0 ? 80 : 60)); }
        else { st.textContent = 'Running'; st.className = 'st'; }
      });
    });
    var sum = el('div', 'summary', '<span>Moved this week</span><b id="mv">$0</b>', stage);
    sum.style.cssText = 'left:200px;top:650px'; appear(sum, 22, 0.6);
    count(sum.querySelector('#mv'), 22, 2.5, 0, 3640, money);
  };

  // B2 — true margin per client (ladder)
  SCENES.B2 = function () {
    DUR = 30;
    chrome({ head: 'What the brand <b>actually keeps.</b>', caps: [[1.5, 'Revenue first. Then each cost, in order.'], [11, 'ROAS looks healthy. Contribution margin tells the rest.'], [21, 'Every missing input is named, never guessed.']] });
    var steps = [['Revenue', 100000, 'pos'], ['Cost of goods', -34000, 'neg'], ['Marketplace fees', -15000, 'neg'], ['Fulfilment', -9000, 'neg'], ['Ad spend', -22000, 'neg'], ['Returns', -4000, 'neg'], ['Contribution', 16000, 'tot']];
    var x0 = 150, bw = 120, gap = 24, base = 580, scale = 3.6, run = 0;
    steps.forEach(function (s, i) {
      var h = Math.abs(s[1]) / 100000 * 100 * scale, top;
      if (s[2] === 'pos') { top = base - h; run = s[1]; }
      else if (s[2] === 'neg') { top = base - run / 100000 * 100 * scale; run += s[1]; }
      else { top = base - h; }
      var col = el('div', 'wf ' + s[2], '', stage);
      col.style.cssText = 'left:' + (x0 + i * (bw + gap)) + 'px;width:' + bw + 'px;top:' + top + 'px;height:' + h + 'px';
      var lab = el('div', 'wl', s[0] + '<b>' + (s[2] === 'neg' ? '−' : '') + money(Math.abs(s[1])) + '</b>', stage);
      lab.style.cssText = 'left:' + (x0 + i * (bw + gap)) + 'px;width:' + bw + 'px;top:' + (base + 14) + 'px';
      var t0 = 2 + i * 1.3;
      appear(col, t0, 0.6, { dy: 0 }); appear(lab, t0 + 0.2, 0.5);
      (function (c, hh) { fx.push(function (t) { c.style.transformOrigin = 'bottom'; c.style.transform = 'scaleY(' + prog(t, t0, 0.8) + ')'; if (s[2] === 'neg') c.style.transformOrigin = 'top'; }); })(col, h);
    });
    var pill = el('div', 'verdict wide', '<b>ROAS 4.5×</b><span>Contribution margin 16%</span>', stage);
    pill.style.cssText = 'left:430px;top:150px'; appear(pill, 11, 0.7);
    var gap2 = el('div', 'chip warn', 'Not available yet: payment processing (Shopify)', stage);
    gap2.style.cssText = 'left:430px;top:230px'; appear(gap2, 21, 0.6);
  };

  // B3 — fees recovered
  SCENES.B3 = function () {
    DUR = 30;
    chrome({ head: 'Overcharges found. <b>Claims filed.</b>', caps: [[1.5, 'Every fulfilment fee is checked against the published schedule.'], [10, 'Lines that do not match are marked, with the reason.'], [20, 'Claims go out with the evidence attached.']] });
    var w = win('Settlement lines · one brand', 900, 190, 150, 470);
    appear(w, 0.6, 0.6, { dy: 20 });
    var b = body(w);
    el('div', 'sub', '<span>Order line</span><span>Charged · Schedule</span>', b);
    var lines = [['#4811 · Duvet cover', 4.19, 4.19, 0], ['#4812 · Bath towels', 6.35, 4.98, 1], ['#4813 · Linen sheets', 3.34, 3.34, 0], ['#4814 · Throw pillow', 8.95, 4.98, 1], ['#4815 · Candle set', 4.98, 4.98, 0], ['#4816 · Duvet cover', 14.4, 4.19, 1]];
    lines.forEach(function (l, i) {
      var diff = Math.round((l[1] - l[2]) * 100) / 100;
      var row = el('div', 'frow', '<div class="fn">' + l[0] + '</div><div class="fv">$' + l[1].toFixed(2) + ' <span>vs $' + l[2].toFixed(2) + '</span></div><div class="ff">' + (l[3] ? '+$' + diff.toFixed(2) + ' over' : 'Matches') + '</div><div class="fc">Claim filed</div>', b);
      appear(row, 2.5 + i * 0.7, 0.5, { dx: 16, dy: 0 });
      var ff = row.querySelector('.ff'), fc = row.querySelector('.fc');
      fx.push(function (t) { var show = t >= 8 + i * 0.5; ff.style.opacity = show ? 1 : 0; ff.className = 'ff ' + (l[3] ? 'bad' : 'good'); row.style.background = (show && l[3]) ? 'rgba(243,197,101,.07)' : ''; fc.style.opacity = (l[3] && t >= 18 + i * 0.6) ? 1 : 0; });
    });
    var sum = el('div', 'summary', '<span>Claimable on these lines</span><b id="rc">$0</b>', stage);
    sum.style.cssText = 'left:190px;top:650px'; appear(sum, 18, 0.6);
    var over = 0; lines.forEach(function (l) { over += l[1] - l[2]; });
    count(sum.querySelector('#rc'), 18, 3, 0, over, function (v) { return '$' + v.toFixed(2); });
  };

  // B4 — price inside your floors
  SCENES.B4 = function () {
    DUR = 28;
    chrome({ head: 'Price, <b>inside your floors.</b>', caps: [[1.5, 'A rival cuts its price.'], [9, 'Hold, meet halfway, or match, decided on margin and stock.'], [18, 'The floor is never crossed.']] });
    var chart = el('div', 'pchart', '', stage);
    appear(chart, 0.6, 0.6);
    // price lines
    var pts = [], n = 28;
    for (var i = 0; i < n; i++) pts.push(i);
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', '0 0 900 360'); svg.setAttribute('width', 900); svg.setAttribute('height', 360);
    chart.appendChild(svg);
    function path(color, w, dash) { var p = document.createElementNS(svgNS, 'path'); p.setAttribute('fill', 'none'); p.setAttribute('stroke', color); p.setAttribute('stroke-width', w); if (dash) p.setAttribute('stroke-dasharray', dash); svg.appendChild(p); return p; }
    var y = function (v) { return 360 - (v - 20) / 30 * 330 - 10; }; // 20..50
    var floor = path('#FF8B8B', 2, '8 6'); floor.setAttribute('d', 'M0 ' + y(32) + ' L900 ' + y(32));
    var own = path('#7C9BFF', 4), rival = path('#8C96B3', 3);
    var ownV = function (i) { return i < 9 ? 44 : i < 12 ? 44 - (i - 9) * 1.3 : i < 20 ? 40 : 40; };
    var rivV = function (i) { return i < 8 ? 43 : i < 11 ? 43 - (i - 8) * 4.4 : 29.8; };
    fx.push(function (t) {
      var k = clamp(t * 1.6 - 1, 0, n - 1), d1 = '', d2 = '';
      for (var i = 0; i <= Math.floor(k); i++) { var x = i / (n - 1) * 900; d1 += (i ? 'L' : 'M') + x + ' ' + y(ownV(i)) + ' '; d2 += (i ? 'L' : 'M') + x + ' ' + y(rivV(i)) + ' '; }
      own.setAttribute('d', d1); rival.setAttribute('d', d2);
    });
    var l1 = el('div', 'plab r', 'Rival price <b>$29.80</b>', chart); l1.style.cssText = 'right:0;top:160px'; appear(l1, 9, 0.5);
    var l2 = el('div', 'plab o', 'Your price <b>$40.00</b>', chart); l2.style.cssText = 'right:0;top:66px'; appear(l2, 12, 0.5);
    var l3 = el('div', 'plab f', 'Margin floor <b>$32.00</b>', chart); l3.style.cssText = 'left:0;top:270px'; appear(l3, 1.2, 0.5);
    var dec = el('div', 'verdict wide', '<b>Decision</b><span>Meet halfway at $36.50. Stock cover is 41 days, so matching would only give margin away.</span>', stage);
    dec.style.cssText = 'left:190px;top:600px;width:900px'; appear(dec, 19, 0.7);
    var dot = el('div', 'dotmark', '', chart); fx.push(function (t) { var p = prog(t, 19, 0.6); dot.style.opacity = p; dot.style.top = (y(36.5) - 7) + 'px'; });
  };

  // C1 — chosen by AI shoppers
  SCENES.C1 = function () {
    DUR = 32;
    chrome({ head: 'Chosen by <b>AI shoppers.</b>', caps: [[1.5, 'An AI shopping assistant reads the listing the way a shopper asks.'], [11, 'Gaps it cannot read are listed, ranked by what they cost.'], [21, 'Share of answer is tracked, platform by platform.']] });
    var q = el('div', 'ask', '<small>Shopper asks</small><b id="q"></b>', stage); q.style.cssText = 'left:80px;top:150px;width:520px';
    appear(q, 1, 0.5); typeText(q.querySelector('#q'), 1.5, 22, 'Best linen sheets for hot sleepers under $150');
    var gaps = [['No material or thread count in the title', 'High'], ['Care instructions missing from the bullets', 'Medium'], ['No size chart in the description', 'High'], ['Images carry no alt text', 'Medium']];
    var gl = el('div', 'gaps', '<small>What the assistant cannot read</small>', stage); gl.style.cssText = 'left:80px;top:290px;width:520px';
    gaps.forEach(function (g, i) { var r = el('div', 'gap', '<span>' + g[0] + '</span><em class="' + g[1].toLowerCase() + '">' + g[1] + '</em>', gl); appear(r, 11 + i * 0.9, 0.5, { dx: -14, dy: 0 }); });
    var ps = [['ChatGPT', 18], ['Gemini', 11], ['AI Overviews', 24], ['AI Mode', 9]];
    var card = el('div', 'sov', '<small>Share of answer · this brand</small>', stage); card.style.cssText = 'left:680px;top:150px;width:520px;height:480px';
    appear(card, 20.5, 0.6);
    ps.forEach(function (p, i) {
      var r = el('div', 'sovr', '<div class="pn">' + p[0] + '</div><div class="pb"><i></i></div><div class="pv"></div>', card);
      var bi = r.querySelector('.pb i'), pv = r.querySelector('.pv');
      bar(bi, 21.5 + i * 0.6, 1.4, p[1] * 3.4);
      fx.push(function (t) { pv.textContent = Math.round(p[1] * prog(t, 21.5 + i * 0.6, 1.4)) + '%'; });
    });
    var note = el('div', 'chip', 'Read next to your AI search reporting', card); note.style.cssText = 'position:absolute;left:24px;bottom:22px'; appear(note, 25, 0.6);
  };

  // C2 — weekly note per client
  SCENES.C2 = function () {
    DUR = 28;
    chrome({ head: 'A weekly note, <b>per client.</b>', caps: [[1.5, 'Drawn from the decision record, not written from memory.'], [10, 'Your account manager reviews it first.'], [18, 'The brand owner reads what changed and what it earned.']] });
    var doc = el('div', 'doc', '', stage); doc.style.cssText = 'left:300px;top:140px;width:680px;height:520px';
    appear(doc, 0.7, 0.7, { dy: 24 });
    el('div', 'dh', '<small>Week of 10 Nov · Home décor brand</small><b>This week for your brand</b>', doc);
    var items = [['Paused', '3 ad groups on products that were out of stock', '+$4,650 vs forecast $4,200'], ['Held', 'throw-pillow price at its floor after a rival cut', '−$150 vs forecast; margin kept'], ['Moved', '$1,900 a week off terms that did not convert', '+$3,560 vs forecast $3,100']];
    items.forEach(function (it, i) { var r = el('div', 'ditem', '<b>' + it[0] + '</b><div><p>' + it[1] + '</p><span>' + it[2] + '</span></div>', doc); appear(r, 3 + i * 2, 0.6); });
    var tot = el('div', 'dtotal', '<span>Earned so far from this week\'s changes</span><b id="dt">$0</b>', doc); appear(tot, 10, 0.6);
    count(tot.querySelector('#dt'), 10.5, 2.5, 0, 8060, money);
    var rev = el('div', 'review', '✓ Reviewed by your account manager', doc); appear(rev, 13, 0.6);
    var send = el('div', 'verdict wide', '<b>Sent to the brand owner</b><span>Monday 08:00</span>', stage); send.style.cssText = 'left:300px;top:600px;width:680px;display:none';
    fx.push(function (t) { send.style.display = t >= 18 ? 'block' : 'none'; send.style.opacity = prog(t, 18, 0.6); });
    var shade = doc; fx.push(function (t) { doc.style.boxShadow = t >= 18 ? '0 30px 60px rgba(0,0,0,.4)' : ''; });
    doc.style.height = '440px';
  };

  // D1 — prospect audit in 24 hours
  SCENES.D1 = function () {
    DUR = 32;
    chrome({ head: 'Prospect audit in <b>24 hours.</b>', caps: [[1.5, 'A prospect sends the reports they already have.'], [9, 'Margin, fees, ad waste and stock are read in one pass.'], [20, 'The next day: one document, with a clear read.']] });
    var files = ['Settlement report', 'Business report', 'Ads report', 'Inventory file'];
    var fl = el('div', 'files', '<small>Reports in</small>', stage); fl.style.cssText = 'left:90px;top:170px;width:300px';
    files.forEach(function (f, i) { var r = el('div', 'file', '<i></i>' + f, fl); appear(r, 2 + i * 0.8, 0.5, { dx: -20, dy: 0 }); });
    var clock = el('div', 'clock', '<small>Elapsed</small><b id="ck">0:00</b><span>since the reports arrived</span>', stage); clock.style.cssText = 'left:90px;top:440px;width:300px';
    appear(clock, 6, 0.5);
    fx.push(function (t) { var hh = clamp((t - 6) / 14, 0, 1) * 24; clock.querySelector('#ck').textContent = Math.floor(hh) + ' h ' + String(Math.floor((hh % 1) * 60)).padStart(2, '0') + ' m'; });
    var findings = [['Margin', 'Contribution after fees and ads, by channel'], ['Fees', 'Overcharges found against the schedule'], ['Ads', 'Spend on products that cannot earn'], ['Stock', 'Cover against lead times, cash tied up']];
    var out = el('div', 'audit', '<div class="ah"><small>Audit · prospect brand</small><b>What we found</b></div>', stage); out.style.cssText = 'left:470px;top:150px;width:730px;height:480px';
    appear(out, 20, 0.7, { dy: 24 });
    findings.forEach(function (f, i) { var r = el('div', 'af', '<b>' + f[0] + '</b><span>' + f[1] + '</span>', out); appear(r, 21.5 + i * 1.1, 0.5); });
    var read = el('div', 'verdict wide', '<b>Our read</b><span>Where to start, what to fix first, and what each fix is worth.</span>', out);
    read.style.cssText = 'position:absolute;left:24px;right:24px;bottom:24px'; appear(read, 27, 0.7);
  };

  // D2 — one P&L across channels
  SCENES.D2 = function () {
    DUR = 30;
    chrome({ head: 'One P&amp;L <b>across channels.</b>', caps: [[1.5, 'Three exports. Three different layouts.'], [9, 'The same cost and fee rules apply to each.'], [19, 'One margin view, with every difference explained.']] });
    var chs = [['Amazon', 'Settlement V2', 100, 3.2, 42000, 21], ['Shopify', 'Orders export', 190, 18, 31000, 27], ['Walmart', 'Payment statement', 280, 10, 17000, 18]];
    chs.forEach(function (c, i) {
      var e = el('div', 'chan', '<small>' + c[1] + '</small><b>' + c[0] + '</b>', stage); e.style.cssText = 'left:90px;top:' + (170 + i * 140) + 'px;width:260px';
      appear(e, 1.5 + i * 0.7, 0.5, { dx: -20, dy: 0 });
    });
    var merge = el('div', 'mergebar', '<i></i><i></i><i></i>', stage); merge.style.cssText = 'left:360px;top:200px;width:80px;height:380px'; appear(merge, 9, 0.8);
    var pl = el('div', 'pl', '<div class="ph"><small>Margin view · all channels</small><b>One P&amp;L</b></div>', stage); pl.style.cssText = 'left:470px;top:150px;width:730px;height:470px';
    appear(pl, 11, 0.7, { dy: 20 });
    var rows = [['', 'Revenue', 'Margin'], ['Amazon', '$420,000', '21%'], ['Shopify', '$310,000', '27%'], ['Walmart', '$170,000', '18%'], ['All channels', '$900,000', '23%']];
    rows.forEach(function (r, i) { var d = el('div', 'plr' + (i === 0 ? ' h' : '') + (i === 4 ? ' t' : ''), '<span>' + r[0] + '</span><span>' + r[1] + '</span><span>' + r[2] + '</span>', pl); appear(d, 12.5 + i * 0.8, 0.5); });
    var diff = el('div', 'chip warn', 'Walmart margin sits lower: its fee statement carries a 3PL charge the others do not', pl); diff.style.cssText = 'position:absolute;left:24px;right:24px;bottom:24px;border-radius:10px;white-space:normal'; appear(diff, 19.5, 0.7);
  };

  /* ---------------- driver ---------------- */
  var params = new URLSearchParams(location.search);
  var id = params.get('id') || 'A1';
  SCENES[id]();
  window.__DUR = DUR;
  window.__render = function (t) { for (var i = 0; i < fx.length; i++) fx[i](t); };
  window.__render(0);
  if (params.get('t') != null) window.__render(+params.get('t'));
  if (params.get('live') === '1') {
    var t0 = performance.now();
    (function loop() { var t = (performance.now() - t0) / 1000; window.__render(t); if (t < DUR) requestAnimationFrame(loop); })();
  }
})();
