(function() {
  'use strict';

  // Real-time Manila clock
  function updateClock() {
    const clockElement = document.querySelector('.status-clock');
    if (!clockElement) return;

    const now = new Date();
    const options = {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };

    clockElement.textContent = new Intl.DateTimeFormat('en-PH', options).format(now);
  }

  // Start clock immediately and update every second
  updateClock();
  setInterval(updateClock, 1000);

  // Intersection Observer for scroll animations
  function initScrollAnimations() {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('.section');
    sections.forEach(section => observer.observe(section));
  }

  // Intersection Observer for nav active state
  function initNavActiveState() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

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
              link.focus({ preventScroll: true });
            }
          });
        }
      });
    }, observerOptions);

    const activeId = navLinks[0] ? navLinks[0].getAttribute('href').slice(1) : 'objective';
    document.getElementById(activeId)?.classList.add('visible');

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

  // Copy email to clipboard
  function initCopyEmail() {
    const copyBtn = document.querySelector('.copy-btn');
    if (!copyBtn) return;

    const emailElement = document.querySelector('.footer-email');
    const originalText = copyBtn.textContent;

    copyBtn.addEventListener('click', async () => {
      const email = emailElement?.textContent.trim();

      if (!email) return;

      try {
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = 'Copied';
        copyBtn.setAttribute('aria-label', 'Email copied');

        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.setAttribute('aria-label', 'Copy email');
        }, 1500);
      } catch (err) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = email;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
          document.execCommand('copy');
          copyBtn.textContent = 'Copied';
          copyBtn.setAttribute('aria-label', 'Email copied');

          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.setAttribute('aria-label', 'Copy email');
          }, 1500);
        } catch (fallbackErr) {
          console.error('Failed to copy email:', fallbackErr);
        }

        document.body.removeChild(textarea);
      }
    });
  }

  // Respect prefers-reduced-motion
  function init() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      initScrollAnimations();
      initNavActiveState();
    }

    initCopyEmail();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();