/**
 * script.js — Kvitko A.F. Notary Office
 * Senior Frontend · Production-grade · No libraries
 *
 * Modules:
 *  1. StickyHeader         – adds .scrolled class + blur enhancement
 *  2. MobileMenu           – burger toggle with a11y
 *  3. SmoothNavigation     – intercepts anchor clicks for smooth scroll
 *  4. ActiveNavHighlight   – tracks scroll position → highlights nav link
 *  5. IntersectionReveal   – fade-in-up on scroll via Intersection Observer
 *  6. Accordion            – accessible expand/collapse for document lists
 *  7. ServiceTabs          – tab switcher for individuals / entities
 */

'use strict';

document.documentElement.classList.add('js');

/* ================================================================
   1. STICKY HEADER
   Adds a .scrolled class after first 20px of scroll
   to enhance the glassmorphism blur and shadow.
   ================================================================ */
(function StickyHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 20) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on init
}());


/* ================================================================
   2. MOBILE MENU
   Toggle burger / drawer with aria attributes and body lock.
   ================================================================ */
(function MobileMenu() {
  const burger     = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!burger || !mobileMenu) return;

  let isOpen = false;

  const open = () => {
    isOpen = true;
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // prevent background scroll
  };

  const close = () => {
    isOpen = false;
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  burger.addEventListener('click', () => {
    isOpen ? close() : open();
  });

  // Close on any mobile nav link click
  mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', close);
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) close();
  });
}());


/* ================================================================
   3. SMOOTH NAVIGATION
   Intercepts all [data-section] anchor clicks and performs
   smooth scroll with header offset compensation.
   ================================================================ */
(function SmoothNavigation() {
  const HEADER_HEIGHT = 72; // matches --header-height in CSS
  const EXTRA_OFFSET  = 8;  // slight visual breathing room

  const scrollTo = (targetId) => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const top = target.getBoundingClientRect().top
              + window.scrollY
              - HEADER_HEIGHT
              - EXTRA_OFFSET;

    window.scrollTo({ top, behavior: 'smooth' });
  };

  // All nav links (desktop, mobile, footer, buttons with data-section)
  document.querySelectorAll('[data-section], .nav-link, .mobile-nav-link, .footer-links a').forEach(el => {
    el.addEventListener('click', e => {
      const href = el.getAttribute('href') || '';
      const section = el.dataset.section || href.replace('#', '');
      if (!section) return;

      // Only intercept internal anchors
      if (href.startsWith('#') || el.dataset.section) {
        e.preventDefault();
        scrollTo(section);
      }
    });
  });
}());


/* ================================================================
   4. ACTIVE NAV HIGHLIGHT
   Uses IntersectionObserver on each section to update the
   active state of nav links as you scroll.
   ================================================================ */
(function ActiveNavHighlight() {
  const sections = document.querySelectorAll('main .section');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  // Map section id → nav link
  const linkMap = new Map();
  navLinks.forEach(link => {
    const section = link.getAttribute('href')?.replace('#', '');
    if (section) linkMap.set(section, link);
  });

  const setActive = (id) => {
    navLinks.forEach(l => l.classList.remove('active'));
    const active = linkMap.get(id);
    if (active) active.classList.add('active');
  };

  // Treat the first visible section (past 40% of viewport) as active
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActive(entry.target.id);
      }
    });
  }, {
    rootMargin: '-40% 0px -55% 0px', // trigger at middle band of viewport
    threshold: 0
  });

  sections.forEach(s => observer.observe(s));
}());


/* ================================================================
   5. INTERSECTION REVEAL ANIMATIONS
   Elements with class .reveal fade-in-up when they enter
   the viewport. Uses IntersectionObserver for performance.
   ================================================================ */
(function IntersectionReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  // Respect prefers-reduced-motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    // Skip animation — show everything immediately
    elements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target); // fire once, then detach
      }
    });
  }, {
    rootMargin: '0px 0px -60px 0px', // trigger 60px before element enters view
    threshold: 0.05
  });

  elements.forEach(el => observer.observe(el));
}());


