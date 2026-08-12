(function () {
  'use strict';

  // ===================================================================
  // App State
  // ===================================================================
  var manifest = null;
  var currentPost = null;      // selected edition post object
  var editionOrder = [];       // sorted posts array; selectEdition indexes into it
  var expandedDate = null;     // date whose language sub-items are expanded in the left list
  var filters = { sources: [], tags: [], scores: [] };  // multi-select filter state
  var filterExpanded = { source: false, tag: false, score: false };  // show all chips per group
  var FILTER_CHIP_LIMIT = 6;   // beyond this, a group collapses to one row + a "more" toggle

  // Score bands for the score filter (≤3 bands → never collapses)
  var SCORE_BANDS = [
    { key: 'high', label: '≥ 8', test: function (s) { return s >= 8; } },
    { key: 'mid',  label: '5-7',     test: function (s) { return s >= 5 && s < 8; } },
    { key: 'low',  label: '< 5',     test: function (s) { return s < 5; } }
  ];

  // ===================================================================
  // i18n — page-level UI language (not edition language)
  // ===================================================================
  var uiLang = 'zh';
  var I18N = {
    en: {
      nav_filter: 'Filter', nav_today: 'Lead', nav_more: 'More', nav_colophon: 'Colophon',
      docs: 'Docs', github: 'GitHub',
      masthead_slogan: 'AI-CURATED NEWS RADAR',
      stat_editions: 'Editions', stat_stories: 'Stories', stat_updated: 'Updated',
      edition_list: 'Editions',
      filter_title: 'Filter',
      lead_kicker: 'Lead',
      filter_sources: 'Sources', filter_tags: 'Tags', filter_scores: 'Score',
      filter_invert: 'Invert', filter_reset: 'Reset',
      filter_more: 'more', filter_less: 'less',
      more_edition: 'More articles',
      feed_empty: 'No articles yet. Check back daily.',
      feed_empty_cat: 'No articles match these filters.',
      lang_zh: '中文', lang_en: 'EN',
      loading: 'Loading...',
      colophon_kicker: 'Colophon',
      footer_project: 'Project', footer_doc: 'Documentation', footer_scoring: 'Scoring',
      footer_community: 'Community', footer_legal: 'Legal',
      footer_license: 'MIT License', footer_view_license: 'View License',
      footer_powered: 'Powered by <a href="https://github.com/Thysrael/Horizon">Horizon</a> — AI-driven information aggregation',
      article_tags: 'Tags', article_source: 'Source',
      title_tag: 'Horizon Daily — AI-Curated News Digest',
      meta_desc: 'Horizon is an AI-driven news aggregation system. Daily briefings in English & Chinese from Hacker News, Reddit, RSS, GitHub, and more.',
      empty_editions: 'No editions yet.'
    },
    zh: {
      nav_filter: '筛选', nav_today: '头条', nav_more: '更多', nav_colophon: '报尾',
      docs: '文档', github: 'GitHub',
      masthead_slogan: 'AI 精选新闻雷达',
      stat_editions: '期数', stat_stories: '文章', stat_updated: '更新于',
      edition_list: '速递',
      filter_title: '筛选',
      lead_kicker: '头条',
      filter_sources: '来源', filter_tags: '标签', filter_scores: '评分',
      filter_invert: '反选', filter_reset: '重置',
      filter_more: '更多', filter_less: '收起',
      more_edition: '更多文章',
      feed_empty: '暂无文章，请明天再来。',
      feed_empty_cat: '没有匹配这些筛选条件的文章。',
      lang_zh: '中文', lang_en: 'EN',
      loading: '加载中...',
      colophon_kicker: '报尾',
      footer_project: '项目', footer_doc: '文档', footer_scoring: '评分',
      footer_community: '社区', footer_legal: '协议',
      footer_license: 'MIT 协议', footer_view_license: '查看协议',
      footer_powered: '由 <a href="https://github.com/Thysrael/Horizon">Horizon</a> 驱动 —— AI 信息聚合',
      article_tags: '标签', article_source: '来源',
      title_tag: 'Horizon 每日速递 —— AI 精选新闻',
      meta_desc: 'Horizon 是一个 AI 驱动的信息聚合系统。从 Hacker News、Reddit、RSS、GitHub 等来源生成中英双语每日速递。',
      empty_editions: '暂无速递。'
    }
  };

  function t(key) {
    return (I18N[uiLang] && I18N[uiLang][key]) || (I18N.en && I18N.en[key]) || key;
  }

  function langLabel(langCode) {
    return langCode === 'zh' ? t('lang_zh') : t('lang_en');
  }

  function initI18n() {
    var saved = null;
    try { saved = localStorage.getItem('hz-ui-lang'); } catch (e) { /* noop */ }
    if (saved === 'en' || saved === 'zh') {
      uiLang = saved;
    } else {
      var nav = (navigator.language || navigator.userLanguage || 'en');
      uiLang = /^zh/i.test(nav) ? 'zh' : 'en';
    }
    applyUI();
  }

  function applyUI() {
    document.documentElement.setAttribute('lang', uiLang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.innerHTML = t(key);
    });

    document.title = t('title_tag');
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('meta_desc'));

    updateLangButton();
    renderMastheadStats();
    if (currentPost) {
      renderEditionList();
      renderContent();
    }
  }

  // ===================================================================
  // Theme Toggle
  // ===================================================================
  function initTheme() {
    var saved = localStorage.getItem('hz-theme');
    var prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (saved === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next;
    if (current === 'dark') {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', 'light');
      next = 'light';
    } else if (current === 'light') {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
      next = 'dark';
    } else {
      var prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
      next = prefersDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
    }
    localStorage.setItem('hz-theme', next);
  }

  // ===================================================================
  // Navbar
  // ===================================================================
  function initNavbar() {
    var navbar = document.getElementById('navbar');
    var hamburger = document.getElementById('nav-hamburger');
    var navLinks = document.getElementById('nav-links');
    var programmaticScroll = false;   // suppress observer while a nav click scrolls
    var scrollEndTimer = null;

    window.addEventListener('scroll', function () {
      var scrolled = window.scrollY > 10;
      navbar.classList.toggle('hz-navbar-scrolled', scrolled);
      // Detect scroll end → re-enable the observer-based highlight
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(function () { programmaticScroll = false; }, 150);
    });

    if (hamburger && navLinks) {
      var drawerEl = document.createElement('div');
      drawerEl.className = 'hz-nav-drawer';
      drawerEl.id = 'nav-drawer';
      navLinks.querySelectorAll('a').forEach(function (a) {
        var clone = a.cloneNode(true);
        clone.addEventListener('click', function () {
          drawerEl.classList.remove('open');
          hamburger.classList.remove('open');
          // setActiveNav is hoisted — highlight the matching topbar link
          setActiveNav(a.getAttribute('href'));
        });
        drawerEl.appendChild(clone);
      });
      navbar.after(drawerEl);

      hamburger.addEventListener('click', function () {
        var isOpen = drawerEl.classList.contains('open');
        hamburger.classList.toggle('open', !isOpen);
        drawerEl.classList.toggle('open', !isOpen);
      });
    }

    // Highlight the nav link for a given anchor (used on click; also from observer)
    function setActiveNav(href) {
      navLinks.querySelectorAll('a').forEach(function (n) {
        n.classList.toggle('active', n.getAttribute('href') === href);
      });
    }

    // Smooth scroll for anchor links — set active immediately on click so the
    // highlight always follows, even for short sections that never enter the
    // observer's mid-viewport band.
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          programmaticScroll = true;   // ignore observer while this smooth scroll runs
          setActiveNav(href);
          var offset = 80;
          var top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });

    // Active nav link via IntersectionObserver (for manual scrolling)
    if ('IntersectionObserver' in window && navLinks) {
      var sections = document.querySelectorAll('section[id], header[id], footer[id], .lead-story, .filter-toolbar');
      var observer = new IntersectionObserver(function (entries) {
        if (programmaticScroll) return;   // don't fight the nav-click highlight
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id || 'today';
            setActiveNav('#' + id);
          }
        });
      }, { rootMargin: '-50% 0px -50% 0px' });
      sections.forEach(function (s) { observer.observe(s); });
    }

    var themeBtn = document.getElementById('nav-theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  }

  // ===================================================================
  // Masthead stats — editions/stories counted by date (not language).
  // Left: 期数 · 文章   Right: 更新于   Center: slogan (in HTML).
  // ===================================================================
  function renderMastheadStats() {
    var leftEl = document.getElementById('masthead-stats-left');
    var rightEl = document.getElementById('masthead-stats-right');

    var posts = (manifest && manifest.posts) || [];

    // Editions = number of unique dates (zh/en of the same day count once)
    var dates = {};
    posts.forEach(function (p) { if (p.date) dates[p.date] = true; });
    var editionCount = Object.keys(dates).length;

    // Stories = per-date item count (language-deduped, take the max), summed
    var perDate = {};
    posts.forEach(function (p) {
      if (!p.date) return;
      perDate[p.date] = Math.max(perDate[p.date] || 0, p.item_count || 0);
    });
    var storyCount = Object.keys(perDate).reduce(function (s, d) { return s + perDate[d]; }, 0);

    // Updated = newest edition date (fall back to manifest updated_at)
    var latestDate = Object.keys(dates).sort().pop() || '';
    var updateStr = '';
    if (latestDate) {
      var dp = latestDate.split('-');
      if (dp.length === 3) updateStr = parseInt(dp[1], 10) + '/' + parseInt(dp[2], 10);
    } else if (manifest && manifest.updated_at) {
      var u = new Date(manifest.updated_at);
      if (!isNaN(u.getTime())) updateStr = (u.getMonth() + 1) + '/' + u.getDate();
    }

    if (leftEl) leftEl.textContent = t('stat_editions') + ' ' + editionCount + ' · ' + t('stat_stories') + ' ' + storyCount;
    if (rightEl && updateStr) rightEl.textContent = t('stat_updated') + ' ' + updateStr;
  }

  // ===================================================================
  // Topbar language switcher — controls BOTH the UI language and the
  // language of the currently selected edition.
  // ===================================================================
  function switchLanguage() {
    var target = uiLang === 'zh' ? 'en' : 'zh';
    uiLang = target;
    try { localStorage.setItem('hz-ui-lang', target); } catch (e) { /* noop */ }
    applyUI();

    if (currentPost && editionOrder.length) {
      var idx = -1;
      for (var i = 0; i < editionOrder.length; i++) {
        if (editionOrder[i].date === currentPost.date && editionOrder[i].lang === target) { idx = i; break; }
      }
      if (idx === -1) {
        for (var j = 0; j < editionOrder.length; j++) {
          if (editionOrder[j].lang === target) { idx = j; break; }
        }
      }
      if (idx !== -1) {
        expandedDate = null;
        selectEdition(idx, false); // language switch must not scroll the page
      }
    }
  }

  function updateLangButton() {
    var btn = document.getElementById('nav-lang-toggle');
    if (!btn) return;
    btn.textContent = uiLang === 'zh' ? 'EN' : '中文';
  }

  function setupLangToggle() {
    var btn = document.getElementById('nav-lang-toggle');
    if (!btn) return;
    btn.addEventListener('click', switchLanguage);
  }

  // ===================================================================
  // Edition list (left column) — collapsed by date, click to expand langs
  // ===================================================================
  function buildEditionList() {
    var posts = (manifest && manifest.posts) ? manifest.posts.slice() : [];
    if (!posts.length) {
      editionOrder = [];
      return;
    }
    posts.sort(function (a, b) {
      var dc = b.date.localeCompare(a.date);
      if (dc !== 0) return dc;
      return (a.lang === 'zh' ? 0 : 1) - (b.lang === 'zh' ? 0 : 1);
    });
    editionOrder = posts;
    renderEditionList();
  }

  function renderEditionList() {
    var body = document.getElementById('edition-list-body');
    if (!body) return;
    body.innerHTML = '';

    if (!editionOrder.length) {
      body.innerHTML = '<div class="edition-empty">' + escapeHtml(t('empty_editions')) + '</div>';
      return;
    }

    var groups = {};
    editionOrder.forEach(function (p, idx) {
      if (!groups[p.date]) groups[p.date] = [];
      groups[p.date].push({ post: p, idx: idx });
    });

    Object.keys(groups).forEach(function (date) {
      var entries = groups[date];
      var g = document.createElement('div');
      g.className = 'edition-group';

      var primaryLang = entries[0].post.lang;
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].post.lang === uiLang) { primaryLang = entries[i].post.lang; break; }
      }
      var isExpanded = expandedDate === date;
      var isActiveRow = currentPost && currentPost.date === date && !isExpanded;

      var row = document.createElement('button');
      row.className = 'edition-item' + (isActiveRow ? ' active' : '') + (isExpanded ? ' expanded' : '');
      row.dataset.date = date;
      var arrow = isExpanded ? '&#x25BC;' : '&#x25B6;';
      row.innerHTML = '<span class="edition-arrow">' + arrow + '</span>' +
        '<span class="edition-date">' + escapeHtml(formatDate(date)) + '</span>' +
        '<span class="edition-lang">' + escapeHtml(langLabel(primaryLang)) + '</span>';
      row.addEventListener('click', function () { toggleEdition(this.dataset.date); });
      g.appendChild(row);

      if (isExpanded) {
        entries.forEach(function (entry) {
          var sub = document.createElement('button');
          sub.className = 'edition-subitem' + (currentPost && currentPost === entry.post ? ' active' : '');
          sub.innerHTML = '<span class="edition-lang">' + escapeHtml(langLabel(entry.post.lang)) + '</span>' +
            '<span class="edition-count">' + (entry.post.item_count || 0) + '</span>';
          sub.addEventListener('click', function () {
            selectEdition(entry.idx);
            expandedDate = null;
            renderEditionList();
          });
          g.appendChild(sub);
        });
      }

      body.appendChild(g);
    });
  }

  function toggleEdition(date) {
    if (expandedDate === date) {
      expandedDate = null;
      renderEditionList();
    } else {
      expandedDate = date;
      selectByDate(date);
      renderEditionList();
    }
  }

  function selectByDate(date, doScroll) {
    for (var i = 0; i < editionOrder.length; i++) {
      if (editionOrder[i].date === date && editionOrder[i].lang === uiLang) {
        selectEdition(i, doScroll);
        return;
      }
    }
    for (var j = 0; j < editionOrder.length; j++) {
      if (editionOrder[j].date === date) { selectEdition(j, doScroll); return; }
    }
  }

  function formatDate(dateStr) {
    var parts = dateStr.split('-');
    if (parts.length === 3) return parts[0] + '.' + parts[1] + '.' + parts[2];
    return dateStr;
  }

  function selectEdition(idx, doScroll) {
    if (idx < 0 || idx >= editionOrder.length) return;

    currentPost = editionOrder[idx];
    filters = { sources: [], tags: [], scores: [] };
    filterExpanded = { source: false, tag: false, score: false };

    renderEditionList();
    renderMastheadStats();
    updateLangButton();

    buildFilterToolbar();
    renderContent();

    // Only scroll when the user actively switches editions — not on initial load.
    if (doScroll !== false) {
      var todayEl = document.getElementById('today');
      if (todayEl) todayEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ===================================================================
  // Filtering (multi-select: sources OR, tags OR, groups AND)
  // ===================================================================
  function getEditionItems() {
    return (currentPost && currentPost.items) ? currentPost.items.slice() : [];
  }

  function applyFilters(items) {
    return items.filter(function (it) {
      var okSource = !filters.sources.length || filters.sources.indexOf(it.source_type) !== -1;
      var okTag = !filters.tags.length || (it.tags || []).some(function (tg) { return filters.tags.indexOf(tg) !== -1; });
      var okScore = !filters.scores.length || filters.scores.some(function (key) {
        for (var b = 0; b < SCORE_BANDS.length; b++) {
          if (SCORE_BANDS[b].key === key) return SCORE_BANDS[b].test(it.score || 0);
        }
        return false;
      });
      return okSource && okTag && okScore;
    });
  }

  function buildFilterToolbar() {
    var items = getEditionItems();
    var sources = {}, tags = {};
    items.forEach(function (it) {
      if (it.source_type) sources[it.source_type] = true;
      (it.tags || []).forEach(function (tg) { tags[tg] = true; });
    });
    renderFilterChips('filter-sources-chips', Object.keys(sources).sort(), filters.sources, 'source');
    renderFilterChips('filter-tags-chips', Object.keys(tags).sort(), filters.tags, 'tag');
    renderFilterChips('filter-scores-chips', SCORE_BANDS.map(function (b) { return b.key; }), filters.scores, 'score');
  }

  function renderFilterChips(containerId, values, selected, kind) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';

    var shouldCollapse = values.length > FILTER_CHIP_LIMIT;
    var showAll = filterExpanded[kind];
    var collapsed = shouldCollapse && !showAll;
    var visible = collapsed ? values.slice(0, FILTER_CHIP_LIMIT) : values;
    var hiddenCount = values.length - visible.length;

    // Collapsed groups stay on a single row (chips ellipsize, "more" pinned)
    el.className = 'filter-chips' + (collapsed ? ' collapsed' : '');

    visible.forEach(function (v) {
      var chip = document.createElement('button');
      chip.className = 'filter-chip' + (selected.indexOf(v) !== -1 ? ' selected' : '');
      chip.dataset.kind = kind;
      chip.dataset.value = v;
      chip.textContent = chipLabel(kind, v);
      chip.addEventListener('click', function () { toggleFilter(kind, v); });
      el.appendChild(chip);
    });

    // Collapse/expand toggle whenever the group exceeds the limit —
    // shown both when collapsed ("+N more") and expanded ("less").
    if (shouldCollapse) {
      var toggle = document.createElement('button');
      toggle.className = 'filter-chip filter-more';
      toggle.textContent = showAll ? t('filter_less') : '+' + hiddenCount + ' ' + t('filter_more');
      toggle.addEventListener('click', function () {
        filterExpanded[kind] = !filterExpanded[kind];
        renderFilterChips(containerId, values, selected, kind);
      });
      el.appendChild(toggle);
    }
  }

  function chipLabel(kind, value) {
    if (kind === 'score') {
      for (var i = 0; i < SCORE_BANDS.length; i++) {
        if (SCORE_BANDS[i].key === value) return SCORE_BANDS[i].label;
      }
      return value;
    }
    return kind === 'source' ? escapeHtml(value) : '#' + escapeHtml(value);
  }

  function toggleFilter(kind, value) {
    var arr = kind === 'source' ? filters.sources : (kind === 'tag' ? filters.tags : filters.scores);
    var i = arr.indexOf(value);
    if (i === -1) arr.push(value); else arr.splice(i, 1);
    buildFilterToolbar();
    renderContent();
  }

  // Invert the current selection: every unselected chip becomes selected and
  // every selected chip becomes unselected (complement per group).
  function invertFilters() {
    var items = getEditionItems();
    var srcSet = {}, tagSet = {};
    items.forEach(function (it) {
      if (it.source_type) srcSet[it.source_type] = true;
      (it.tags || []).forEach(function (tg) { tagSet[tg] = true; });
    });
    var allSources = Object.keys(srcSet);
    var allTags = Object.keys(tagSet);
    var allScores = SCORE_BANDS.map(function (b) { return b.key; });

    filters.sources = allSources.filter(function (s) { return filters.sources.indexOf(s) === -1; });
    filters.tags = allTags.filter(function (tg) { return filters.tags.indexOf(tg) === -1; });
    filters.scores = allScores.filter(function (sc) { return filters.scores.indexOf(sc) === -1; });

    buildFilterToolbar();
    renderContent();
  }

  function setupFilterReset() {
    var btn = document.getElementById('filter-reset');
    if (!btn) return;
    btn.addEventListener('click', function () {
      filters = { sources: [], tags: [], scores: [] };
      filterExpanded = { source: false, tag: false, score: false };
      buildFilterToolbar();
      renderContent();
    });

    var invertBtn = document.getElementById('filter-invert');
    if (invertBtn) invertBtn.addEventListener('click', invertFilters);

    // Per-group clear buttons — clear the group's selection only; keep the
    // collapse/expand state untouched (clearing must not re-fold the group).
    var clearSrc = document.getElementById('filter-clear-sources');
    if (clearSrc) clearSrc.addEventListener('click', function () {
      filters.sources = [];
      buildFilterToolbar();
      renderContent();
    });
    var clearTag = document.getElementById('filter-clear-tags');
    if (clearTag) clearTag.addEventListener('click', function () {
      filters.tags = [];
      buildFilterToolbar();
      renderContent();
    });
    var clearScore = document.getElementById('filter-clear-scores');
    if (clearScore) clearScore.addEventListener('click', function () {
      filters.scores = [];
      buildFilterToolbar();
      renderContent();
    });
  }

  // Click delegation for secondary article cards — makes the whole .feed-item
  // clickable (opens in new tab). The title link has target="_blank" and we
  // ignore clicks that originate from it to avoid double-open.
  function setupSecondaryCardClick() {
    var list = document.getElementById('secondary-list');
    if (!list) return;
    list.addEventListener('click', function (e) {
      var card = e.target.closest('.feed-item');
      if (!card) return;
      // If the click came from the title link, let the native <a> handle it.
      if (e.target.closest('.feed-item-title a')) return;
      var href = card.dataset.href;
      if (!href || href === '#') return;
      window.open(href, '_blank', 'noopener,noreferrer');
    });
  }

  // ===================================================================
  // Content — lead story (top score) + secondary multi-column list
  // ===================================================================
  function renderContent() {
    var items = applyFilters(getEditionItems());
    items.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
    renderLead(items[0] || null);
    renderSecondary(items.slice(1));
  }

  function articleHref(item) {
    if (!currentPost || !item) return '#';
    var items = currentPost.items || [];
    var idx = items.indexOf(item);
    var base = currentPost.url || '';
    return base + (idx >= 0 ? '#item-' + (idx + 1) : '');
  }

  function renderLead(item) {
    var el = document.querySelector('.lead-story');
    if (!el) return;
    if (!item) {
      el.innerHTML = '<div class="feed-empty">' + escapeHtml(t('feed_empty')) + '</div>';
      return;
    }
    var score = item.score || 0;
    var tier = scoreTier(score);
    var title = escapeHtml(item.title || '');
    var summary = escapeHtml(item.summary || '');
    var src = item.source_type || 'unknown';
    var href = articleHref(item);
    el.innerHTML =
      '<a class="lead-link" href="' + href + '" target="_blank" rel="noopener">' +
        '<div class="lead-visual">' +
          '<span class="lead-kicker">' + escapeHtml(readableSource(src)) + '</span>' +
          '<h2 class="lead-title">' + title + '</h2>' +
          '<p class="lead-summary">' + summary + '</p>' +
          '<span class="lead-meta">' +
            '<span class="score-badge" data-tier="' + tier + '">' + score + '/10</span>' +
          '</span>' +
        '</div>' +
      '</a>';

    // Ensure background image loads with fallback (handles 404/CORS on og_image)
    var leadVisual = el.querySelector('.lead-visual');
    var fallbackUrl = 'assets/stacked-newspapers.png';
    var primaryUrl = item.og_image || null;
    ensureBgImage(leadVisual, primaryUrl, fallbackUrl);
  }

  function renderSecondary(items) {
    var el = document.getElementById('secondary-list');
    if (!el) return;
    if (!items.length) {
      el.innerHTML = '<div class="feed-empty">' + escapeHtml(t('feed_empty_cat')) + '</div>';
      return;
    }
    var html = items.map(function (it) {
      var src = it.source_type || 'unknown';
      var sourceClass = 'source-' + src;
      // Background layer, revealed on hover: the OG photo if available,
      // otherwise the stacked-newspapers placeholder photo with a light scrim.
      // We store the primary og_image in data-og-image for ensureBgImage to pick up.
      var ogImageAttr = it.og_image ? ' data-og-image="' + escapeHtml(it.og_image) + '"' : '';
      var bgLayer = '<div class="feed-item-bg"' + ogImageAttr + '></div>';
      var href = articleHref(it);
      return '<article class="feed-item" data-href="' + escapeHtml(href) + '">' +
        bgLayer +
        '<div class="feed-item-body">' +
          '<span class="source-badge ' + sourceClass + '">' + escapeHtml(src) + '</span>' +
          '<h4 class="feed-item-title"><a href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' + escapeHtml(it.title) + '</a></h4>' +
          '<p class="feed-item-summary">' + escapeHtml(it.summary || '') + '</p>' +
          '<span class="score-badge" data-tier="' + scoreTier(it.score || 0) + '">' + (it.score || 0) + '/10</span>' +
        '</div>' +
      '</article>';
    }).join('');
    el.innerHTML = html;

    // Ensure background images load with fallback (handles 404/CORS on og_image)
    var fallbackUrl = 'assets/stacked-newspapers.png';
    var bgElements = el.querySelectorAll('.feed-item-bg');
    var promises = [];
    bgElements.forEach(function (bgEl) {
      var primaryUrl = bgEl.getAttribute('data-og-image') || null;
      promises.push(ensureBgImage(bgEl, primaryUrl, fallbackUrl));
    });
    // Optionally await all, but fire-and-forget is fine for background images
    Promise.all(promises).catch(function () { /* ignore */ });
  }

  function readableSource(src) {
    return String(src).replace(/_/g, ' ').toUpperCase();
  }

  function scoreTier(score) {
    if (score >= 9) return 'high';
    if (score >= 7) return 'good';
    if (score >= 5) return 'mid';
    return 'low';
  }

  // ===================================================================
  // Article page helpers (for posts/{date}-{lang}.html)
  // ===================================================================
  function processScoreBadges() {
    var scoreRe = /⭐️\s*(\d+(?:\.\d+)?)\/10/;
    document.querySelectorAll('.hz-post h2, .hz-post li, .post-toc li').forEach(function (el) {
      var m = el.innerHTML.match(scoreRe);
      if (!m) return;
      var score = parseFloat(m[1]);
      var tier = score >= 9 ? 'high' : score >= 7 ? 'good' : score >= 5 ? 'mid' : 'low';
      el.innerHTML = el.innerHTML.replace(scoreRe, '<span class="score-badge" data-tier="' + tier + '">' + m[1] + '</span>');
    });
  }

  function markSemanticElements() {
    document.querySelectorAll('.hz-post p').forEach(function (p) {
      var text = p.textContent.trim();
      if (/^(Tags|标签)\s*:/.test(text)) p.classList.add('tag-line');
      if (/^(rss|reddit|github|hackernews|hn|telegram|ossinsight|gdelt|openbb|google.news)\s*·/i.test(text)) p.classList.add('source-line');
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
  // Manifest loading — script-injected (window.__MANIFEST__) first,
  // then fetch, then a dynamic <script> fallback (works under file://)
  // ===================================================================
  function loadManifest() {
    return new Promise(function (resolve) {
      if (window.__MANIFEST__) {
        resolve(window.__MANIFEST__);
        return;
      }
      fetch('manifest.json')
        .then(function (resp) {
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          return resp.json();
        })
        .then(resolve)
        .catch(function () {
          var s = document.createElement('script');
          s.src = 'manifest.js';
          s.onload = function () { resolve(window.__MANIFEST__ || null); };
          s.onerror = function () { resolve(null); };
          document.head.appendChild(s);
        });
    });
  }

  // ===================================================================
  // Utilities
  // ===================================================================

  // Preload an image URL and apply as background-image on success,
  // or fall back to fallbackUrl on error. Returns a Promise.
  function ensureBgImage(el, primaryUrl, fallbackUrl) {
    return new Promise(function (resolve) {
      if (!primaryUrl) {
        if (fallbackUrl) el.style.backgroundImage = 'url(' + fallbackUrl + ')';
        resolve();
        return;
      }
      var img = new Image();
      img.onload = function () {
        el.style.backgroundImage = 'url(' + primaryUrl + ')';
        resolve();
      };
      img.onerror = function () {
        if (fallbackUrl) el.style.backgroundImage = 'url(' + fallbackUrl + ')';
        resolve();
      };
      img.src = primaryUrl;
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ===================================================================
  // Init
  // ===================================================================
  function init() {
    initI18n();
    initTheme();
    initNavbar();

    // Article page mode (posts/{date}-{lang}.html)
    if (document.querySelector('.hz-post')) {
      processScoreBadges();
      markSemanticElements();
      setupArticleLangToggle();
      return;
    }

    // Homepage mode
    var loadingEl = document.getElementById('loading-container');
    var loadBar = document.querySelector('#loading .bar');
    var loadPer = document.querySelector('#loading .per');
    if (loadPer) loadPer.textContent = t('loading');

    loadManifest().then(function (data) {
      if (!data) {
        console.error('Failed to load manifest');
        if (loadBar) loadBar.style.width = '0%';
        if (loadingEl) loadingEl.classList.add('hidden');
        return;
      }
      manifest = data;
      renderMastheadStats();
      buildEditionList();
      setupLangToggle();
      setupFilterReset();

      if (manifest.posts && manifest.posts.length) {
        expandedDate = null;
        selectByDate(editionOrder[0].date, false);
      } else {
        currentPost = { date: '', lang: '', items: manifest.items || [], url: '' };
        filters = { sources: [], tags: [] };
        buildFilterToolbar();
        renderContent();
      }

      setupSecondaryCardClick();

      if (loadingEl) loadingEl.classList.add('hidden');
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
