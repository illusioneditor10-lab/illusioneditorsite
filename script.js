/* ═══════════════════════════════════════════════════════════════
   ILLUSION EDITOR – INTERACTIVE JS v2
   Features: Google Drive + YouTube video modal, typewriter,
   magnetic buttons, particles, scroll progress, section
   indicator, horizontal draggable reel, skill bars, tilt,
   testimonial auto-slider with progress bar
   =============================================================*/
'use strict';
const qs  = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];

/* ══════════════════════════════════════════════════════════════
   ✦  HOW TO ADD YOUR GOOGLE DRIVE VIDEOS  ✦

   1. Upload video to Google Drive
   2. Right-click → Share → set to "Anyone with the link"
   3. Your link looks like:
        https://drive.google.com/file/d/FILE_ID/view
   4. Copy FILE_ID and paste in data-drive="FILE_ID" on the
      corresponding element in index.html
   5. For YouTube: use data-yt="YOUTUBE_VIDEO_ID"

   The video modal handles BOTH automatically.
   =============================================================*/

/* ── 1. Loading Screen ──────────────────────────────────────── */
(function initLoader() {
  const loader  = qs('#loader');
  const bar     = qs('#loader-bar');
  const pct     = qs('#loader-percent');
  if (!loader) return;

  let progress = 0;
  const step = () => {
    progress += Math.random() * 18;
    if (progress >= 100) progress = 100;
    bar.style.width = progress + '%';
    if (pct) pct.textContent = Math.floor(progress) + '%';
    if (progress < 100) setTimeout(step, 120 + Math.random() * 100);
  };
  setTimeout(step, 100);

  const done = () => {
    bar.style.width = '100%';
    if (pct) pct.textContent = '100%';
    setTimeout(() => {
      loader.classList.add('hide');
      qsa('.fade-up').forEach(el => el.classList.add('visible'));
    }, 400);
  };

  window.addEventListener('load', () => setTimeout(done, 800));
  setTimeout(done, 3800); // hard fallback
})();

/* ── 2. Custom Cursor ───────────────────────────────────────── */
(function initCursor() {
  const glow = qs('#cursor-glow');
  const dot  = qs('#cursor-dot');
  if (!glow || !dot) return;

  let mx=0, my=0, gx=0, gy=0, dx=0, dy=0;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function loop() {
    gx += (mx - gx) * .06; gy += (my - gy) * .06;
    dx += (mx - dx) * .18; dy += (my - dy) * .18;
    glow.style.left = gx + 'px'; glow.style.top = gy + 'px';
    dot.style.left  = dx + 'px'; dot.style.top  = dy + 'px';
    requestAnimationFrame(loop);
  })();

  // Hover state
  document.addEventListener('mouseover', e => {
    const el = e.target;
    if (el.closest('.video-trigger, .reel-card.video-trigger, .portfolio-item.video-trigger, .featured-video-player.video-trigger')) {
      document.body.classList.add('cursor-play');
      document.body.classList.remove('cursor-hover');
    } else if (el.closest('a,button,[role="button"],input,select,textarea,.tab-btn,.service-card,.testi-arrow,.reel-card,.sec-dot')) {
      document.body.classList.add('cursor-hover');
      document.body.classList.remove('cursor-play');
    }
  });
  document.addEventListener('mouseout', e => {
    if (!e.target.closest('a,button,[role="button"],input,select,textarea,.video-trigger,.tab-btn,.service-card,.testi-arrow,.reel-card,.sec-dot')) {
      document.body.classList.remove('cursor-hover', 'cursor-play');
    }
  });
  document.addEventListener('mouseleave', () => { glow.style.opacity='0'; dot.style.opacity='0'; });
  document.addEventListener('mouseenter', () => { glow.style.opacity='1'; dot.style.opacity='1'; });
})();