/* ================================================================
   6. ACCORDION
   Fully accessible accordion for the Documents section.
   Manages aria-expanded, aria-hidden, and smooth max-height
   animation via CSS transitions.
   ================================================================ */
(function Accordion() {
  const triggers = document.querySelectorAll('.accordion-trigger');
  if (!triggers.length) return;

  triggers.forEach(trigger => {
    const item  = trigger.closest('.accordion-item');
    const panel = item?.querySelector('.accordion-panel');
    if (!panel) return;

    // Generate unique ids for a11y
    const id = 'accordion-panel-' + Math.random().toString(36).slice(2, 8);
    panel.id = id;
    trigger.setAttribute('aria-controls', id);

    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      // Optionally close other items (single-open mode)
      // Comment this block out to allow multiple open at once
      triggers.forEach(t => {
        if (t !== trigger) {
          const p = t.closest('.accordion-item')?.querySelector('.accordion-panel');
          t.setAttribute('aria-expanded', 'false');
          if (p) p.setAttribute('aria-hidden', 'true');
        }
      });

      // Toggle current
      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-hidden', 'true');
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        panel.setAttribute('aria-hidden', 'false');
      }
    });

    // Keyboard support: Enter / Space already handled by browser for buttons
  });
}());


/* ================================================================
   7. SERVICE TABS
   Switches between "Физические лица" and "Юридические лица"
   panels with a subtle cross-fade.
   ================================================================ */
(function ServiceTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels     = document.querySelectorAll('.services-panel');
  if (!tabButtons.length || !panels.length) return;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      // Update buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update panels with a fade
      panels.forEach(panel => {
        if (panel.id === `tab-${target}`) {
          panel.style.opacity = '0';
          panel.classList.add('active');
          // Trigger reflow then fade in
          requestAnimationFrame(() => {
            panel.style.transition = 'opacity 300ms ease';
            panel.style.opacity    = '1';
          });
        } else {
          panel.classList.remove('active');
          panel.style.opacity = '';
          panel.style.transition = '';
        }
      });

      // Re-trigger reveal animations for newly visible cards
      panel_reveal_reset(document.getElementById(`tab-${target}`));
    });
  });

  /**
   * Re-triggers reveal for cards inside a newly shown tab panel.
   * Cards that haven't been observed yet get observed;
   * those already revealed stay revealed.
   */
  const panel_reveal_reset = (panel) => {
    if (!panel) return;
    const cards = panel.querySelectorAll('.reveal:not(.revealed)');
    cards.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('revealed');
      }, i * 60); // stagger by 60ms per card
    });
  };
}());


/* ================================================================
   8. PHONE LINK FORMATTING (UX enhancement)
   Ensures phone numbers in plain text are clickable on mobile.
   ================================================================ */
(function PhoneEnhancement() {
  // Already handled via <a href="tel:..."> in markup.
  // This function is a no-op placeholder for future CMS content.
}());


/* ================================================================
   9. CURRENT YEAR IN FOOTER
   Keeps copyright year always current without server-side code.
   ================================================================ */
(function FooterYear() {
  const yearEl = document.querySelector('.footer-copy p');
  if (!yearEl) return;

  const current = new Date().getFullYear();
  // Replace hardcoded year if found
  yearEl.textContent = yearEl.textContent.replace(/\d{4}/, current);
}());


/* ================================================================
   11. PERCHNI MODAL
   Загружает и отображает перечни документов в модальном окне.
   ================================================================ */
