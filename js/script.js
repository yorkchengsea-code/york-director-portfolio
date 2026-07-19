(function(){
  'use strict';

  var STRINGS = {
    zh: {
      brandName: '曜境影像',
      navWorks: '作品', navAbout: '關於', navContact: '聯絡',
      heroEyebrow: 'DIRECTOR PORTFOLIO',
      worksTitle: '精選作品',
      worksSub: '從遊戲廣告到消費品牌，跨市場影像製作',
      featuredFlag: '精選',
      comingSoonLabel: '即將上線',
      comingSoonSub: '影片版本尚未公開，歡迎來信索取',
      aboutEyebrow: 'ABOUT',
      aboutTitle: '關於導演',
      statYears: '年經驗',
      statCases: '件案子',
      statDeliverables: '支交付物',
      brandsTitle: '合作品牌',
      endorsersTitle: '合作代言人',
      contactEyebrow: 'CONTACT',
      contactTitle: '聯絡合作',
      footerRights: '版權所有',
      playLabel: '播放影片',
      infoTooltip: '關於此數據的說明',
      noteLabel: '備註'
    },
    en: {
      brandName: 'Yao Jing Image',
      navWorks: 'Works', navAbout: 'About', navContact: 'Contact',
      heroEyebrow: 'DIRECTOR PORTFOLIO',
      worksTitle: 'Selected Works',
      worksSub: 'From game advertising to consumer brands, across markets',
      featuredFlag: 'Featured',
      comingSoonLabel: 'Coming Soon',
      comingSoonSub: 'Video not yet public — available on request',
      aboutEyebrow: 'ABOUT',
      aboutTitle: 'About the Director',
      statYears: 'Years',
      statCases: 'Projects',
      statDeliverables: 'Deliverables',
      brandsTitle: 'Brand Collaborations',
      endorsersTitle: 'Endorsers',
      contactEyebrow: 'CONTACT',
      contactTitle: 'Get in Touch',
      footerRights: 'All Rights Reserved.',
      playLabel: 'Play video',
      infoTooltip: 'Note on this figure',
      noteLabel: 'Note'
    }
  };

  var state = { lang: 'zh', data: null };

  function t(key){ return STRINGS[state.lang][key] || ''; }

  function pick(obj, key){
    // obj has key_zh / key_en fields
    return obj[key + '_' + state.lang];
  }

  function escapeHtml(str){
    if(str == null) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function formatViews(n){
    if(n == null) return null;
    if(state.lang === 'zh'){
      if(n >= 10000){
        var v = (n/10000).toFixed(1).replace(/\.0$/,'');
        return v + '萬次觀看';
      }
      return n.toLocaleString('zh-Hant') + '次觀看';
    } else {
      if(n >= 1000000){
        var m = (n/1000000).toFixed(2).replace(/0$/,'').replace(/\.$/,'');
        return m + 'M views';
      }
      if(n >= 1000){
        var k = (n/1000).toFixed(1).replace(/\.0$/,'');
        return k + 'K views';
      }
      return n.toLocaleString('en-US') + ' views';
    }
  }

  function closeAllPopovers(){
    document.querySelectorAll('.info-popover').forEach(function(p){ p.hidden = true; });
    document.querySelectorAll('.info-dot[aria-expanded="true"]').forEach(function(b){ b.setAttribute('aria-expanded', 'false'); });
  }
  document.addEventListener('click', closeAllPopovers);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeAllPopovers();
  });

  var PLAY_SVG = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';

  function buildLiteYt(youtubeId, altText, sizeClass){
    var wrap = document.createElement('div');
    wrap.className = 'lite-yt' + (sizeClass ? ' ' + sizeClass : '');
    wrap.style.backgroundImage = 'url(https://i.ytimg.com/vi/' + youtubeId + '/hqdefault.jpg)';
    wrap.setAttribute('role','button');
    wrap.setAttribute('tabindex','0');
    wrap.setAttribute('aria-label', t('playLabel') + ': ' + altText);

    var btn = document.createElement('span');
    btn.className = 'play-btn';
    btn.innerHTML = PLAY_SVG;
    wrap.appendChild(btn);

    function activate(){
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube.com/embed/' + youtubeId + '?autoplay=1&rel=0';
      iframe.title = altText;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      wrap.innerHTML = '';
      wrap.style.backgroundImage = 'none';
      wrap.removeAttribute('role');
      wrap.removeAttribute('tabindex');
      wrap.appendChild(iframe);
    }
    wrap.addEventListener('click', activate);
    wrap.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); activate(); }
    });
    return wrap;
  }

  function buildComingSoon(){
    var el = document.createElement('div');
    el.className = 'coming-soon-media';
    el.innerHTML =
      '<div class="cs-label">' + escapeHtml(t('comingSoonLabel')) + '</div>' +
      '<div class="cs-sub">' + escapeHtml(t('comingSoonSub')) + '</div>';
    return el;
  }

  /* ---------------- Hero ---------------- */
  function renderHero(){
    var data = state.data;
    document.getElementById('hero-tagline').textContent = pick(data.director, 'tagline');

    var heroWork = data.works.find(function(w){ return w.id === 'schick-hydropro'; }) || data.works[0];
    var videoWrap = document.getElementById('hero-video-wrap');
    videoWrap.innerHTML = '';
    if(heroWork && heroWork.youtube_id){
      videoWrap.appendChild(buildLiteYt(heroWork.youtube_id, pick(heroWork,'title'), 'lg'));
    }

    var badge = document.getElementById('hero-badge');
    badge.innerHTML = '';
    if(heroWork && heroWork.views != null){
      var b = document.createElement('span');
      b.className = 'views-badge lg';
      b.textContent = formatViews(heroWork.views);
      badge.appendChild(b);
    }
  }

  /* ---------------- Works ---------------- */
  function renderWorks(){
    var data = state.data;
    var grid = document.getElementById('works-grid');
    grid.innerHTML = '';

    var works = data.works.slice().sort(function(a,b){
      var af = a.featured ? 1 : 0, bf = b.featured ? 1 : 0;
      if(af !== bf) return bf - af;
      return (b.year || 0) - (a.year || 0);
    });

    works.forEach(function(w){
      var card = document.createElement('article');
      card.className = 'card' + (w.featured ? ' featured' : '');

      var media = document.createElement('div');
      media.className = 'card-media';
      if(w.youtube_id){
        media.appendChild(buildLiteYt(w.youtube_id, pick(w,'title')));
      } else {
        media.appendChild(buildComingSoon());
      }
      card.appendChild(media);

      var body = document.createElement('div');
      body.className = 'card-body';

      var metaRow = document.createElement('div');
      metaRow.className = 'card-meta-row';
      var clientTypeText = pick(w, 'client_type') || w.client_type;
      metaRow.innerHTML =
        (w.featured ? '<span class="featured-flag">' + escapeHtml(t('featuredFlag')) + '</span>' : '') +
        '<span class="card-year">' + escapeHtml(w.year || '') + '</span>' +
        (clientTypeText ? '<span class="card-type">' + escapeHtml(clientTypeText) + '</span>' : '');
      body.appendChild(metaRow);

      var title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = pick(w,'title');
      body.appendChild(title);

      var client = document.createElement('p');
      client.className = 'card-client';
      client.textContent = pick(w, 'client') || w.client || '';
      body.appendChild(client);

      var desc = document.createElement('p');
      desc.className = 'card-desc';
      desc.textContent = pick(w,'desc');
      body.appendChild(desc);

      var viewsDisplay = pick(w, 'views_display');
      var noteText = pick(w, 'views_note') || w.views_note;
      if(w.views != null || noteText || viewsDisplay){
        var viewsWrap = document.createElement('div');
        viewsWrap.className = 'card-views';
        if(viewsDisplay){
          var vb2 = document.createElement('span');
          vb2.className = 'views-badge';
          vb2.textContent = viewsDisplay;
          viewsWrap.appendChild(vb2);
        } else if(w.views != null){
          var vb = document.createElement('span');
          vb.className = 'views-badge';
          vb.textContent = formatViews(w.views);
          viewsWrap.appendChild(vb);
        }
        if(noteText){
          if(w.views == null && !viewsDisplay){
            var noteLabel = document.createElement('span');
            noteLabel.className = 'card-year';
            noteLabel.textContent = t('noteLabel');
            viewsWrap.appendChild(noteLabel);
          }
          var info = document.createElement('button');
          info.type = 'button';
          info.className = 'info-dot';
          info.textContent = 'i';
          info.setAttribute('aria-expanded', 'false');
          info.setAttribute('aria-label', t('infoTooltip'));
          info.style.marginLeft = '6px';
          viewsWrap.appendChild(info);

          var pop = document.createElement('div');
          pop.className = 'info-popover';
          pop.hidden = true;
          pop.textContent = noteText;

          info.addEventListener('click', function(btn, panel){
            return function(e){
              e.stopPropagation();
              var willOpen = panel.hidden;
              closeAllPopovers();
              if(willOpen){
                panel.hidden = false;
                btn.setAttribute('aria-expanded', 'true');
              }
            };
          }(info, pop));

          body.appendChild(viewsWrap);
          body.appendChild(pop);
          viewsWrap = null;
        }
        if(viewsWrap) body.appendChild(viewsWrap);
      }

      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  /* ---------------- About ---------------- */
  function renderAbout(){
    var data = state.data;
    document.getElementById('about-bio').textContent = pick(data.director, 'bio');

    var stats = data.director.stats;
    var statsRow = document.getElementById('stats-row');
    statsRow.innerHTML = '';
    var statDefs = [
      { num: stats.years, label: t('statYears') },
      { num: stats.cases, label: t('statCases') },
      { num: stats.deliverables, label: t('statDeliverables') }
    ];
    statDefs.forEach(function(s){
      var el = document.createElement('div');
      el.className = 'stat';
      el.innerHTML =
        '<div class="stat-num">' + escapeHtml(s.num) + '</div>' +
        '<div class="stat-label">' + escapeHtml(s.label) + '</div>';
      statsRow.appendChild(el);
    });

    var brandsList = (state.lang === 'en' && data.brands_en && data.brands_en.length === (data.brands || []).length)
      ? data.brands_en : (data.brands || []);
    var brandChips = document.getElementById('brand-chips');
    brandChips.innerHTML = '';
    brandsList.forEach(function(b){
      var chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = b;
      brandChips.appendChild(chip);
    });

    var endorsersList = (state.lang === 'en' && data.endorsers_en && data.endorsers_en.length === (data.endorsers || []).length)
      ? data.endorsers_en : (data.endorsers || []);
    var endorsersBlock = document.getElementById('endorsers-block');
    var endorserChips = document.getElementById('endorser-chips');
    endorserChips.innerHTML = '';
    if(endorsersList && endorsersList.length){
      endorsersBlock.style.display = '';
      endorsersList.forEach(function(e){
        var chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = e;
        endorserChips.appendChild(chip);
      });
    } else {
      endorsersBlock.style.display = 'none';
    }
  }

  /* ---------------- Contact ---------------- */
  function renderContact(){
    var data = state.data;
    var companyText = pick(data.contact, 'company') || data.contact.company;
    document.getElementById('contact-company').textContent = companyText;
    var emailEl = document.getElementById('contact-email');
    emailEl.textContent = data.contact.email;
    emailEl.href = 'mailto:' + data.contact.email;

    document.getElementById('footer-year').textContent = new Date().getFullYear();
    document.getElementById('footer-company').textContent = companyText;
  }

  /* ---------------- i18n chrome (nav labels etc) ---------------- */
  function applyStaticStrings(){
    document.querySelectorAll('[data-i18n-text]').forEach(function(el){
      var key = el.getAttribute('data-i18n-text');
      el.textContent = t(key);
    });
    document.documentElement.lang = state.lang === 'zh' ? 'zh-Hant' : 'en';
    var toggle = document.getElementById('lang-toggle');
    if(toggle) toggle.setAttribute('data-active', state.lang);
  }

  /* ---------------- Full render ---------------- */
  function renderAll(){
    if(!state.data) return;
    applyStaticStrings();
    renderHero();
    renderWorks();
    renderAbout();
    renderContact();
  }

  function setLang(lang){
    if(lang !== 'zh' && lang !== 'en') return;
    state.lang = lang;
    renderAll();
  }

  function initLangToggle(){
    var toggle = document.getElementById('lang-toggle');
    if(!toggle) return;
    toggle.addEventListener('click', function(){
      setLang(state.lang === 'zh' ? 'en' : 'zh');
    });
  }

  function init(){
    initLangToggle();
    fetch('site-data.json')
      .then(function(res){ return res.json(); })
      .then(function(json){
        state.data = json;
        renderAll();
      })
      .catch(function(err){
        console.error('Failed to load site-data.json', err);
      });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