/* ── 3. Particle Canvas (bokeh floating orbs) ───────────────── */
(function initParticles() {
  const canvas = qs('#particle-canvas');
  if (!canvas) return;
  const ctx  = canvas.getContext('2d');
  let W, H, particles = [];

  const COLORS = [
    `rgba(201,168,76,`,
    `rgba(124,58,255,`,
    `rgba(59,130,246,`,
    `rgba(232,201,122,`,
  ];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function mkParticle() {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: 1.5 + Math.random() * 3.5,
      alpha: .04 + Math.random() * .1,
      vx: (Math.random() - .5) * .35,
      vy: -(0.1 + Math.random() * .25),
      color,
      life: 0, maxLife: 200 + Math.random() * 300,
    };
  }

  for (let i=0; i<55; i++) particles.push(mkParticle());

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.life++;
      const fade = Math.sin((p.life / p.maxLife) * Math.PI);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.color + (p.alpha * fade) + ')';
      ctx.fill();
      if (p.life >= p.maxLife || p.y < -20) particles[i] = mkParticle();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── 4. Navbar (scroll + mobile toggle) ─────────────────────── */
(function initNavbar() {
  const navbar = qs('#navbar');
  const toggle = qs('#nav-toggle');
  const links  = qs('#nav-links');
  if (!navbar) return;

  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 60);
    if (y > 200) {
      navbar.style.transform = y > lastY + 8 ? 'translateY(-100%)' : 'translateY(0)';
    } else navbar.style.transform = 'translateY(0)';
    lastY = y;
  }, { passive:true });

  toggle?.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });
  qsa('.nav-link',links).forEach(l => l.addEventListener('click', () => {
    links.classList.remove('open'); toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
  }));
})();

/* ── 5. Scroll Progress Bar ──────────────────────────────────── */
(function initScrollProgress() {
  const bar = qs('#scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (window.scrollY / max * 100) + '%';
  }, { passive:true });
})();

/* ── 6. Section Indicator ────────────────────────────────────── */
(function initSectionIndicator() {
  const dots = qsa('.sec-dot');
  const sections = qsa('section[id]');
  if (!dots.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        dots.forEach(d => d.classList.remove('active'));
        const active = dots.find(d => d.getAttribute('href') === '#'+e.target.id);
        active?.classList.add('active');
      }
    });
  }, { threshold:.4 });

  sections.forEach(s => obs.observe(s));
  dots.forEach(d => d.addEventListener('click', e => {
    e.preventDefault();
    const id = d.getAttribute('href').slice(1);
    qs('#'+id)?.scrollIntoView({ behavior:'smooth', block:'start' });
  }));
})();

/* ── 7. Reveal Animations ────────────────────────────────────── */
(function initReveal() {
  const els = qsa('.reveal-up,.reveal-left,.reveal-right');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.transitionDelay = e.target.style.getPropertyValue('--delay') || '0s';
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold:.1, rootMargin:'0px 0px -50px 0px' });
  els.forEach(el => obs.observe(el));
})();

/* ── 8. Typewriter Hero ──────────────────────────────────────── */
(function initTypewriter() {
  const target = qs('#typewriter-target');
  if (!target) return;
  const phrases = [
    'Crafting Stories That Feel Real',
    'Turning Weddings into Cinematic Memories',
    'Building Brands Through Visual Storytelling',
    'Creating Emotions, One Frame at a Time',
  ];
  let pi=0, ci=0, deleting=false;

  function tick() {
    const phrase = phrases[pi];
    if (!deleting) {
      target.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) { deleting=true; setTimeout(tick, 2200); return; }
    } else {
      target.textContent = phrase.slice(0, --ci);
      if (ci === 0) { deleting=false; pi=(pi+1)%phrases.length; setTimeout(tick, 400); return; }
    }
    setTimeout(tick, deleting ? 38 : 60);
  }
  setTimeout(tick, 2000);
})();

/* ── 9. Counter Animation ────────────────────────────────────── */
(function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = parseInt(el.dataset.target);
      el.classList.add('counting');
      const start = performance.now();
      const dur = 2000;
      (function step(now) {
        const t = Math.min((now-start)/dur, 1);
        const ease = 1-Math.pow(1-t, 3);
        el.textContent = Math.round(target * ease);
        if (t < 1) requestAnimationFrame(step);
        else {
          el.textContent = target;
          setTimeout(() => el.classList.remove('counting'), 600);
        }
      })(start);
      obs.unobserve(el);
    });
  }, { threshold:.5 });
  qsa('[data-target]').forEach(el => obs.observe(el));
})();

/* ── 10. Skill Bars Animation ────────────────────────────────── */
(function initSkillBars() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      qsa('.skill-fill', e.target).forEach(fill => {
        fill.style.width = fill.dataset.width + '%';
      });
      obs.unobserve(e.target);
    });
  }, { threshold:.3 });
  const wrap = qs('.skills-wrap');
  if (wrap) obs.observe(wrap);
})();

/* ── 11. Timeline Animation ──────────────────────────────────── */
(function initTimeline() {
  qsa('.timeline-item').forEach((item,i) => {
    item.style.opacity='0'; item.style.transform='translateX(-20px)';
    item.style.transition='opacity .6s ease, transform .6s ease';
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setTimeout(() => { item.style.opacity='1'; item.style.transform='none'; }, i*160);
        obs.unobserve(item);
      }
    }, { threshold:.2 });
    obs.observe(item);
  });
})();