(function PerchniModal() {
  const modal = document.getElementById('perchniModal');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalDownload = document.getElementById('modalDownload');
  const docCards = document.querySelectorAll('.doc-list-card');
  
  if (!modal || !docCards.length) return;

  let perchniData = null;
  let currentDocId = null;

  // Загрузить данные перечней при инициализации
  const loadPerchniData = async () => {
    // Try fetch first (works when served over http/https)
    try {
      const response = await fetch('data/perchni.json');
      if (response && response.ok) {
        perchniData = await response.json();
        console.log('✓ Perchni data loaded via fetch:', perchniData.perchni.length, 'items');
        return;
      }
      throw new Error(response ? `HTTP ${response.status}` : 'No response');
    } catch (error) {
      // Fallback: try inline JSON embedded in the page (works for file://)
      try {
        const inline = document.getElementById('perchni-data');
        if (inline && inline.textContent.trim()) {
          perchniData = JSON.parse(inline.textContent);
          console.log('✓ Perchni data loaded from inline JSON:', perchniData.perchni.length, 'items');
          return;
        }
      } catch (e) {
        console.error('✗ Error parsing inline perchni data:', e);
      }
      console.error('✗ Error loading perchni data via fetch:', error);
    }
  };

  const openModal = (docId) => {
    if (!perchniData) {
      console.warn('⚠ Perchni data not loaded yet');
      return;
    }

    console.log('Trying to open modal for docId:', docId);
    const perchni = perchniData.perchni.find(p => String(p.id) === String(docId));
    if (!perchni) {
      console.warn('⚠ Perchni not found for docId:', docId);
      return;
    }

    // Заполнить содержимое модали
    document.getElementById('modalNum').textContent = perchni.num;
    document.getElementById('modalTitle').textContent = perchni.title;
    
    const listContainer = document.getElementById('modalList');
    listContainer.innerHTML = '';
    perchni.items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      listContainer.appendChild(li);
    });

    // Сохранить текущий ID для загрузки файла
    currentDocId = docId;

    // Показать модаль
    console.log('Showing modal...');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const downloadDoc = () => {
    if (!currentDocId) {
      console.warn('⚠ No document selected for download');
      return;
    }
    
    const fileName = `${currentDocId}.docx`;
    const filePath = `docs/${fileName}`;
    
    // Используем fetch для более надежной загрузки файла
    fetch(filePath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Создаем URL для blob и скачиваем
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('✓ File downloaded:', fileName);
      })
      .catch(error => {
        console.error('✗ Error downloading file:', error);
        alert('Ошибка при скачивании файла. Попробуйте позже.');
      });
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // Обработчики событий
  docCards.forEach(card => {
    card.addEventListener('click', () => {
      const docId = card.dataset.docId;
      console.log('Doc card clicked with docId:', docId);
      openModal(docId);
    });

    // Клавиатура: Enter или Space
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const docId = card.dataset.docId;
        openModal(docId);
      }
    });
  });

  // Закрыть по кнопке
  if (modalClose) modalClose.addEventListener('click', closeModal);

  // Закрыть по клику на оверлей
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

  // Скачать документ
  if (modalDownload) modalDownload.addEventListener('click', downloadDoc);

  // Закрыть на Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });

  // Загрузить данные при загрузке страницы
  loadPerchniData();
}());


/* ================================================================
   12. CREDENTIALS GALLERY MODAL
   Просмотр дипломов и сертификатов в полном размере
   ================================================================ */
(function CredentialsGallery() {
  const credentialModal = document.getElementById('credentialModal');
  const credentialOverlay = document.getElementById('credentialOverlay');
  const credentialClose = document.getElementById('credentialClose');
  const credentialImage = document.getElementById('credentialImage');
  const viewButtons = document.querySelectorAll('.credential-view-btn');
  
  if (!credentialModal || !viewButtons.length) return;

  const openModal = (imageSrc, imageTitle) => {
    credentialImage.src = imageSrc;
    credentialImage.alt = imageTitle;
    credentialModal.classList.add('open');
    credentialModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    credentialModal.classList.remove('open');
    credentialModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // Обработчики кнопок просмотра
  viewButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const imageSrc = btn.dataset.image;
      const imageTitle = btn.dataset.title;
      openModal(imageSrc, imageTitle);
    });

    // Клавиатура поддержка
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const imageSrc = btn.dataset.image;
        const imageTitle = btn.dataset.title;
        openModal(imageSrc, imageTitle);
      }
    });
  });

  // Закрыть по кнопке
  if (credentialClose) credentialClose.addEventListener('click', closeModal);

  // Закрыть по клику на оверлей
  if (credentialOverlay) credentialOverlay.addEventListener('click', closeModal);

  // Закрыть на Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && credentialModal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });
}());

