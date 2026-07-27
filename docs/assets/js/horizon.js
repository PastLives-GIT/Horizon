(function () {
  'use strict';

  // ===================================================================
  // requestAnimationFrame polyfill
  // ===================================================================
  window.requestAnimationFrame = (function () {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (cb) { window.setTimeout(cb, 1000 / 60); };
  })();

  // ===================================================================
  // CSS vendor prefix detection
  // ===================================================================
  var _vendorPrefix = (function () {
    var vendors = ['webkit', 'Moz', 'ms'];
    var style = document.body.style;
    for (var i = 0; i < vendors.length; i++) {
      if (style.hasOwnProperty(vendors[i] + 'Transform')) return vendors[i];
    }
    return '';
  })();
  var _transformKey = _vendorPrefix ? _vendorPrefix + 'Transform' : 'transform';
  var _transformOriginKey = _vendorPrefix ? _vendorPrefix + 'TransformOrigin' : 'transformOrigin';
  var _supports3d = (function () {
    var s = document.createElement('div').style;
    var v = ['webkit', 'Moz', 'ms', ''];
    for (var i = 0; i < v.length; i++) {
      if ((v[i] ? v[i] + 'Perspective' : 'perspective') in s) return true;
    }
    return false;
  })();

  // ===================================================================
  // Point — a grid intersection that moves with mouse repulsion
  // ===================================================================
  function Point(ox, oy, maxDist) {
    this.ox = this.x = ox || 0;
    this.oy = this.y = oy || 0;
    this.maxDist = maxDist || 60;
  }

  Point.prototype.update = function (mouse, range, offsetX, offsetY) {
    var dx, dy, dist, f;
    if (mouse) {
      dx = mouse.x - this.x - offsetX;
      dy = mouse.y - this.y - offsetY;
      dist = Math.sqrt(dx * dx + dy * dy) + 0.00001;
      f = range / dist;
      this.x += (this.ox - this.x) * 0.1 - (dx / dist) * f;
      this.y += (this.oy - this.y) * 0.1 - (dy / dist) * f;
    } else {
      // Spring back to origin when mouse is away
      this.x += (this.ox - this.x) * 0.1;
      this.y += (this.oy - this.y) * 0.1;
    }
    // Clamp to max distance from origin
    dx = this.x - this.ox;
    dy = this.y - this.oy;
    dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > this.maxDist) {
      this.x = this.ox + (dx / dist) * this.maxDist;
      this.y = this.oy + (dy / dist) * this.maxDist;
    }
  };

  // ===================================================================
  // WallCard — one card in the wall, defined by 4 corner Points
  // Calculates and applies CSS matrix3d from its 4 corners
  // ===================================================================

  // Matrix helpers (from PerspectiveTransform.js)
  function _det2(p0, p1, p2) {
    return p0.x * p1.y + p1.x * p2.y + p2.x * p0.y - p0.y * p1.x - p1.y * p2.x - p2.y * p0.x;
  }

  function _computeMatrix3d(tl, tr, bl, br, elementWidth, elementHeight, originOffsetX, originOffsetY) {
    var det1 = _det2(tl, tr, br);
    var det2 = _det2(br, bl, tl);
    if (det1 <= 0 || det2 <= 0) return null;

    var aM = [
      [0,0,1,0,0,0,0,0], [0,0,1,0,0,0,0,0],
      [0,0,1,0,0,0,0,0], [0,0,1,0,0,0,0,0],
      [0,0,0,0,0,1,0,0], [0,0,0,0,0,1,0,0],
      [0,0,0,0,0,1,0,0], [0,0,0,0,0,1,0,0]
    ];
    var bM = [0,0,0,0,0,0,0,0];
    var width = elementWidth;
    var height = elementHeight;
    var offsetX = originOffsetX || 0;
    var offsetY = originOffsetY || 0;
    var dst = [tl, tr, bl, br];
    var sx, sy, dx, dy;
    var i, j, k, p, tmp;
    var row, col = [];
    var m = [0,1,2,3,4,5,6,7];
    var kmax, sum;

    for (i = 0; i < 4; i++) {
      j = i + 4;
      sx = i & 1 ? width + offsetX : offsetX;
      sy = i > 1 ? height + offsetY : offsetY;
      dx = dst[i].x + offsetX;
      dy = dst[i].y + offsetY;
      aM[i][0] = aM[j][3] = sx;
      aM[i][1] = aM[j][4] = sy;
      aM[i][2] = aM[j][5] = 1;
      aM[i][3] = aM[i][4] = aM[i][5] = aM[j][0] = aM[j][1] = aM[j][2] = 0;
      aM[i][6] = -sx * dx;
      aM[i][7] = -sy * dx;
      aM[j][6] = -sx * dy;
      aM[j][7] = -sy * dy;
      bM[i] = dx;
      bM[j] = dy;
    }

    for (j = 0; j < 8; j++) {
      for (i = 0; i < 8; i++) col[i] = aM[i][j];
      for (i = 0; i < 8; i++) {
        row = aM[i];
        kmax = i < j ? i : j;
        sum = 0;
        for (k = 0; k < kmax; k++) sum += row[k] * col[k];
        row[j] = col[i] -= sum;
      }
      p = j;
      for (i = j + 1; i < 8; i++) {
        if (Math.abs(col[i]) > Math.abs(col[p])) p = i;
      }
      if (p !== j) {
        for (k = 0; k < 8; k++) {
          tmp = aM[p][k]; aM[p][k] = aM[j][k]; aM[j][k] = tmp;
        }
        tmp = m[p]; m[p] = m[j]; m[j] = tmp;
      }
      if (aM[j][j] !== 0) {
        for (i = j + 1; i < 8; i++) aM[i][j] /= aM[j][j];
      }
    }
    for (i = 0; i < 8; i++) m[i] = bM[m[i]];
    for (k = 0; k < 8; k++) {
      for (i = k + 1; i < 8; i++) m[i] -= m[k] * aM[i][k];
    }
    for (k = 7; k > -1; k--) {
      m[k] /= aM[k][k];
      for (i = 0; i < k; i++) m[i] -= m[k] * aM[i][k];
    }
    for (i = 0; i < 8; i++) m[i] = m[i].toFixed(9);

    return 'matrix3d(' + m[0] + ',' + m[3] + ',0,' + m[6] + ',' +
                        m[1] + ',' + m[4] + ',0,' + m[7] + ',0,0,1,0,' +
                        m[2] + ',' + m[5] + ',0,1)';
  }

  // ===================================================================
  // HorizonWall — the 3D perspective card wall
  // ===================================================================
  function HorizonWall(container, frameWidth, frameHeight, cols, rows, elementScale) {
    var self = this;
    this.container = container;
    this.points = [];
    this.cards = [];
    this._cols = cols;
    this._rows = rows;
    this.range = frameWidth * 15;
    this._scale = elementScale || 2;

    var points = this.points;
    var cards = this.cards;
    var pcol = cols + 1;
    var prow = rows + 1;
    var maxDist = Math.sqrt(frameWidth * frameWidth + frameHeight * frameHeight) * 0.75;
    var realW = frameWidth * this._scale;
    var realH = frameHeight * this._scale;
    var i, j, x, y, ystep, p, m, a;

    // Create Points grid
    for (i = 0; i < pcol * prow; i++) {
      m = frameWidth * Math.random() * 0.1;
      a = Math.PI * 2 * Math.random();
      p = new Point(
        frameWidth * (i % pcol) + m * Math.cos(a),
        frameHeight * Math.floor(i / pcol) + m * Math.sin(a),
        maxDist
      );
      points.push(p);
    }

    // Create WallCards
    for (y = 0; y < rows; y++) {
      ystep = y * pcol;
      for (x = 0; x < cols; x++) {
        j = x + ystep;
        var card = new WallCardWrapper(realW, realH, points[j], points[j + 1], points[j + pcol], points[j + pcol + 1]);
        container.appendChild(card.element);
        cards.push(card);
      }
    }

    // Mouse tracking
    this._mouse = { x: 0, y: 0, active: false };
    this._scrollX = 0;
    this._scrollY = 0;

    function onScroll() {
      self._scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
      self._scrollY = document.documentElement.scrollTop || document.body.scrollTop;
    }
    function onMouseMove(e) {
      self._mouse.x = e.clientX + self._scrollX;
      self._mouse.y = e.clientY + self._scrollY;
      self._mouse.active = true;
    }
    function onMouseLeave() {
      self._mouse.active = false;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    container.addEventListener('mousemove', onMouseMove, { passive: true });
    container.addEventListener('mouseleave', onMouseLeave);

    // Start animation loop
    this._running = true;
    this._animLoop();
  }

  HorizonWall.prototype._animLoop = function () {
    if (!this._running) return;
    var i, len;
    var mouse = this._mouse.active ? this._mouse : null;
    var left = this.container.getBoundingClientRect().left + (this._scrollX || document.documentElement.scrollLeft || document.body.scrollLeft);
    var top = this.container.getBoundingClientRect().top + (this._scrollY || document.documentElement.scrollTop || document.body.scrollTop);

    for (i = 0, len = this.points.length; i < len; i++) {
      this.points[i].update(mouse, this.range, left, top);
    }
    for (i = 0, len = this.cards.length; i < len; i++) {
      this.cards[i].update();
    }
    var self = this;
    requestAnimationFrame(function () { self._animLoop(); });
  };

  HorizonWall.prototype.destroy = function () {
    this._running = false;
  };

  HorizonWall.prototype.setContent = function (index, html) {
    if (index >= 0 && index < this.cards.length) {
      this.cards[index].setContent(html);
    }
  };

  HorizonWall.prototype.setExplodeOrigin = function (cx, cy) {
    for (var i = 0; i < this.points.length; i++) {
      var p = this.points[i];
      p.x = cx - this.container.getBoundingClientRect().left;
      p.y = cy - this.container.getBoundingClientRect().top;
    }
  };

  // ===================================================================
  // WallCardWrapper — wraps a DOM element with 4 corner Points
  // ===================================================================
  function WallCardWrapper(elementWidth, elementHeight, tl, tr, bl, br) {
    this.tl = tl;
    this.tr = tr;
    this.bl = bl;
    this.br = br;
    this.element = document.createElement('div');
    this.element.className = 'wall-card';
    this.element.style.width = Math.floor(elementWidth) + 'px';
    this.element.style.height = Math.floor(elementHeight) + 'px';
    this._computedStyle = window.getComputedStyle(this.element);
    this._width = elementWidth;
    this._height = elementHeight;
  }

  WallCardWrapper.prototype.setContent = function (html) {
    this.element.innerHTML = html;
    // Re-read computed style after content is set (origin may have changed)
    this._computedStyle = window.getComputedStyle(this.element);
  };

  WallCardWrapper.prototype.update = function () {
    var originStr = this._computedStyle[_transformOriginKey];
    var ox = 0, oy = 0;

    if (originStr && originStr.indexOf('px') > -1) {
      var parts = originStr.split('px');
      ox = -parseFloat(parts[0]) || 0;
      oy = -parseFloat(parts[1]) || 0;
    } else if (originStr && originStr.indexOf('%') > -1) {
      var pcts = originStr.split('%');
      ox = -parseFloat(pcts[0]) * this._width * 0.01;
      oy = -parseFloat(pcts[1]) * this._height * 0.01;
    }

    var m3d = _computeMatrix3d(this.tl, this.tr, this.bl, this.br, this._width, this._height, ox, oy);
    if (m3d) {
      this.element.style[_transformKey] = m3d;
    }
  };

  // ===================================================================
  // App State
  // ===================================================================
  var manifest = null;
  var wall = null;
  var wallContainer = null;
  var currentTag = '';
  var currentLang = '';

  // Layout config
  var CARD_W = 220;
  var CARD_H = 180;
  var CARD_GAP = 16;
  var CARD_SCALE = 2; // actual pixels = display × scale (for retina-style crispness)

  function calcGrid() {
    var w = window.innerWidth;
    var cols;
    if (w < 600) cols = 2;
    else if (w < 1024) cols = 3;
    else cols = 4;
    return cols;
  }

  // ===================================================================
  // Loading
  // ===================================================================
  function showLoading() {
    var c = document.getElementById('loading-container');
    if (c) c.classList.remove('hidden');
  }

  function hideLoading() {
    var c = document.getElementById('loading-container');
    if (!c) return;
    c.classList.add('hidden');
    setTimeout(function () { c.style.display = 'none'; }, 350);
  }

  function setLoadingProgress(pct, text) {
    var bar = document.querySelector('#loading .bar');
    var per = document.querySelector('#loading .per');
    if (bar) bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    if (per) per.textContent = text || (Math.floor(pct) + '%');
  }

  // ===================================================================
  // Stats
  // ===================================================================
  function renderStats(stats) {
    if (!stats) return;
    var items = (manifest && manifest.items) ? manifest.items : [];
    document.getElementById('stat-posts').textContent = stats.total_posts || 0;
    document.getElementById('stat-articles').textContent = items.length;
    document.getElementById('stat-langs').textContent = (stats.languages || []).join('/') || '—';
    var updated = manifest.updated_at || '';
    if (updated) {
      var d = new Date(updated);
      document.getElementById('stat-updated').textContent = (d.getMonth() + 1) + '/' + d.getDate();
    }
  }

  // ===================================================================
  // Filters
  // ===================================================================
  function setupFilters(allTags) {
    var bar = document.getElementById('filter-bar');
    if (!bar) return;
    var existing = bar.querySelectorAll('.tag-filter');
    existing.forEach(function (btn) { if (btn.dataset.tag !== '') btn.remove(); });

    allTags.slice(0, 12).forEach(function (tag) {
      var btn = document.createElement('button');
      btn.className = 'tag-filter';
      btn.dataset.tag = tag;
      btn.textContent = '#' + tag;
      btn.addEventListener('click', function () { filterByTag(tag); });
      bar.appendChild(btn);
    });
  }

  function filterByTag(tag) {
    currentTag = (currentTag === tag) ? '' : tag;
    document.querySelectorAll('.tag-filter').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tag === currentTag);
    });
    buildWall();
  }

  // ===================================================================
  // Language
  // ===================================================================
  function setupLangToggle() {
    var el = document.querySelector('.lang-toggle');
    if (!el) return;
    el.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      currentLang = btn.dataset.lang;
      el.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('active', b.dataset.lang === currentLang);
      });
      buildWall();
    });
  }

  // ===================================================================
  // Filter items
  // ===================================================================
  function getFilteredItems() {
    var items = (manifest && manifest.items) ? manifest.items.slice() : [];
    if (currentTag) {
      items = items.filter(function (it) {
        return it.tags && it.tags.indexOf(currentTag) !== -1;
      });
    }
    return items;
  }

  // ===================================================================
  // Card HTML
  // ===================================================================
  function createCardHTML(item) {
    var score = item.score || 0;
    var tier = score >= 9 ? 'high' : score >= 7 ? 'good' : score >= 5 ? 'mid' : 'low';
    var title = escapeHtml((item.title || '').length > 72 ? item.title.slice(0, 70) + '...' : item.title);

    var tagsHtml = '';
    if (item.tags) {
      tagsHtml = item.tags.slice(0, 3).map(function (t) {
        return '<span class="tag-dot">#' + escapeHtml(t) + '</span>';
      }).join('');
    }

    var sourceLabel = escapeHtml(item.source_type || 'unknown');
    var summary = escapeHtml((item.summary || '').length > 100 ? item.summary.slice(0, 98) + '...' : item.summary || '');

    // OG image background or gradient fallback is handled by CSS :nth-child
    var ogStyle = '';
    if (item.og_image) {
      ogStyle = ' style="background-image:url(' + escapeHtml(item.og_image) + ');background-size:cover;background-position:center"';
    }

    return '<a href="' + (item.url || '#') + '" target="_blank" rel="noopener">' +
      '<div class="wall-card-visual"' + ogStyle + '>' +
        '<span class="wall-card-score">' +
          '<span class="score-badge" data-tier="' + tier + '">' + score + '</span>' +
        '</span>' +
        '<span class="wall-card-title">' + title + '</span>' +
        '<span class="wall-card-meta">' + sourceLabel + '</span>' +
      '</div>' +
      '<div class="wall-card-info">' +
        '<p class="wall-card-info-title">' + title + '</p>' +
        '<p class="wall-card-info-summary">' + summary + '</p>' +
        '<p class="wall-card-info-meta">' + tagsHtml + '</p>' +
      '</div>' +
    '</a>';
  }

  // ===================================================================
  // Build / Rebuild Wall
  // ===================================================================
  function buildWall() {
    wallContainer = document.getElementById('wall');
    if (!wallContainer) return;

    // Stop previous wall animation
    if (wall) { wall.destroy(); wall = null; }
    wallContainer.innerHTML = '';
    wallContainer.classList.remove('loaded');

    var items = getFilteredItems();
    if (!items.length) {
      wallContainer.innerHTML = '<div class="empty-state"><p>No articles match this filter.</p></div>';
      wallContainer.classList.add('loaded');
      wallContainer.style.height = '120px';
      return;
    }

    var cols = calcGrid();
    var rows = Math.ceil(items.length / cols);
    var totalCells = cols * rows;

    // Pad items to fill grid
    while (items.length < totalCells) {
      items.push(null); // placeholder for empty cells
    }

    wall = new HorizonWall(wallContainer, CARD_W, CARD_H, cols, rows, CARD_SCALE);

    // Fill cards with content
    for (var i = 0; i < items.length; i++) {
      if (items[i]) {
        wall.setContent(i, createCardHTML(items[i]));
      } else {
        // Empty cell: invisible placeholder
        wall.cards[i].element.classList.add('wall-card-placeholder');
      }
    }

    // Set container size
    var containerW = cols * CARD_W;
    var containerH = rows * CARD_H;
    wallContainer.style.width = containerW + 'px';
    wallContainer.style.height = containerH + 'px';

    // Entry animation: explode from center
    var cx = window.innerWidth * 0.5;
    var cy = window.innerHeight * 0.5;
    wall.setExplodeOrigin(cx, cy);

    // Reveal
    setTimeout(function () {
      wallContainer.classList.add('loaded');
    }, 150);

    // Update today's brief
    updateTodaysBrief(items.filter(Boolean));
  }

  function updateTodaysBrief(items) {
    var el = document.getElementById('todays-brief');
    if (!el) return;
    var count = items.length;
    var sources = {};
    var maxScore = 0;
    items.forEach(function (it) {
      if (it.source_type) sources[it.source_type] = true;
      if (it.score > maxScore) maxScore = it.score;
    });
    var sourceList = Object.keys(sources).slice(0, 3).join(', ');
    var now = new Date();
    var dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
    el.innerHTML = '📅 ' + dateStr + ' · ' + count + ' articles' +
      (sourceList ? ' · Sources: ' + sourceList : '') +
      (maxScore > 0 ? ' · Top score ' + maxScore + ' 🔥' : '');
  }

  // ===================================================================
  // Article page helpers (for post detail pages)
  // ===================================================================
  function processScoreBadges() {
    var scoreRe = /⭐️\s*(\d+(?:\.\d+)?)\/10/;
    var targets = document.querySelectorAll('.hz-post h2, .hz-post li, .post-toc li');
    targets.forEach(function (el) {
      var m = el.innerHTML.match(scoreRe);
      if (!m) return;
      var score = parseFloat(m[1]);
      var tier = score >= 9 ? 'high' : score >= 7 ? 'good' : score >= 5 ? 'mid' : 'low';
      el.innerHTML = el.innerHTML.replace(scoreRe,
        '<span class="score-badge" data-tier="' + tier + '">' + m[1] + '</span>');
    });
  }

  function markSemanticElements() {
    var paragraphs = document.querySelectorAll('.hz-post p');
    paragraphs.forEach(function (p) {
      var text = p.textContent.trim();
      if (/^(Tags|标签)\s*:/.test(text)) p.classList.add('tag-line');
      if (/^(rss|reddit|github|hackernews|hn|telegram|ossinsight|gdelt|openbb|google.news)\s*·/i.test(text)) {
        p.classList.add('source-line');
      }
    });
  }

  function setupArticleLangToggle() {
    if (document.querySelector('.hz-post')) {
      var langBtn = document.querySelector('.hz-nav-lang');
      if (!langBtn) return;
      langBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var path = window.location.pathname;
        var target = null;
        if (/-en(?:\.html)?$/.test(path)) target = path.replace(/-en(\.html)?$/, '-zh$1');
        else if (/-zh(?:\.html)?$/.test(path)) target = path.replace(/-zh(\.html)?$/, '-en$1');
        if (target) window.location.href = target;
      });
    }
  }

  // ===================================================================
  // Utilities
  // ===================================================================
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ===================================================================
  // Init
  // ===================================================================
  function init() {
    wallContainer = document.getElementById('wall');

    // Article page mode
    if (!wallContainer) {
      processScoreBadges();
      markSemanticElements();
      setupArticleLangToggle();
      return;
    }

    // Homepage mode
    if (!_supports3d) {
      document.getElementById('not-supported').style.display = 'block';
      document.getElementById('loading-container').classList.add('hidden');
      return;
    }

    showLoading();
    setLoadingProgress(5, 'Loading manifest...');

    fetch('manifest.json')
      .then(function (resp) {
        setLoadingProgress(30, 'Parsing data...');
        return resp.json();
      })
      .then(function (data) {
        manifest = data;
        setLoadingProgress(50, 'Building wall...');
        renderStats(data.stats);
        setupFilters((data.stats && data.stats.all_tags) || []);
        setupLangToggle();
        setLoadingProgress(80, 'Rendering...');

        // Build wall in the next frame so loading UI can update
        requestAnimationFrame(function () {
          buildWall();
          setLoadingProgress(100, 'Done');
          setTimeout(hideLoading, 250);
        });
      })
      .catch(function (err) {
        console.error('Failed to load manifest:', err);
        setLoadingProgress(0, 'Failed to load manifest.json');
        setTimeout(hideLoading, 2500);
      });

    // Rebuild on resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (wall) buildWall();
      }, 250);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