/* ── 12. Magnetic Buttons ────────────────────────────────────── */
(function initMagnetic() {
  if (window.matchMedia('(hover:none)').matches) return;
  qsa('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width/2)  * .28;
      const y = (e.clientY - r.top  - r.height/2) * .28;
      btn.style.transform = `translate(${x}px,${y}px) scale(1.04)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform='';
      btn.style.transition='transform .5s var(--ease-back)';
      setTimeout(()=>btn.style.transition='',500);
    });
  });
})();

/* ── 13. Tilt Effect on Cards ────────────────────────────────── */
(function initTilt() {
  if (window.matchMedia('(hover:none)').matches) return;
  qsa('.service-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const rx = ((e.clientY-r.top  )/r.height-.5)*-8;
      const ry = ((e.clientX-r.left )/r.width -.5)* 8;
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform=''; });
  });
})();

/* ── 14. Horizontal Reel Drag ──────────────────────────────────*/
(function initReelDrag() {
  const track = qs('#reel-track');
  const left  = qs('#reel-left');
  const right = qs('#reel-right');
  if (!track) return;

  let isDown=false, startX, scrollLeft;

  track.addEventListener('mousedown', e => {
    isDown=true; startX=e.pageX-track.offsetLeft; scrollLeft=track.scrollLeft;
    track.classList.add('grabbing'); e.preventDefault();
  });
  window.addEventListener('mouseup', () => { isDown=false; track.classList.remove('grabbing'); });
  track.addEventListener('mouseleave', () => { isDown=false; track.classList.remove('grabbing'); });
  track.addEventListener('mousemove', e => {
    if (!isDown) return;
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.4;
  });

  // Touch
  let touchStartX=0, touchScrollLeft=0;
  track.addEventListener('touchstart', e => { touchStartX=e.touches[0].pageX; touchScrollLeft=track.scrollLeft; }, {passive:true});
  track.addEventListener('touchmove',  e => { track.scrollLeft = touchScrollLeft-(e.touches[0].pageX-touchStartX)*1.2; }, {passive:true});

  // Arrow buttons
  left?.addEventListener('click',  () => track.scrollBy({ left:-340, behavior:'smooth' }));
  right?.addEventListener('click', () => track.scrollBy({ left: 340, behavior:'smooth' }));
})();

/* ── 15. Google Drive + YouTube Video Modal ─────────────────── */
(function initVideoModal() {
  const modal      = qs('#video-modal');
  const backdrop   = qs('#modal-backdrop');
  const closeBtn   = qs('#modal-close');
  const iframe     = qs('#video-iframe');
  const modalTitle = qs('#modal-title');
  const sourceBadge= qs('#modal-source-badge');
  const openLink   = qs('#modal-open-link');
  if (!modal || !iframe) return;

  /**
   * Build embed URL from a Google Drive file ID or YouTube video ID
   * Drive:   https://drive.google.com/file/d/{ID}/preview
   * YouTube: https://www.youtube.com/embed/{ID}?autoplay=1&rel=0
   */
  function buildSrc(el) {
    const driveId = el.dataset.drive;
    const ytId    = el.dataset.yt;
    if (driveId && driveId !== 'YOUR_MAIN_SHOWREEL_DRIVE_ID' && !driveId.startsWith('YOUR_')) {
      return {
        src:   `https://drive.google.com/file/d/${driveId}/preview`,
        type:  'drive',
        link:  `https://drive.google.com/file/d/${driveId}/view`,
      };
    }
    if (ytId) {
      return {
        src:  `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`,
        type: 'youtube',
        link: `https://youtu.be/${ytId}`,
      };
    }
    // Placeholder — no real ID set yet
    return { src: null, type: 'placeholder', link: '#' };
  }

  function openModal(el) {
    const title = el.dataset.title || 'Video';
    const { src, type, link } = buildSrc(el);

    if (modalTitle)  modalTitle.textContent = title;
    if (sourceBadge) sourceBadge.textContent = type === 'drive' ? '▶ Google Drive' : type === 'youtube' ? '▶ YouTube' : '⚠ Add Your Drive ID';
    if (openLink)  { openLink.href = link; openLink.textContent = type === 'drive' ? 'Open in Drive ↗' : 'Open on YouTube ↗'; }

    if (!src) {
      // Show helpful placeholder message inside iframe area
      iframe.src = 'about:blank';
      iframe.contentDocument?.write(`
        <style>body{margin:0;background:#060606;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;color:#c9a84c;font-family:Georgia,serif;text-align:center;padding:2rem}</style>
        <div>
          <div style="font-size:3rem;margin-bottom:1rem">🎬</div>
          <h2 style="margin-bottom:.5rem">Add Your Google Drive ID</h2>
          <p style="opacity:.6;font-size:.9rem;max-width:400px">Set <code>data-drive="YOUR_FILE_ID"</code> on this element in index.html<br/>to link your Google Drive video here.</p>
        </div>
      `);
    } else {
      iframe.src = src;
    }

    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    iframe.src = '';
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  window.bindVideoTriggers = function() {
    qsa('.video-trigger').forEach(el => {
      if(el.dataset.bound) return;
      el.dataset.bound = "true";
      el.setAttribute('role', el.tagName === 'DIV' ? 'button' : el.getAttribute('role') || 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('click', () => openModal(el));
      el.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); openModal(el); }});
    });
  };
  window.bindVideoTriggers();

  backdrop?.addEventListener('click', closeModal);
  closeBtn?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key==='Escape') closeModal(); });
})();

