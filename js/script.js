(function () {
  'use strict';

  var state = { lang: 'zh', data: null, activeWork: null, activeVideo: 0, quickIndex: 0 };
  var dialog = document.getElementById('video-dialog');
  var frame = document.getElementById('video-frame');
  var tabs = document.getElementById('video-tabs');
  var videoTitle = document.getElementById('video-title');
  var quickDialog = document.getElementById('quick-dialog');
  var quickStage = document.getElementById('quick-stage');
  var quickDots = document.getElementById('quick-dots');
  var quickProgress = document.getElementById('quick-progress');
  var quickKicker = document.getElementById('quick-kicker');
  var quickPrev = document.getElementById('quick-prev');
  var quickNext = document.getElementById('quick-next');
  var quickOpen = document.getElementById('quick-open');

  function pick(item, key) {
    return item[key + '_' + state.lang] || item[key + '_zh'] || item[key + '_en'] || '';
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function allWorks() {
    return state.data.works;
  }

  function findWork(id) {
    return allWorks().find(function (work) { return work.id === id; });
  }

  function setPlayer(index) {
    var work = state.activeWork;
    if (!work || !work.videos || !work.videos.length) return;
    state.activeVideo = index;
    var video = work.videos[index];
    frame.innerHTML = '';
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(video.id) + '?autoplay=1&rel=0';
    iframe.title = pick(work, 'title') + ' — ' + pick(video, 'label');
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    frame.appendChild(iframe);
    Array.prototype.forEach.call(tabs.children, function (tab, tabIndex) {
      tab.setAttribute('aria-selected', tabIndex === index ? 'true' : 'false');
    });
  }

  function openVideo(work) {
    if (!work || !work.videos || !work.videos.length) return;
    state.activeWork = work;
    state.activeVideo = 0;
    videoTitle.textContent = pick(work, 'title');
    tabs.innerHTML = '';
    work.videos.forEach(function (video, index) {
      var tab = el('button', 'video-tab', pick(video, 'label') || String(index + 1));
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      tab.addEventListener('click', function () { setPlayer(index); });
      tabs.appendChild(tab);
    });
    setPlayer(0);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeVideo() {
    frame.innerHTML = '';
    state.activeWork = null;
    if (dialog.open && typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function quickSlides() {
    return state.data && state.data.quick_intro && Array.isArray(state.data.quick_intro.slides)
      ? state.data.quick_intro.slides
      : [];
  }

  function quickContext(slide) {
    return pick(slide, 'context') || slide.context || '';
  }

  function renderQuick() {
    var slides = quickSlides();
    if (!slides.length) return;
    state.quickIndex = Math.max(0, Math.min(state.quickIndex, slides.length - 1));
    var slide = slides[state.quickIndex];
    quickDialog.className = 'quick-dialog quick-theme-' + (slide.theme || 'dark');
    quickKicker.textContent = slide.eyebrow || '';
    quickProgress.textContent = String(state.quickIndex + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    quickStage.innerHTML = '';

    var copy = el('div', 'quick-copy');
    var context = quickContext(slide);
    if (context) copy.appendChild(el('p', 'quick-context', context));
    var title = el('h2', 'quick-title', pick(slide, 'title'));
    title.id = 'quick-title';
    copy.appendChild(title);
    copy.appendChild(el('p', 'quick-description', pick(slide, 'copy')));
    if (slide.email) {
      var email = el('a', 'quick-email', String(slide.email).toUpperCase() + ' ↗');
      email.href = 'mailto:' + slide.email;
      copy.appendChild(email);
    }
    if (Array.isArray(slide.links) && slide.links.length) {
      var links = el('div', 'quick-links');
      slide.links.forEach(function (link) {
        var watch = el('button', 'quick-watch', pick(link, 'label'));
        watch.type = 'button';
        watch.addEventListener('click', function () {
          closeQuick(false);
          openVideo({
            title_zh: String(link.label_zh || slide.title_zh || '').replace(/｜觀看本片$/, ''),
            title_en: String(link.label_en || slide.title_en || '').replace(/\s*\|\s*Watch full film$/, ''),
            videos: [{ id: link.id, label_zh: link.label_zh, label_en: link.label_en }]
          });
        });
        links.appendChild(watch);
      });
      copy.appendChild(links);
    }
    quickStage.appendChild(copy);

    if (slide.image) {
      var visual = el('div', 'quick-visual');
      var image = document.createElement('img');
      image.src = slide.image;
      image.alt = pick(slide, 'alt');
      image.width = 1600;
      image.height = 900;
      visual.appendChild(image);
      quickStage.appendChild(visual);
    }

    quickDots.innerHTML = '';
    slides.forEach(function (item, index) {
      var dot = el('button', 'quick-dot', String(index + 1).padStart(2, '0'));
      dot.type = 'button';
      dot.setAttribute('aria-label', (state.lang === 'zh' ? '前往第 ' : 'Go to slide ') + String(index + 1) + (state.lang === 'zh' ? ' 頁' : ''));
      dot.setAttribute('aria-current', index === state.quickIndex ? 'step' : 'false');
      dot.addEventListener('click', function () { state.quickIndex = index; renderQuick(); });
      quickDots.appendChild(dot);
    });
    quickPrev.disabled = state.quickIndex === 0;
    quickNext.disabled = state.quickIndex === slides.length - 1;
  }

  function openQuick() {
    if (!quickSlides().length) return;
    state.quickIndex = 0;
    renderQuick();
    if (typeof quickDialog.showModal === 'function') quickDialog.showModal();
    else quickDialog.setAttribute('open', '');
    document.getElementById('quick-close').focus();
  }

  function closeQuick(restoreFocus) {
    if (quickDialog.open && typeof quickDialog.close === 'function') quickDialog.close();
    else quickDialog.removeAttribute('open');
    if (restoreFocus !== false) quickOpen.focus();
  }

  function moveQuick(amount) {
    var slides = quickSlides();
    var next = state.quickIndex + amount;
    if (next < 0 || next >= slides.length) return;
    state.quickIndex = next;
    renderQuick();
  }

  function buildMedia(work, className) {
    var hasVideo = work.videos && work.videos.length;
    var media = el(hasVideo ? 'button' : 'div', className || 'work-media');
    if (hasVideo) {
      media.type = 'button';
      media.setAttribute('aria-label', (state.lang === 'zh' ? '播放：' : 'Play: ') + pick(work, 'title'));
      media.addEventListener('click', function () { openVideo(work); });
    }
    if (work.image_fit) media.dataset.fit = work.image_fit;
    var img = document.createElement('img');
    img.src = work.image;
    img.alt = pick(work, 'title');
    img.loading = 'lazy';
    img.width = 1600;
    img.height = 900;
    media.appendChild(img);
    if (hasVideo) {
      media.appendChild(el('span', 'media-shade'));
      media.appendChild(el('span', 'play-mark', '▶'));
    }
    return media;
  }

  function buildWatch(work) {
    if (!work.videos || !work.videos.length) return null;
    var button = el('button', 'watch-link', state.lang === 'zh' ? '觀看完整影片 ↗' : 'Watch full film ↗');
    button.type = 'button';
    button.addEventListener('click', function () { openVideo(work); });
    return button;
  }

  function renderWorks() {
    var grid = document.getElementById('works-grid');
    grid.innerHTML = '';
    state.data.works.forEach(function (work) {
      var card = el('article', 'work-card');
      card.appendChild(buildMedia(work, 'work-media'));
      var copy = el('div', 'work-copy');
      var metaText = [pick(work, 'type'), work.year].filter(Boolean).join(' · ');
      if (metaText) copy.appendChild(el('p', 'work-meta', metaText));
      copy.appendChild(el('h3', '', pick(work, 'title')));
      var workCopy = pick(work, 'copy');
      if (workCopy) copy.appendChild(el('p', 'work-description', workCopy));
      var watch = buildWatch(work);
      if (watch) copy.appendChild(watch);
      card.appendChild(copy);
      grid.appendChild(card);
    });
  }

  function renderFilmography() {
    var list = document.getElementById('filmography-list');
    list.innerHTML = '';
    state.data.filmography.forEach(function (title) {
      list.appendChild(el('div', 'filmography-item', title));
    });
  }

  function renderGambling() {
    var gambling = state.data.gambling_commercials;
    document.getElementById('gambling-title').textContent = pick(gambling, 'title');
    document.getElementById('gambling-copy').textContent = pick(gambling, 'copy');
    var image = document.getElementById('gambling-image');
    image.src = gambling.image;
    image.alt = pick(gambling, 'title');
  }

  function renderHero() {
    var director = state.data.director;
    document.getElementById('hero-pov').textContent = pick(director, 'point_of_view');
    document.getElementById('hero-disciplines').textContent = pick(director, 'tagline');
    var tea = findWork('tea');
    var heroPlay = document.getElementById('hero-play');
    heroPlay.onclick = function () { openVideo(tea); };
  }

  function renderAbout() {
    var director = state.data.director;
    document.getElementById('about-bio').textContent = pick(director, 'bio');
    var experience = document.getElementById('experience');
    experience.innerHTML = '';
    [
      [state.lang === 'zh' ? '品牌' : 'Brands', state.data.experience.brands],
      [state.lang === 'zh' ? '遊戲 IP' : 'Game IPs', state.data.experience.game_ips],
      [state.lang === 'zh' ? '合作藝人' : 'Talent', state.data.experience.talent]
    ].forEach(function (group) {
      var node = el('div', 'experience-group');
      node.appendChild(el('h3', '', group[0]));
      node.appendChild(el('p', '', group[1].join(' · ')));
      experience.appendChild(node);
    });
    document.getElementById('contact-location').textContent = pick(state.data.contact, 'location');
  }

  function applyStaticLabels() {
    document.documentElement.lang = state.lang === 'zh' ? 'zh-Hant' : 'en';
    document.querySelectorAll('[data-label-zh]').forEach(function (node) {
      node.textContent = node.getAttribute('data-label-' + state.lang);
    });
    document.getElementById('lang-toggle').textContent = state.lang === 'zh' ? '中 / EN' : 'ZH / EN';
    document.getElementById('quick-lang-toggle').textContent = state.lang === 'zh' ? '中 / EN' : 'ZH / EN';
  }

  function renderAll() {
    if (!state.data) return;
    applyStaticLabels();
    renderHero();
    renderWorks();
    renderGambling();
    renderFilmography();
    renderAbout();
    if (quickDialog.open) renderQuick();
  }

  function toggleLanguage() {
    state.lang = state.lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('york-portfolio-lang', state.lang);
    renderAll();
  }

  document.getElementById('lang-toggle').addEventListener('click', toggleLanguage);
  document.getElementById('quick-lang-toggle').addEventListener('click', toggleLanguage);
  document.getElementById('video-close').addEventListener('click', closeVideo);
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) closeVideo();
  });
  dialog.addEventListener('close', function () { frame.innerHTML = ''; });
  quickOpen.addEventListener('click', openQuick);
  document.getElementById('quick-close').addEventListener('click', function () { closeQuick(); });
  quickPrev.addEventListener('click', function () { moveQuick(-1); });
  quickNext.addEventListener('click', function () { moveQuick(1); });
  quickDialog.addEventListener('click', function (event) {
    if (event.target === quickDialog) closeQuick();
  });
  quickDialog.addEventListener('cancel', function (event) {
    event.preventDefault();
    closeQuick();
  });
  document.addEventListener('keydown', function (event) {
    if (!quickDialog.open) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveQuick(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveQuick(1); }
    if (event.key === 'Home') { event.preventDefault(); state.quickIndex = 0; renderQuick(); }
    if (event.key === 'End') { event.preventDefault(); state.quickIndex = quickSlides().length - 1; renderQuick(); }
  });

  var savedLang = localStorage.getItem('york-portfolio-lang');
  if (savedLang === 'en' || savedLang === 'zh') state.lang = savedLang;

  fetch('site-data.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('site-data.json ' + response.status);
      return response.json();
    })
    .then(function (data) {
      state.data = data;
      renderAll();
      if (window.location.hash) {
        var fontReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        fontReady.then(function () {
          window.requestAnimationFrame(function () {
            var target = document.querySelector(window.location.hash);
            if (target) target.scrollIntoView({ block: 'start' });
          });
        });
      }
    })
    .catch(function (error) {
      console.error('Portfolio data failed to load', error);
    });
}());
