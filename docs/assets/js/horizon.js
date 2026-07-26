(function () {
  'use strict';

  // ===================================================================
  // State
  // ===================================================================
  var manifest = null;
  var wallEl = null;
  var cards = [];
  var currentTag = '';
  var currentLang = '';

  // Layout config
  var WIDTH = 220;
  var HEIGHT = 180;
  var GAP = 16;
  var cols = 3;

  function calcCols() {
    var w = window.innerWidth;
    if (w < 600) return 2;
    if (w < 1024) return 3;
    return 4;
  }

  // ===================================================================
  // Loading
  // ===================================================================

  function showLoading() {
    var container = document.getElementById('loading-container');
    if (container) container.classList.remove('hidden');
  }

  function hideLoading() {
    var container = document.getElementById('loading-container');
    if (!container) return;
    container.classList.add('hidden');
    setTimeout(function () { container.style.display = 'none'; }, 350);
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
    document.getElementById('stat-posts').textContent = stats.total_posts || 0;
    var articleCount = 0;
    var allPosts = manifest.posts || [];
    allPosts.forEach(function (p) { articleCount += p.item_count || 0; });
    document.getElementById('stat-articles').textContent = articleCount;
    document.getElementById('stat-langs').textContent = (stats.languages || []).join('/') || '—';
    var updated = manifest.updated_at || '';
    if (updated) {
      var d = new Date(updated);
      document.getElementById('stat-updated').textContent =
        (d.getMonth() + 1) + '/' + d.getDate();
    }
  }

  // ===================================================================
  // Filters
  // ===================================================================

  function setupFilters(allTags) {
    var bar = document.getElementById('filter-bar');
    if (!bar) return;
    // Clear existing tag buttons (keep "All")
    var existing = bar.querySelectorAll('.tag-filter');
    existing.forEach(function (btn) { if (btn.dataset.tag !== '') btn.remove(); });

    allTags.forEach(function (tag) {
      var btn = document.createElement('button');
      btn.className = 'tag-filter';
      btn.dataset.tag = tag;
      btn.textContent = '#' + tag;
      btn.addEventListener('click', function () { filterByTag(tag); });
      bar.appendChild(btn);
    });
  }

  function filterByTag(tag) {
    // Toggle: click same tag to deselect
    if (currentTag === tag) {
      currentTag = '';
    } else {
      currentTag = tag;
    }

    // Update filter buttons
    document.querySelectorAll('.tag-filter').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tag === currentTag);
    });

    renderWall();
  }

  // ===================================================================
  // Language toggle
  // ===================================================================

  function setupLangToggle() {
    var langToggle = document.querySelector('.lang-toggle');
    if (!langToggle) return;

    langToggle.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var lang = btn.dataset.lang;
      currentLang = lang;
      langToggle.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('active', b.dataset.lang === lang);
      });
      renderWall();
    });
  }

  // ===================================================================
  // Card Wall
  // ===================================================================

  function getFilteredPosts() {
    var posts = (manifest && manifest.posts) ? manifest.posts.slice() : [];

    if (currentLang) {
      posts = posts.filter(function (p) { return p.lang === currentLang; });
    }

    if (currentTag) {
      posts = posts.filter(function (p) {
        return p.items && p.items.some(function (item) {
          return item.tags && item.tags.indexOf(currentTag) !== -1;
        });
      });
    }

    // Sort by date descending
    posts.sort(function (a, b) { return b.date.localeCompare(a.date); });

    return posts;
  }

  function renderWall() {
    wallEl = document.getElementById('wall');
    if (!wallEl) return;

    // Clear
    wallEl.innerHTML = '';
    cards = [];

    var posts = getFilteredPosts();
    cols = calcCols();
    var cardWidth = WIDTH;
    var cardHeight = HEIGHT;

    posts.forEach(function (post, index) {
      var card = createCard(post, index, cardWidth, cardHeight);
      cards.push(card);
      wallEl.appendChild(card.el);
    });

    layoutCards();
    wallEl.classList.add('loaded');
  }

  function createCard(post, index, w, h) {
    var el = document.createElement('div');
    el.className = 'wall-card';
    el.style.width = w + 'px';
    el.style.height = h + 'px';

    var topItem = post.items && post.items[0];
    var topScore = post.top_score || (topItem ? topItem.score : 0);

    var tagsHtml = '';
    if (topItem && topItem.tags) {
      tagsHtml = topItem.tags.slice(0, 3).map(function (t) {
        return '<span class="tag-dot">#' + escapeHtml(t) + '</span>';
      }).join('');
    }

    var scoreBadge = '';
    if (topScore > 0) {
      var tier = topScore >= 9 ? 'high' : topScore >= 7 ? 'good' : topScore >= 5 ? 'mid' : 'low';
      scoreBadge = '<span class="score-badge" data-tier="' + tier + '">' + topScore + '</span>';
    }

    // Parse date
    var displayDate = post.date;
    var parts = post.date.split('-');
    if (parts.length === 3) {
      displayDate = parts[1] + '-' + parts[2];
    }

    el.innerHTML =
      '<a href="' + post.url + '">' +
        '<div class="wall-card-visual">' +
          '<span class="wall-card-date">' + displayDate + '</span>' +
          '<span class="wall-card-lang">' + escapeHtml(post.lang) + '</span>' +
          '<span class="wall-card-count">' + post.item_count + ' items</span>' +
        '</div>' +
        '<div class="wall-card-info">' +
          '<p class="wall-card-info-title">' + escapeHtml(post.lang === 'zh' ? '每日速递' : 'Horizon Daily') + '</p>' +
          '<p class="wall-card-info-meta">' +
            scoreBadge + tagsHtml +
          '</p>' +
        '</div>' +
      '</a>';

    return { el: el, w: w, h: h };
  }

  function layoutCards() {
    if (!wallEl) wallEl = document.getElementById('wall');
    if (!wallEl) return;

    cols = calcCols();
    var containerWidth = Math.min(window.innerWidth - 40, cols * (WIDTH + GAP));
    wallEl.style.width = containerWidth + 'px';

    var offsetX = 0;
    var colHeights = [];
    for (var i = 0; i < cols; i++) colHeights.push(0);

    cards.forEach(function (card) {
      // Find shortest column
      var minH = Infinity;
      var minCol = 0;
      for (var c = 0; c < cols; c++) {
        if (colHeights[c] < minH) { minH = colHeights[c]; minCol = c; }
      }

      card.el.style.left = (minCol * (WIDTH + GAP)) + 'px';
      card.el.style.top = colHeights[minCol] + 'px';
      colHeights[minCol] += HEIGHT + GAP;
    });

    var maxHeight = Math.max.apply(null, colHeights);
    wallEl.style.height = maxHeight + 'px';
  }

  // ===================================================================
  // Article page functions (preserved for post pages)
  // ===================================================================

  function processScoreBadges() {
    var scoreRe = /⭐️\s*(\d+(?:\.\d+)?)\/10/;
    var targets = document.querySelectorAll('.hz-post h2, .hz-post li, .post-toc li');
    targets.forEach(function (el) {
      var m = el.innerHTML.match(scoreRe);
      if (!m) return;
      var score = parseFloat(m[1]);
      var tier = score >= 9 ? 'high' : score >= 7 ? 'good' : score >= 5 ? 'mid' : 'low';
      el.innerHTML = el.innerHTML.replace(
        scoreRe,
        '<span class="score-badge" data-tier="' + tier + '">' + m[1] + '</span>'
      );
    });
  }

  function markSemanticElements() {
    var paragraphs = document.querySelectorAll('.hz-post p');
    paragraphs.forEach(function (p) {
      var text = p.textContent.trim();
      if (/^(Tags|标签)\s*:/.test(text)) {
        p.classList.add('tag-line');
      }
      if (/^(rss|reddit|github|hackernews|hn|telegram|ossinsight|gdelt|openbb|google.news)\s*·/i.test(text)) {
        p.classList.add('source-line');
      }
    });
  }

  function setupLanguageToggle() {
    // For article pages: redirect between -en and -zh
    if (document.querySelector('.hz-post')) {
      var langBtn = document.querySelector('.hz-nav-lang');
      if (!langBtn) return;
      langBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var path = window.location.pathname;
        var target = null;
        if (/-en(?:\.html)?$/.test(path)) {
          target = path.replace(/-en(\.html)?$/, '-zh$1');
        } else if (/-zh(?:\.html)?$/.test(path)) {
          target = path.replace(/-zh(\.html)?$/, '-en$1');
        }
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
    wallEl = document.getElementById('wall');

    // Check if we're on the homepage (has #wall) or article page
    if (!wallEl) {
      // Article page
      processScoreBadges();
      markSemanticElements();
      setupLanguageToggle();
      return;
    }

    // Homepage
    showLoading();
    setLoadingProgress(5, 'Loading manifest...');

    fetch('manifest.json')
      .then(function (resp) {
        setLoadingProgress(30, 'Parsing...');
        return resp.json();
      })
      .then(function (data) {
        manifest = data;
        setLoadingProgress(60, 'Building...');
        renderStats(data.stats);

        var allTags = (data.stats && data.stats.all_tags) || [];
        setupFilters(allTags);
        setupLangToggle();

        setLoadingProgress(85, 'Rendering...');

        // Use requestAnimationFrame to let the DOM settle
        requestAnimationFrame(function () {
          renderWall();
          setLoadingProgress(100, 'Done');
          setTimeout(hideLoading, 200);
        });
      })
      .catch(function (err) {
        console.error('Failed to load manifest:', err);
        setLoadingProgress(0, 'Failed to load. Is manifest.json present?');
        setTimeout(hideLoading, 2500);
      });

    // Re-layout on resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (cols !== calcCols()) layoutCards();
      }, 200);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