/* ── 16. Portfolio Filter & Dynamic Data Loading ───────────────── */
(async function initPortfolio() {
  const grid       = qs('#portfolio-grid');
  const mainTabs   = qsa('.tab-btn');
  const subTabsWrap= qs('#wedding-subtabs');
  const subTabs    = qsa('.subtab-btn');
  const descEl     = qs('#subtab-desc');
  if (!grid) return;

  let activeMainFilter  = 'all';
  let activeWeddingSub  = 'all';
  let items = [];

  function applyFilter() {
    items.forEach(item => {
      const cat  = item.dataset.category;
      const wtype= item.dataset.weddingType || '';

      let show = false;
      if (activeMainFilter === 'all') {
        show = true;
      } else if (activeMainFilter === 'wedding') {
        show = cat === 'wedding' && (activeWeddingSub === 'all' || wtype === activeWeddingSub);
      } else {
        show = cat === activeMainFilter;
      }
      item.classList.toggle('hidden', !show);

      // staggered re-entrance animation
      if (show) {
        item.style.animation = 'none';
        requestAnimationFrame(() => { item.style.animation = ''; });
      }
    });
  }

  // Fetch dynamic data
  try {
    const res = await fetch('/api/portfolio');
    if (res.ok) {
       const data = await res.json();
       grid.innerHTML = '';
       data.forEach(d => {
         const div = document.createElement('div');
         div.className = `portfolio-item video-trigger cursor-play ${d.size === 'wide' ? 'wide' : d.size === 'tall' ? 'tall' : ''}`;
         div.dataset.category = d.category;
         div.dataset.weddingType = d.subcategory || '';
         div.dataset.drive = d.driveId || '';
         div.dataset.title = d.title || '';
         
         const tagMap = { highlight: 'w-highlight', destination: 'w-destination', prewedding: 'w-prewedding', engagement: 'w-engagement', teaser: 'w-teaser', sangeet: 'w-sangeet' };
         const tagClass = tagMap[d.subcategory] || (d.category==='commercial'?'commercial':'wedding');
         const tagIcon = d.subcategory === 'destination' ? '✈' : d.subcategory === 'prewedding' ? '💛' : d.subcategory === 'engagement' ? '💍' : d.subcategory === 'sangeet' ? '🎶' : (d.category === 'commercial' ? '📺' : '🎬');
         const tagLabel = d.subcategory ? d.subcategory.charAt(0).toUpperCase() + d.subcategory.slice(1) : d.category;

         div.innerHTML = `
            <img src="https://drive.google.com/uc?export=view&id=${d.thumbnail || d.driveId}" alt="${d.title}" loading="lazy"/>
            <div class="portfolio-item-overlay">
              <div class="portfolio-item-info">
                <span class="pf-tag ${tagClass}">${tagIcon} ${tagLabel}</span>
                <h3>${d.title}</h3>
                <p>${d.desc}</p>
              </div>
              <button class="pf-play-btn" tabindex="-1" aria-label="Play"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
            </div>
         `;
         grid.appendChild(div);
       });
       if(window.bindVideoTriggers) window.bindVideoTriggers();
    }
  } catch(e) { console.error("Error loading portfolio:", e); }

  items = qsa('.portfolio-item');
  applyFilter();

  // Main tabs
  mainTabs.forEach(tab => tab.addEventListener('click', () => {
    mainTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    tab.classList.add('active'); tab.setAttribute('aria-selected','true');
    activeMainFilter = tab.dataset.filter;

    // Show/hide wedding sub-tabs
    if (activeMainFilter === 'wedding') {
      subTabsWrap && subTabsWrap.removeAttribute('hidden');
      // Reset sub-filter to "all" when switching to weddings
      activeWeddingSub = 'all';
      subTabs.forEach(s => { s.classList.remove('active'); s.setAttribute('aria-selected','false'); });
      const allBtn = qs('#sw-all');
      allBtn && allBtn.classList.add('active');
      if (descEl) descEl.setAttribute('hidden','');
    } else {
      subTabsWrap && subTabsWrap.setAttribute('hidden','');
      if (descEl) descEl.setAttribute('hidden','');
    }
    applyFilter();
  }));

  // Wedding sub-tabs
  subTabs.forEach(sub => sub.addEventListener('click', () => {
    subTabs.forEach(s => { s.classList.remove('active'); s.setAttribute('aria-selected','false'); });
    sub.classList.add('active'); sub.setAttribute('aria-selected','true');
    activeWeddingSub = sub.dataset.wedding;

    // Show description strip
    if (descEl) {
      const desc = sub.dataset.desc;
      if (desc && activeWeddingSub !== 'all') {
        descEl.textContent = desc;
        descEl.removeAttribute('hidden');
      } else {
        descEl.setAttribute('hidden','');
      }
    }
    applyFilter();
  }));
})();

