(function() {
  // Progressive enhancement: check if IntersectionObserver is available
  if (typeof IntersectionObserver === 'undefined') {
    // Show everything immediately if IntersectionObserver not supported
    document.querySelectorAll('.scroll-section').forEach(section => {
      section.classList.add('visible');
    });
    return;
  }

  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.querySelectorAll('.scroll-section').forEach(section => {
      section.classList.add('visible');
    });
    document.querySelector('.reading-progress-bar')?.remove();
    document.querySelector('.sticky-aside')?.remove();
    return;
  }

  // Scroll reveal using IntersectionObserver
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.3
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Stop observing once revealed
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.scroll-section').forEach(section => {
    observer.observe(section);
  });

  // Reading progress bar
  const progressBar = document.querySelector('.reading-progress-bar');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      progressBar.style.width = scrollPercent + '%';
    });
  }

  // Navigation highlighting and smooth scroll
  const navButtons = document.querySelectorAll('.nav-button');
  const sections = document.querySelectorAll('.scroll-section');

  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = button.getAttribute('data-section');
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

  // Update active navigation button on scroll
  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    if (current) {
      navButtons.forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('data-section') === current) {
          button.classList.add('active');
        }
      });
    }
  }, { passive: true });

  // Ensure accessibility: focus styles and keyboard interactions
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const targetId = href.substring(1);
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        e.preventDefault();
        targetSection.scrollIntoView({
          behavior: 'smooth'
        });

        // Focus management for accessibility
        targetSection.setAttribute('tabindex', '-1');
        targetSection.focus({
          preventScroll: true
        });
      }
    });
  });
})();