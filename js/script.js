(function () {
  'use strict';

  var state = { lang: 'zh', data: null, activeWork: null, activeVideo: 0 };
  var dialog = document.getElementById('video-dialog');
  var frame = document.getElementById('video-frame');
  var tabs = document.getElementById('video-tabs');
  var videoTitle = document.getElementById('video-title');

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
  }

  function renderAll() {
    if (!state.data) return;
    applyStaticLabels();
    renderHero();
    renderWorks();
    renderGambling();
    renderFilmography();
    renderAbout();
  }

  document.getElementById('lang-toggle').addEventListener('click', function () {
    state.lang = state.lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('york-portfolio-lang', state.lang);
    renderAll();
  });
  document.getElementById('video-close').addEventListener('click', closeVideo);
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) closeVideo();
  });
  dialog.addEventListener('close', function () { frame.innerHTML = ''; });

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