/* ── 17. Testimonials Slider with Progress Bar ───────────────── */
(function initTestimonials() {
  const track   = qs('#testimonials-track');
  const prev    = qs('#testi-prev');
  const next    = qs('#testi-next');
  const dotsC   = qs('#testi-dots');
  const progress= qs('#testi-progress');
  if (!track) return;

  const cards     = qsa('.testimonial-card', track);
  const mobile    = () => window.innerWidth <= 900;
  const perSlide  = () => mobile() ? 1 : 2;
  const totalSlides = () => Math.ceil(cards.length / perSlide());
  let current = 0;
  let autoTimer, progressTimer, progressVal = 0;
  const INTERVAL = 5000;

  function buildDots() {
    dotsC.innerHTML='';
    for (let i=0; i<totalSlides(); i++) {
      const d = document.createElement('button');
      d.className = 'testi-dot'+(i===current?' active':'');
      d.setAttribute('aria-label', `Testimonial ${i+1}`);
      d.addEventListener('click', ()=>goTo(i));
      dotsC.appendChild(d);
    }
  }

  function goTo(idx) {
    current = ((idx%totalSlides())+totalSlides())%totalSlides();
    const w = cards[0]?.offsetWidth || 0;
    const gap = mobile() ? 0 : 24;
    track.style.transform = `translateX(-${current*(w+gap)}px)`;
    qsa('.testi-dot',dotsC).forEach((d,i)=>d.classList.toggle('active',i===current));
    restartAuto();
  }

  function restartAuto() {
    clearInterval(autoTimer); clearInterval(progressTimer);
    progressVal=0; if(progress) progress.style.width='0%';
    progressTimer = setInterval(()=>{
      progressVal = Math.min(progressVal+100/(INTERVAL/100), 100);
      if(progress) progress.style.width=progressVal+'%';
    },100);
    autoTimer = setInterval(()=>goTo(current+1), INTERVAL);
  }

  prev?.addEventListener('click', ()=>goTo(current-1));
  next?.addEventListener('click', ()=>goTo(current+1));

  let tx=0;
  track.addEventListener('touchstart', e=>{tx=e.touches[0].clientX;},{passive:true});
  track.addEventListener('touchend',   e=>{
    const diff=e.changedTouches[0].clientX-tx;
    if(Math.abs(diff)>40) goTo(diff<0?current+1:current-1);
  });

  buildDots(); restartAuto();
  window.addEventListener('resize', ()=>{buildDots(); goTo(current);});
})();

/* ── 18. Contact Form ────────────────────────────────────────── */
(function initForm() {
  const form    = qs('#contact-form');
  const success = qs('#form-success');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn  = qs('#cf-submit');
    const span = btn.querySelector('span');
    const orig = span.textContent;
    span.textContent = 'Sending…'; btn.disabled = true;
    await new Promise(r=>setTimeout(r,1800));
    span.textContent = orig; btn.disabled = false;
    form.reset();
    success.removeAttribute('hidden');
    setTimeout(()=>success.setAttribute('hidden',''), 6000);
  });
})();

