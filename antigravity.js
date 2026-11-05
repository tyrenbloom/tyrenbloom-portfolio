(function () {
  'use strict';

  const canvas = document.querySelector('.antigravity-canvas');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const particles = [];
  const particleCount = 50;
  const color = '#9BABAB';
  let width = 0;
  let height = 0;
  let ratio = 1;
  let animationFrame = 0;
  let lastTime = performance.now();

  function resize() {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    particles.length = 0;
    for (let index = 0; index < particleCount; index += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        size: 1.6 + Math.random() * 1.1
      });
    }
  }

  function draw(now) {
    const delta = Math.min((now - lastTime) / 1000, 1 / 30);
    lastTime = now;
    context.clearRect(0, 0, width, height);
    context.fillStyle = color;
    context.globalAlpha = 0.38;

    particles.forEach(function (particle) {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;

      if (particle.x < -4) particle.x = width + 4;
      if (particle.x > width + 4) particle.x = -4;
      if (particle.y < -4) particle.y = height + 4;
      if (particle.y > height + 4) particle.y = -4;

      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    });

    context.globalAlpha = 1;
    if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw(performance.now());

  window.addEventListener('pagehide', function () {
    cancelAnimationFrame(animationFrame);
  });
})();
