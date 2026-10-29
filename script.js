
(function () {
  const supportsAnimation =
    typeof Animation !== 'undefined' ||
    (window.Element && Element.prototype.animate);

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const isTouchDevice =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Scroll reveal
  const sections = document.querySelectorAll('.scroll-section');

  if (
    prefersReducedMotion ||
    isTouchDevice ||
    typeof IntersectionObserver === 'undefined'
  ) {
    sections.forEach(section => {
      section.classList.add('visible');
    });
  } else {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    sections.forEach(section => observer.observe(section));
  }

  // Mouse spotlight
  const spotlight = document.querySelector('.spotlight');

  if (spotlight && !isTouchDevice && !prefersReducedMotion) {
    document.addEventListener('mousemove', event => {
      spotlight.style.setProperty('--mouse-x', `${event.clientX}px`);
      spotlight.style.setProperty('--mouse-y', `${event.clientY}px`);
      spotlight.style.opacity = '0.5';
    });
  }

  // Reading progress bar
  const progressBar = document.querySelector('.reading-progress-bar');

  function updateProgress() {
    if (!progressBar) return;

    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    const progress = scrollableHeight > 0
      ? (window.scrollY / scrollableHeight) * 100
      : 0;

    progressBar.style.width = `${progress}%`;
  }

  window.addEventListener('scroll', updateProgress, {
    passive: true
  });

  updateProgress();

  // Navigation
  const navButtons = document.querySelectorAll('.nav-button');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.section;
      const target = document.getElementById(targetId);

      if (target) {
        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Active navigation state
  function updateActiveNav() {
    let currentSection = '';

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();

      if (rect.top <= 150 && rect.bottom > 150) {
        currentSection = section.id;
      }
    });

    navButtons.forEach(button => {
      const isActive = button.dataset.section === currentSection;

      button.classList.toggle('active', isActive);

      if (isActive) {
        button.setAttribute('aria-current', 'location');
      } else {
        button.removeAttribute('aria-current');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, {
    passive: true
  });

  updateActiveNav();

  // Animated name reveal
  const nameText = document.querySelector('.name-text');

  if (nameText && supportsAnimation && !prefersReducedMotion) {
    const name = nameText.textContent.trim();
    const words = name.split(/\s+/);

    nameText.textContent = '';

    words.forEach((word, index) => {
      const span = document.createElement('span');

      span.textContent = word;
      span.className = 'name-word';
      span.style.animationDelay = `${index * 120}ms`;

      nameText.appendChild(span);
    });
  }

  // Remove unwanted floating skills marquee
  document.querySelectorAll('.marquee').forEach(element => {
    element.remove();
  });

  // Remove any remaining role animation element
  document.querySelectorAll('.terminal-role').forEach(element => {
    element.remove();
  });

  // Smooth scrolling for in-page links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
      const targetId = anchor.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);

      if (target) {
        event.preventDefault();

        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start'
        });
      }
    });
  });
})();