/* ── 19. Ambient Music – plays real ambient.wav with fade ─────── */
(function initMusic() {
  const btn   = qs('#music-toggle');
  const audio = qs('#bg-music');
  const iOn   = qs('#music-icon-on');
  const iOff  = qs('#music-icon-off');
  if (!btn || !audio) return;

  fetch('/api/settings').then(r => r.json()).then(data => {
    if(data.bgMusic) {
      const source = audio.querySelector('source');
      if(source) {
        source.src = data.bgMusic;
        audio.load();
      }
    }
    function parseImgUrl(url) {
      if (!url) return '';
      // Local uploads path — serve directly, no proxy needed
      if (!url.startsWith('http')) return url;
      // Google Drive share link — extract file ID and use direct export
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
      return url;
    }

    if(data.heroPhoto) {
      const heroBg = qs('.hero-bg-img');
      if(heroBg) heroBg.src = parseImgUrl(data.heroPhoto);
    }
    if(data.aboutPhoto) {
      const aboutBg = qs('.about-img');
      if(aboutBg) aboutBg.src = parseImgUrl(data.aboutPhoto);
    }
  }).catch(e => console.error("Could not load global settings"));

  let playing = false;
  audio.volume = 0;

  function fadeIn() {
    audio.volume = 0;
    let v = 0;
    const t = setInterval(() => {
      v = Math.min(v + 0.02, 0.35);
      audio.volume = v;
      if (v >= 0.35) clearInterval(t);
    }, 80);
  }
  function fadeOut(cb) {
    let v = audio.volume;
    const t = setInterval(() => {
      v = Math.max(v - 0.02, 0);
      audio.volume = v;
      if (v <= 0) { clearInterval(t); cb && cb(); }
    }, 80);
  }

  btn.addEventListener('click', () => {
    if (!playing) {
      audio.play().then(() => {
        playing = true;
        fadeIn();
        btn.classList.add('playing');
        if (iOn) iOn.style.display = 'none';
        if (iOff) iOff.style.display = 'block';
        btn.setAttribute('aria-label', 'Mute ambient music');
        btn.title = 'Mute music';
      }).catch(err => console.warn('Audio play failed:', err));
    } else {
      fadeOut(() => { audio.pause(); audio.currentTime = 0; });
      playing = false;
      btn.classList.remove('playing');
      if (iOn) iOn.style.display = 'block';
      if (iOff) iOff.style.display = 'none';
      btn.setAttribute('aria-label', 'Play ambient music');
      btn.title = 'Play ambient music';
    }
  });
})();

/* ── 20. Parallax Hero ───────────────────────────────────────── */
(function initParallax() {
  const img = qs('.hero-bg-img');
  if (!img) return;
  let ticking=false;
  window.addEventListener('scroll', ()=>{
    if (!ticking) {
      requestAnimationFrame(()=>{
        const y = window.scrollY;
        if (y < window.innerHeight*1.5)
          img.style.transform = `scale(1.05) translateY(${y*.22}px)`;
        ticking=false;
      });
      ticking=true;
    }
  },{passive:true});
})();

/* ── 21. Smooth Anchor Scroll ────────────────────────────────── */
qsa('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href').slice(1);
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior:'smooth', block:'start' });
}));

/* ── 22. Lazy image fade ─────────────────────────────────────── */
qsa('img[loading="lazy"]').forEach(img => {
  img.style.opacity='0';img.style.transition='opacity .5s ease';
  img.addEventListener('load', ()=>img.style.opacity='1');
  if (img.complete) img.style.opacity='1';
});

/* ═══════════════════════════════════════════════════════════════
   CREATIVE ENHANCEMENT PACK v3 – Extra Animations & Interactions
   ═══════════════════════════════════════════════════════════════ */

/* ── A. Cursor Trail Dots ─────────────────────────────────────── */
(function initCursorTrail() {
  if (window.matchMedia('(hover:none)').matches) return;
  const dots = Array.from({length:6}, (_,i) => qs(`#ct${i}`)).filter(Boolean);
  if (!dots.length) return;

  const history = Array(dots.length).fill({x:0, y:0});
  let mx = 0, my = 0;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function loop() {
    // Shift history
    history.unshift({x: mx, y: my});
    history.length = dots.length;
    dots.forEach((d, i) => {
      const h = history[i] || history[history.length-1];
      d.style.left  = h.x + 'px';
      d.style.top   = h.y + 'px';
      const scale = 1 - i * 0.12;
      const op = (1 - i / dots.length) * 0.55;
      d.style.transform = `translate(-50%,-50%) scale(${scale})`;
      d.style.opacity   = op;
    });
    requestAnimationFrame(loop);
  })();
})();

