/* WAAN interaction adaptation: sticky navigation, MeanMenu, Slick, and GSAP. */
(function () {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = window.jQuery;
  const loader = document.getElementById('preloader');
  if (loader && !reducedMotion.matches) {
    loader.style.display = 'block';
    window.addEventListener('load', () => {
      loader.animate([{opacity: 1}, {opacity: 0}], {duration: 200}).finished
        .then(() => { loader.hidden = true; }).catch(() => { loader.hidden = true; });
    }, {once: true});
    setTimeout(() => { loader.hidden = true; }, 1500);
  }

  const header = document.querySelector('.header-area');
  const sticky = document.getElementById('header-sticky');
  const topButton = document.querySelector('.back-to-top');
  function syncScroll() {
    const stuck = window.scrollY > 200;
    sticky?.classList.toggle('sticky-menu', stuck);
    header?.classList.toggle('is-stuck', stuck);
    if (topButton) topButton.hidden = window.scrollY < 700;
  }
  window.addEventListener('scroll', syncScroll, {passive: true});
  syncScroll();
  topButton?.addEventListener('click', () => {
    window.scrollTo({top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    document.querySelector('.wordmark')?.focus({preventScroll: true});
  });

  if ($?.fn.meanmenu) {
    $('#mobile-menu').meanmenu({meanMenuContainer: '.mobile-menu', meanScreenWidth: '992', meanMenuClose: '×'});
    const enhanceMenu = () => {
      const toggle = document.querySelector('.meanmenu-reveal');
      const menu = document.querySelector('.mean-nav > ul');
      if (!toggle || !menu) return;
      menu.id = 'mobile-navigation-items';
      const open = getComputedStyle(menu).display !== 'none';
      toggle.setAttribute('role', 'button');
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      toggle.setAttribute('aria-controls', menu.id);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('href', '#mobile-navigation-items');
      if (!menu.parentElement.querySelector('.mobile-github')) {
        const item = document.createElement('li');
        item.className = 'mobile-github';
        const link = document.createElement('a');
        link.href = 'https://github.com/lahcennh3-jpg';
        link.textContent = 'GitHub';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        item.append(link);menu.append(item);
      }
    };
    enhanceMenu();
    const mobileContainer = document.querySelector('.mobile-menu');
    const observer = new MutationObserver(() => { enhanceMenu(); });
    // Observe plugin-created/removed nodes and visibility changes, but not ARIA changes.
    observer.observe(mobileContainer, {childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class']});
    mobileContainer.addEventListener('keydown', (event) => {
      if (event.key === ' ' && event.target.matches('.meanmenu-reveal')) {event.preventDefault(); event.target.click();}
      if (event.key === 'Escape') {
        const toggle = mobileContainer.querySelector('.meanmenu-reveal');
        if (toggle?.getAttribute('aria-expanded') === 'true') {toggle.click();toggle.focus();}
      }
    });
  }

  const evidenceCarousel = document.querySelector('.testimonial-active');
  if (evidenceCarousel && $?.fn.slick) {
    $(evidenceCarousel).slick({dots: true, arrows: false, autoplay: false, infinite: false,
      speed: reducedMotion.matches ? 0 : 350, slidesToShow: 3, slidesToScroll: 1,
      accessibility: true, responsive: [{breakpoint: 1024, settings: {slidesToShow: 2}}, {breakpoint: 768, settings: {slidesToShow: 1}}]});
    const prev = document.querySelector('[data-evidence-prev]');
    const next = document.querySelector('[data-evidence-next]');
    prev?.addEventListener('click', () => $(evidenceCarousel).slick('slickPrev'));
    next?.addEventListener('click', () => $(evidenceCarousel).slick('slickNext'));
    function syncCarousel() {
      const state = $(evidenceCarousel).slick('getSlick');
      if (prev) prev.disabled = state.currentSlide === 0;
      if (next) next.disabled = state.currentSlide >= state.slideCount - state.options.slidesToShow;
    }
    $(evidenceCarousel).on('afterChange breakpoint', syncCarousel);syncCarousel();
  }

  const heroCarousel=document.querySelector('[data-hero-carousel]');
  if(heroCarousel && $?.fn.slick) {
    $(heroCarousel).slick({dots:false,arrows:false,autoplay:false,infinite:false,fade:true,
      speed:reducedMotion.matches?0:350,slidesToShow:1,slidesToScroll:1,adaptiveHeight:true,accessibility:true});
    const prev=document.querySelector('[data-hero-prev]');
    const next=document.querySelector('[data-hero-next]');
    const label=document.querySelector('[data-hero-slide-status]');
    function syncHero() {
      const state=$(heroCarousel).slick('getSlick');
      if(prev)prev.disabled=state.currentSlide===0;
      if(next)next.disabled=state.currentSlide===state.slideCount-1;
      if(label)label.textContent=`Slide ${state.currentSlide+1} of ${state.slideCount}`;
    }
    prev?.addEventListener('click',()=>$(heroCarousel).slick('slickPrev'));
    next?.addEventListener('click',()=>$(heroCarousel).slick('slickNext'));
    $(heroCarousel).on('afterChange',syncHero);syncHero();
  }

  document.querySelectorAll('[data-filter-region]').forEach(region => {
    const items = Array.from(region.querySelectorAll('[data-filter-item]'));
    const buttons = region.querySelectorAll('[data-category]');
    const search = region.querySelector('input[type="search"]');
    const selects = Array.from(region.querySelectorAll('select'));
    const count = region.querySelector('[data-result-count]');
    const noResults = region.querySelector('[data-no-results]');
    let category = '*';
    function filter() {
      const term = (search?.value || '').trim().toLocaleLowerCase();
      let visible = 0;
      for (const item of items) {
        const categories = (item.dataset.categories || '').split(' ');
        const haystack = (item.dataset.search || item.textContent).toLocaleLowerCase();
        const match = (category === '*' || categories.includes(category)) &&
          selects.every(select => select.value === '*' ||
            (item.dataset[select.dataset.filterKey || 'categories'] || '').split(' ').includes(select.value)) &&
          (!term || term.split(/\s+/).every(word => haystack.includes(word)));
        item.hidden = !match;
        if (match) visible++;
      }
      if (count) count.textContent = `${visible} of ${items.length} ${region.dataset.noun || 'records'}`;
      if (noResults) noResults.hidden = visible !== 0;
    }
    buttons.forEach(button => button.addEventListener('click', () => {
      category = button.dataset.category;
      buttons.forEach(other => {
        const active = other === button;
        other.classList.toggle('active', active);other.setAttribute('aria-pressed', String(active));
      });filter();
    }));
    search?.addEventListener('input', filter);
    selects.forEach(select => select.addEventListener('change', filter));
    filter();
  });

  document.querySelectorAll('[data-contact-form]').forEach(form => {
    // Native POST still works without JavaScript; the provider supplies its default thank-you page.
    if (!/^https?:$/.test(window.location.protocol)) return;
    const returnUrl = new URL(form.dataset.thankYouPath, window.location.href);
    if (returnUrl.origin !== window.location.origin) return;
    for (const [name, value] of [['_next', returnUrl.href], ['_url', window.location.origin + window.location.pathname]]) {
      const field = document.createElement('input');
      field.type = 'hidden';field.name = name;field.value = value;
      form.append(field);
    }
  });

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      // Preserve WAAN's directional fade and line-reveal feel without its member-only SplitText plugin.
      document.querySelectorAll('.fade-slide, .move-line-3d').forEach(item => {
        gsap.from(item, {y: item.classList.contains('move-line-3d') ? 22 : 30,
          opacity: 0, duration: .65, ease: 'power2.out', clearProps: 'all',
          scrollTrigger: {trigger: item, start: 'top 95%', once: true}});
      });
    });
  }
})();
