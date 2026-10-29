(function() {
  // Progressive enhancement: check if capabilities are available
  const supportsAnimation = typeof Animation !== 'undefined' || (window.Element && Element.prototype.animate);
  if (!supportsAnimation) {
    document.querySelectorAll('.scroll-section').forEach(section => {
      section.classList.add('visible');
    });
    document.querySelector('.timeline-marker')?.remove();
    document.querySelector('.spotlight')?.remove();
    document.querySelector('.marquee')?.remove();
    return;
  }

  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (prefersReducedMotion || isTouchDevice) {
    document.querySelectorAll('.scroll-section').forEach(section => {
      section.classList.add('visible');
    });
    document.querySelector('.timeline-marker')?.remove();
    document.querySelector('.spotlight')?.remove();
    document.querySelector('.marquee')?.remove();
    document.querySelectorAll('.name-text span').forEach(span => {
      span.style.transform = 'translateY(0)';
      span.style.opacity = '1';
    });
    document.querySelector('.terminal-role')?.remove();
    return;
  }

  // --- Mouse spotlight ---
  const spotlight = document.querySelector('.spotlight');
  if (spotlight && !isTouchDevice) {
    document.addEventListener('mousemove', (e) => {
      const x = e.clientX + 'px';
      const y = e.clientY + 'px';
      spotlight.style.setProperty('--mouse-x', x);
      spotlight.style.setProperty('--mouse-y', y);
      // Throttle opacity for performance
      if (Date.now() % 10 === 0) {
        spotlight.style.opacity = '0.5';
      }
    });
  }

  // --- Scroll reveal ---
  const scrollToReveal = {
    options: {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    },

    init() {
      if (typeof IntersectionObserver === 'undefined') {
        document.querySelectorAll('.scroll-section').forEach(section => {
          section.classList.add('visible');
        });
        this.animateTimeline();
        return;
      }

      this.observer = new IntersectionObserver(this.onEntry.bind(this), this.options);
      document.querySelectorAll('.scroll-section').forEach(section => {
        this.observer.observe(section);
      });
    },

    onEntry(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Animate timeline markers for this section
          const markers = entry.target.querySelectorAll('.timeline-marker');
          markers.forEach((marker, index) => {
            marker.style.transitionDelay = `${index * 100}ms`;
          });
        }
      });
    },

    animateTimeline() {
      document.querySelectorAll('.timeline-marker').forEach((marker, index) => {
        marker.style.transitionDelay = `${index * 200}ms`;
        setTimeout(() => {
          marker.style.transform = 'scale(1)';
        }, 100);
      });
    }
  };

  scrollToReveal.init();

  // --- Reading progress bar ---
  const progressBar = document.querySelector('.reading-progress-bar');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      progressBar.style.width = scrollPercent + '%';
    });
  }

  // --- Navigation with text scramble ---
  const navButtons = document.querySelectorAll('.nav-button');
  const chars = '!<>-_\\/[]{}—=+*^?#________';

  navButtons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      const text = this.getAttribute('data-section').charAt(0).toUpperCase() + this.getAttribute('data-section').slice(1);
      this.scramble(text);
    });

    button.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = this.getAttribute('data-section');
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        const top = targetSection.offsetTop - 80;
        window.scrollTo({
          top: top,
          behavior: 'smooth'
        });
      }
    });
  });

  NavButtonScramble.prototype.scramble = function(text) {
    if (!window.animate) return;

    const duration = 400;
    const element = this.querySelector('.nav-link-text');
    if (!element) return;

    element.textContent = text;
    const originalText = text;
    let iterations = 0;

    const interval = setInterval(() => {
      const charsOnly = text.split('');
      element.textContent = charsOnly
        .map((char, index) => {
          if (index + iterations < originalText.length) {
            return originalText[index + iterations];
          }
          return char.toUpperCase().charAt(0) === char.charAt(0) ? char : chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      iterations += 0.5;

      if (iterations >= originalText.length) {
        clearInterval(interval);
        element.textContent = originalText;
      }
    }, 16);
  };

  function NavButtonScramble() {
    // Helper to prototype methods
  }

  // Override nav button click for shake effect
  navButtons.forEach(button => {
    button.addEventListener('click', function() {
      this.style.transform = 'translateX(2px)';
      setTimeout(() => {
        this.style.transform = 'translateX(0)';
      }, 50);
    });
  });

  // --- Navigation active state ---
  const sections = document.querySelectorAll('.scroll-section');

  const updateActiveNav = () => {
    const scrollPosition = window.scrollY + 150;
    let current = '';

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height - 100) {
        current = section.getAttribute('id');
      }
    });

    navButtons.forEach(button => {
      button.classList.remove('active');
      if (button.getAttribute('data-section') === current) {
        button.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // --- Terminal role typing animation ---
  const terminalRole = document.querySelector('.terminal-role');
  if (terminalRole) {
    const role1 = 'Systems Analyst';
    const role2 = 'Junior Developer';
    let currentRole = role1;
    let charIndex = 0;
    let isDeleting = false;
    let loopCount = 0;

    function typeRole() {
      if (prefersReducedMotion) {
        terminalRole.textContent = 'Systems Analyst > Junior Developer > Systems Analyst';
        return;
      }

      const speed = isDeleting ? 50 : 80;

      if (!isDeleting && charIndex < currentRole.length) {
        terminalRole.textContent += currentRole.charAt(charIndex);
        charIndex++;
      } else if (isDeleting && charIndex > 0) {
        terminalRole.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
      } else if (charIndex >= currentRole.length) {
        // Pause at end
        isDeleting = true;
        loopCount++;
        setTimeout(typeRole, 1500);
        return;
      } else if (charIndex === 0) {
        isDeleting = false;
        currentRole = currentRole === role1 ? role2 : role1;
      }

      setTimeout(typeRole, speed);
    }

    // Start typing after name reveals
    setTimeout(typeRole, 1600);
  }

  // --- Name text mask reveal ---
  const nameText = document.querySelector('.name-text');
  if (nameText && supportsAnimation) {
    const name = nameText.textContent.trim();
    const words = name.split(' ');
    const wordElements = [];

    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.textContent = word;
      span.style.transitionDelay = `${index * 100}ms`;
      span.style.display = 'block';
      nameText.insertBefore(span, nameText.firstChild);
      wordElements.push(span);
    });

    wordElements.forEach((span, index) => {
      setTimeout(() => {
        span.addEventListener('transitionend', () => {
          // Subtle bounce effect
          span.animate([
            { transform: 'translateY(8px)', opacity: '0' },
            { transform: 'translateY(0)', opacity: '1' }
          ], {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
          });
        });
      }, index * 120);
    });
  }

  // --- Focus management for accessibility ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const targetId = href.substring(1);
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        const top = targetSection.offsetTop - 100;
        window.scrollTo({
          top: top,
          behavior: 'smooth'
        });

        targetSection.setAttribute('tabindex', '-1');
        targetSection.focus({
          preventScroll: true
        });
      }
    });
  });

  // --- Smooth scroll for nav buttons if text scramble isn't active ---
  navButtons.forEach(button => {
    if (!button.onclick) {
      button.addEventListener('click', (e) => {
        const targetId = button.getAttribute('data-section');
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
          const top = targetSection.offsetTop - 80;
          window.scrollTo({
            top: top,
            behavior: 'smooth'
          });

          targetSection.setAttribute('tabindex', '-1');
          targetSection.focus({
            preventScroll: true
          });
        }
      });
    }
  });

  // --- Show marquee after page loads ---
  const marquee = document.querySelector('.marquee');
  if (marquee) {
    setTimeout(() => {
      marquee.classList.add('show');
    }, 1000);
  }

  // --- Focus management for accessibility ---
          const top = targetSection.offsetTop - 80;
          window.scrollTo({
            top: top,
            behavior: 'smooth'
          });
        }
      });
    }
  });
})();