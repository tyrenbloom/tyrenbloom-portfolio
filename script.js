(function() {
  'use strict';

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }

  window.addEventListener('pageshow', () => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  });

  // ============================================
  // GSAP ANIMATION SETUP
  // ============================================
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initNativeHeroTextReveal() {
    const heroTitle = document.querySelector('.hero h1[data-staggered-text="words"]');
    if (!heroTitle) return;
    if (heroTitle.dataset.staggeredReady === 'true') return;

    const words = heroTitle.textContent.trim().split(/\s+/);
    heroTitle.innerHTML = words.map((word, index) => `<span class="staggered-word" style="--stagger-index: ${index}">${word}</span>`).join('');
    heroTitle.dataset.staggeredReady = 'true';
    heroTitle.querySelectorAll('.staggered-word').forEach((word, index) => {
      if (prefersReducedMotion) {
        word.classList.add('is-visible');
      } else {
        window.setTimeout(() => word.classList.add('is-visible'), 250 + (index * 45));
      }
      word.style.animationDelay = `${index * 45}ms`;
    });
  }

  function initHeaderState() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const update = () => {
      header.classList.toggle('scrolled', window.scrollY > 24);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  // ============================================
  // 1. PARTICLE NETWORK BACKGROUND
  // ============================================
  // ============================================
  // 2. HERO TEXT REVEAL ANIMATION
  // ============================================
  function initHeroTextReveal() {
    if (prefersReducedMotion) return;

    const heroTitle = document.querySelector('.hero h1');
    const heroIntro = document.querySelector('.hero-intro');
    const heroLink = document.querySelector('.hero-link');
    const heroFootnote = document.querySelector('.hero-footnote');
    const heroActions = document.querySelector('.hero-actions');
    const monogram = document.querySelector('.profile-monogram');

    if (!heroTitle) {
      return;
    }

    if (heroTitle.dataset.staggeredText === 'words' && heroTitle.dataset.staggeredReady !== 'true') {
      const words = heroTitle.textContent.trim().split(/\s+/);
      heroTitle.innerHTML = words.map((word) => `<span class="staggered-word">${word}</span>`).join('');
      gsap.fromTo(heroTitle.querySelectorAll('.staggered-word'),
        { opacity: 0, y: '0.7em' },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out', stagger: 0.045, delay: 0.25 }
      );
    }

    const surnameSpan = heroTitle.dataset.staggeredText === 'words' ? null : heroTitle.querySelector('span');

    if (heroTitle && heroTitle.dataset.staggeredText !== 'words') {
      gsap.fromTo(heroTitle, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.4 });
    }

    if (surnameSpan) {
      gsap.fromTo(surnameSpan, { x: 30, skewX: -15, opacity: 0 }, { x: 0, skewX: 0, opacity: 1, duration: 0.9, ease: 'back.out(1.7)', delay: 0.9 });
    }

    // Animate monogram
    if (monogram) {
      gsap.fromTo(monogram,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.8 }
      );
    }

    // Fade in other hero content
    if (heroIntro) {
      gsap.fromTo(heroIntro,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 1.1 }
      );
    }

    if (heroActions) {
      gsap.fromTo(heroActions.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.1, delay: 1.3 }
      );
    }

    if (heroLink) {
      gsap.fromTo(heroLink,
        { x: 20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 1.5 }
      );
    }

    if (heroFootnote) {
      gsap.fromTo(heroFootnote,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 1.7 }
      );
    }
  }

  // ============================================
  // 3. 3D CARD HOVER EFFECT
  // ============================================
  function init3DCardEffect() {
    if (prefersReducedMotion) return;

    const projectCard = document.querySelector('.project-card');
    if (!projectCard) return;

    projectCard.addEventListener('mousemove', (e) => {
      const rect = projectCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 25;
      const rotateY = (centerX - x) / 25;

      gsap.to(projectCard, {
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    projectCard.addEventListener('mouseleave', () => {
      gsap.to(projectCard, {
        transform: 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)',
        duration: 0.8,
        ease: 'elastic.out(1, 0.5)'
      });
    });
  }

  // ============================================
  // 4. SKILLS GRID STAGGER REVEAL
  // ============================================
  function initSkillsGridReveal() {
    if (prefersReducedMotion) return;

    const skillsGrid = document.querySelector('.skills-grid');
    if (!skillsGrid) return;

    const skillCards = document.querySelectorAll('.skill-card');

    gsap.fromTo(skillCards, {
      y: 80,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: skillsGrid,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    });

    // Animate skill indices
    gsap.fromTo('.skill-index',
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, stagger: 0.05, scrollTrigger: {
        trigger: skillsGrid,
        start: 'top 85%'
      }}
    );
  }

  // ============================================
  // 5. CONTACT SECTION PARALLAX
  // ============================================
  function initContactParallax() {
    if (prefersReducedMotion) return;

    const contactSection = document.querySelector('.contact-section');
    if (!contactSection) return;

    // Parallax for background elements
    const backgroundElements = contactSection.querySelectorAll('*:not(.contact-inner)');
    backgroundElements.forEach(el => {
      gsap.to(el, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: contactSection,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5
        }
      });
    });
  }

  // ============================================
  // 6. MAGNETIC NAV
  // ============================================
  function initMagneticNav() {
    if (prefersReducedMotion) return;

    const magneticLinks = document.querySelectorAll('.nav-link');

    magneticLinks.forEach(link => {
      link.addEventListener('mousemove', (e) => {
        const rect = link.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        const force = x / 25;

        gsap.to(link, {
          x: force,
          y: -y / 15,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      link.addEventListener('mouseleave', () => {
        gsap.to(link, {
          x: 0,
          y: 0,
          duration: 0.8,
          ease: 'elastic.out(1, 0.5)'
        });
      });
    });
  }

  // ============================================
  // 7. PARALLAX FRAMES
  // ============================================
  function initParallaxFrames() {
    if (prefersReducedMotion) return;

    const sections = document.querySelectorAll('.section');

    sections.forEach(section => {
      const frame = section.querySelector('.section-heading');
      if (!frame) return;

      gsap.to(frame, {
        xPercent: -5,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5
        }
      });
    });
  }

  // ============================================
  // COPY EMAIL TO CLIPBOARD
  // ============================================
  function initCopyEmail() {
    const copyBtn = document.querySelector('.copy-btn');
    if (!copyBtn) return;

    const emailElement = document.querySelector('.contact-email');
    const originalText = copyBtn.textContent;

    copyBtn.addEventListener('click', async () => {
      const email = emailElement?.dataset.email;

      if (!email) return;

      try {
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        copyBtn.setAttribute('aria-label', 'Email copied');

        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.classList.remove('copied');
          copyBtn.setAttribute('aria-label', 'Copy email');
        }, 1500);
      } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = email;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
          document.execCommand('copy');
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('copied');

          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
          }, 1500);
        } catch (fallbackErr) {
          console.error('Failed to copy email:', fallbackErr);
        }

        document.body.removeChild(textarea);
      }
    });
  }

  // ============================================
  // NAV ACTIVE STATE
  // ============================================
  function initNavActiveState() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section, .contact-section');

    if (navLinks.length === 0 || sections.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -40% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute('id');
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');

              // Add magnetic effect when active
              gsap.to(link, { x: 0, duration: 0.5 });
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    // Handle URL hash on load
    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById(hash)) {
      setTimeout(() => {
        window.scrollTo({
          top: document.getElementById(hash).offsetTop - 120,
          behavior: 'smooth'
        });
      }, 100);
    }
  }

  // ============================================
  // INFO CARDS ANIMATIONS
  // ============================================
  function initInfoCardsReveal() {
    if (prefersReducedMotion) return;

    const educationList = document.querySelector('.education-list');
    const facts = document.querySelector('.facts');

    if (educationList) {
      const items = educationList.querySelectorAll('article');
      gsap.fromTo(items, {
        x: -40,
        opacity: 0
      }, {
        x: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: educationList,
          start: 'top 85%'
        }
      });
    }

    if (facts) {
      const factItems = facts.querySelectorAll('.fact-item');
      gsap.fromTo(factItems, {
        y: 40,
        opacity: 0
      }, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.06,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: facts,
          start: 'top 85%'
        }
      });
    }
  }

  // ============================================
  // FOOTER ANIMATION
  // ============================================
  function initFooterAnimation() {
    if (prefersReducedMotion) return;

    const footer = document.querySelector('.site-footer');
    if (!footer) return;

    gsap.fromTo(footer,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: footer,
          start: 'top 95%'
        }
      }
    );
  }

  // ============================================
  // DYNAMIC FOOTER YEAR
  // ============================================
  function initFooterYear() {
    const el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // ============================================

  // ============================================
  // SCROLL PROGRESS BAR
  // ============================================
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      bar.style.transform = 'scaleX(' + progress + ')';
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  // ============================================
  // SECTION RULE LINE-DRAW
  // ============================================
  function initSectionRuleDraw() {
    if (prefersReducedMotion) return;
    const rules = document.querySelectorAll('.section-rule');
    rules.forEach(rule => {
      gsap.fromTo(rule,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.9, ease: 'power2.out',
          scrollTrigger: { trigger: rule, start: 'top 85%' } }
      );
    });
  }

  // ============================================
  // HERO TYPEWRITER EYEBROW
  // ============================================
  function initTypewriter() {
    if (prefersReducedMotion) return;
    const eyebrow = document.querySelector('.hero .eyebrow');
    if (!eyebrow) return;
    const line = eyebrow.querySelector('.eyebrow-line');
    const fullText = 'Computer Science student \u00b7 Bulacan, PH';
    eyebrow.textContent = '';
    if (line) eyebrow.appendChild(line);
    const textSpan = document.createElement('span');
    textSpan.className = 'typewriter-text';
    eyebrow.appendChild(textSpan);
    eyebrow.classList.add('typing');
    let i = 0;
    const step = () => {
      if (i <= fullText.length) {
        textSpan.textContent = fullText.slice(0, i);
        i++;
        setTimeout(step, 40);
      } else {
        setTimeout(() => eyebrow.classList.remove('typing'), 900);
      }
    };
    setTimeout(step, 700);
  }

  // ============================================
  // CURSOR FOLLOWER (desktop)
  // ============================================
  function initCursorFollower() {
    const dot = document.getElementById('cursor-dot');
    if (!dot || prefersReducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    window.addEventListener('mousemove', (e) => {
      dot.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      dot.classList.add('is-active');
    }, { passive: true });
    window.addEventListener('mouseleave', () => dot.classList.remove('is-active'));
    const hoverTargets = document.querySelectorAll('a, button, .skill-card, .project-card, .contact-socials a');
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => dot.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => dot.classList.remove('cursor-hover'));
    });
  }

  // ============================================
  // SKILL CARD GLOW TRACKING
  // ============================================
  function initSkillGlow() {
    if (prefersReducedMotion) return;
    document.querySelectorAll('.skill-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    });
  }

  // ============================================
  // BUTTON RIPPLE
  // ============================================
  function initRipples() {
    const targets = document.querySelectorAll('.button, .copy-btn, .contact-socials a, .hero-link, .coming-soon-link');
    targets.forEach(el => {
      el.addEventListener('click', (e) => {
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        el.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
      });
    });
  }

  // INITIALIZATION
  // ============================================
  function init() {
    initNativeHeroTextReveal();
    const hasLoadedScripts = typeof gsap !== 'undefined' && gsap.registerPlugin;

    initScrollProgress();
    initHeaderState();
    initNavActiveState();
    initCopyEmail();
    initFooterYear();
    initRipples();

    if (!hasLoadedScripts || prefersReducedMotion) return;

    const startNonCriticalAnimations = () => {
      initHeroTextReveal();
      initParallaxFrames();
      initSectionRuleDraw();
      initTypewriter();
      initCursorFollower();
      initSkillGlow();
      init3DCardEffect();
      initSkillsGridReveal();
      initInfoCardsReveal();
      initFooterAnimation();
      initMagneticNav();
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(startNonCriticalAnimations, { timeout: 1200 });
    } else {
      window.setTimeout(startNonCriticalAnimations, 800);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();