/* ── B. Word-Level Text Entrance (section titles – safe version) ── */
(function initSplitText() {
  qsa('.section-title').forEach(el => {
    // Only animate if no IntersectionObserver already applied
    if (el.dataset.animated) return;
    el.dataset.animated = '1';
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity .8s var(--ease-expo), transform .8s var(--ease-expo)';

    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
        obs.unobserve(el);
      }
    }, { threshold: 0.2 });
    obs.observe(el);
  });
})();

/* ── C. Marquee Mouse Interaction (speed up on hover) ─────────── */
(function initMarquee() {
  const inner = qs('#marquee-inner');
  if (!inner) return;
  inner.addEventListener('mouseenter', () => {
    inner.style.animationDuration = '60s';
  });
  inner.addEventListener('mouseleave', () => {
    inner.style.animationDuration = '28s';
  });
})();

/* ── D. 3D Tilt on Best Wedding Work hero card ────────────────── */
(function initBWTilt() {
  if (window.matchMedia('(hover:none)').matches) return;
  const card = qs('.bw-hero-card');
  if (!card) return;
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const rx = ((e.clientY - r.top)  / r.height - .5) * -8;
    const ry = ((e.clientX - r.left) / r.width  - .5) *  8;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px) scale(1.01)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
})();

/* ── E. 3D Tilt on portfolio items ────────────────────────────── */
(function initPortfolioTilt() {
  if (window.matchMedia('(hover:none)').matches) return;
  qsa('.portfolio-item').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top)  / r.height - .5) * -6;
      const ry = ((e.clientX - r.left) / r.width  - .5) *  6;
      card.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px) scale(1.01)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

/* ── F. Global Blob Parallax (scroll) ────────────────────────── */
(function initBlobParallax() {
  const blobs = qsa('.gblob');
  if (!blobs.length) return;
  const speeds = [0.05, -0.04, 0.07, -0.06];
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      blobs.forEach((b, i) => {
        b.style.transform = `translateY(${y * speeds[i % speeds.length]}px)`;
      });
      ticking = false;
    });
    ticking = true;
  }, {passive: true});
})();

/* ── G. Staggered portfolio re-animation on tab switch ─────────── */
(function patchPortfolioFilter() {
  // Re-apply tilt effect to newly visible items after filter
  const grid = qs('#portfolio-grid');
  if (!grid) return;
  const observer = new MutationObserver(() => {
    qsa('.portfolio-item:not(.hidden)', grid).forEach((card, i) => {
      card.style.animation = 'none';
      requestAnimationFrame(() => {
        card.style.animation = '';
        card.style.animationDelay = `${i * 0.055}s`;
      });
    });
  });
  observer.observe(grid, {subtree:true, attributeFilter:['class']});
})();

/* ── H. Hover glow spotlight following cursor inside cards ──────── */
(function initCardSpotlight() {
  qsa('.bw-card, .bw-side-card, .service-card, .portfolio-item, .about-img-frame, .reel-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
      const y = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
      card.style.background = `radial-gradient(circle at ${x}% ${y}%,rgba(201,168,76,.08) 0%,var(--bg-card) 55%)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });
})();

/* ── 22. Scroll To Top Button ───────────────────────────────── */
(function initScrollTop() {
  const btn = qs('#scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 800) btn.classList.add('show');
    else btn.classList.remove('show');
  }, { passive: true });
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ── 23. Scroll Velocity Skew (only applies to grid wrapper, not items) ── */
(function initScrollSkew() {
  const grid = document.querySelector('#portfolio-grid');
  let lastY = window.scrollY;
  let currentSkew = 0;
  
  function render() {
    const y = window.scrollY;
    const diff = y - lastY;
    const targetSkew = Math.min(Math.max(diff * 0.025, -1.8), 1.8);
    currentSkew += (targetSkew - currentSkew) * 0.08;
    
    if (grid) {
      if (Math.abs(currentSkew) > 0.04) {
        grid.style.transform = `skewY(${currentSkew.toFixed(2)}deg)`;
      } else {
        grid.style.transform = '';
        currentSkew = 0;
      }
    }
    lastY = y;
    requestAnimationFrame(render);
  }
  render();
})();

/* ── 24. Premium Hover Sound Effects ─────────────────────────── */
(function initHoverAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let ctx = null;

  function playTick() {
    if (!ctx) {
       try { ctx = new AudioContext(); } catch(e) { return; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);
    
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  }

  document.body.addEventListener('mouseenter', (e) => {
    if (e.target && e.target.closest && e.target.closest('a, button, .portfolio-item, .nav-link')) {
      playTick();
    }
  }, true);
})();

/* ── I. Active Nav Link Tracker (scroll-based) ─────────────────── */
(function initActiveNav() {
  const navLinks = qsa('.nav-link[href^="#"]');
  const sections = qsa('section[id]');
  if (!sections.length) return;
  
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const link = navLinks.find(l => l.getAttribute('href') === '#' + e.target.id);
        link?.classList.add('active');
      }
    });
  }, { threshold: 0.4 });
  
  sections.forEach(s => obs.observe(s));
})();

/* ── J. Reel Card 3D Tilt ───────────────────────────────────────── */
(function initReelTilt() {
  if (window.matchMedia('(hover:none)').matches) return;
  qsa('.reel-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top)  / r.height - .5) * -6;
      const ry = ((e.clientX - r.left) / r.width  - .5) *  6;
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px) scale(1.015)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

/* ── K. Lazy Image Blur-Up ──────────────────────────────────────── */
(function initLazyBlurUp() {
  qsa('img[loading="lazy"]').forEach(img => {
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'));
    }
  });
})();

/* ── L. About Image Kinetic Float ───────────────────────────────── */
(function initAboutFloat() {
  const frame = qs('.about-img-frame');
  if (!frame || window.matchMedia('(hover:none)').matches) return;
  
  let floatX = 0, floatY = 0, currentX = 0, currentY = 0;
  
  document.addEventListener('mousemove', e => {
    // Maps mouse position on page to subtle offset
    floatX = (e.clientX / window.innerWidth  - .5) * 12;
    floatY = (e.clientY / window.innerHeight - .5) * 8;
  });
  
  (function loop() {
    currentX += (floatX - currentX) * 0.04;
    currentY += (floatY - currentY) * 0.04;
    frame.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;
    requestAnimationFrame(loop);
  })();
})();

/* ── M. Process Step In-View Highlight ─────────────────────────── */
(function initProcessHighlight() {
  const steps = qsa('.process-step');
  if (!steps.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('in-view');
    });
  }, { threshold: 0.3 });
  steps.forEach(s => obs.observe(s));
})();

/* ── N. Contact Form Floating Labels ────────────────────────────── */
(function initFloatingLabels() {
  qsa('.contact-form .form-group').forEach(group => {
    const input = group.querySelector('input, select, textarea');
    const label = group.querySelector('label');
    if (!input || !label) return;
    // Ensure label comes after input for CSS sibling selector
    if (group.querySelector('input, select, textarea') !== group.firstElementChild) {
      group.insertBefore(input, label);
    }
    // Add a space placeholder so :placeholder-shown works for the float trigger
    if (input.tagName !== 'SELECT' && !input.getAttribute('placeholder')) {
      input.setAttribute('placeholder', ' ');
    }
  });
})();

/* ── O. Scroll-Aware Marquee Direction ──────────────────────────── */
(function initScrollMarquee() {
  const inner = qs('#marquee-inner');
  if (!inner) return;
  let lastY = window.scrollY, scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    const diff = window.scrollY - lastY;
    if (Math.abs(diff) > 2) {
      inner.style.animationDuration = diff > 0 ? '18s' : '22s';
      inner.style.animationDirection = diff > 0 ? 'normal' : 'reverse';
    }
    scrollTimer = setTimeout(() => {
      inner.style.animationDuration = '28s';
      inner.style.animationDirection = 'normal';
    }, 400);
    lastY = window.scrollY;
  }, { passive: true });
})();

/* ── P. Cinematic Page Load Blur-In ─────────────────────────────── */
(function initPageBlurIn() {
  // Only apply if page is not already loaded
  if (document.readyState === 'complete') return;
  document.documentElement.style.filter = 'blur(6px)';
  document.documentElement.style.transition = 'filter 1.4s cubic-bezier(.16,1,.3,1)';
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.documentElement.style.filter = 'blur(0)';
      setTimeout(() => { document.documentElement.style.filter = ''; document.documentElement.style.transition = ''; }, 1500);
    }, 300);
  });
})();

/* ── Q. Dynamic Footer Year ─────────────────────────────────────── */
(function initFooterYear() {
  const yearSpan = qs('#footer-year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
})();

/* ── R. Form Validation & UI Feedback ───────────────────────────── */
(function initFormFeedback() {
  const form = qs('#contact-form');
  if (!form) return;
  const inputs = qsa('input, select, textarea', form);
  
  inputs.forEach(input => {
    input.addEventListener('blur', () => {
      if (input.checkValidity()) input.classList.add('valid');
      else input.classList.remove('valid');
    });
  });
})();



