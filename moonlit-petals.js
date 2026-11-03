(function () {
  'use strict';

  const CONFIG = {
    colors: {
      base: '#06141B',
      branch: '#253745',
      petal: ['#4A5C6A', '#9BABAB', '#CCD0CF'],
      haze: '#11212D',
      overlay: '#06141B'
    },
    petalCount: 44,
    petalOpacity: [0.3, 0.65],
    fallSpeed: [2, 5],
    drift: 14,
    rotationSpeed: 0.00008,
    clusterOpacity: 0.82,
    clusterWidth: 0.34,
    blur: 1,
    maxDevicePixelRatio: 2,
    seed: 7
  };

  const canvas = document.querySelector('.moonlit-petals-canvas');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const random = createRandom(CONFIG.seed);
  let particles = [];
  let width = 0;
  let height = 0;
  let animationFrame = 0;
  let lastTime = 0;
  let isVisible = !document.hidden;
  let blossoms = [];

  function createRandom(seed) {
    let value = seed;
    return function () {
      value = (value * 1664525 + 1013904223) % 4294967296;
      return value / 4294967296;
    };
  }

  function range(values) {
    return values[0] + random() * (values[1] - values[0]);
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, CONFIG.maxDevicePixelRatio);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    createParticles();
    draw(0);
  }

  function createParticles() {
    particles = Array.from({ length: CONFIG.petalCount }, function () {
      return {
        x: random() * width,
        y: random() * height,
        size: range([1.2, 3.2]),
        speed: range(CONFIG.fallSpeed),
        drift: range([-CONFIG.drift, CONFIG.drift]),
        phase: random() * Math.PI * 2,
        rotation: random() * Math.PI * 2,
        rotationSpeed: range([-CONFIG.rotationSpeed, CONFIG.rotationSpeed]),
        opacity: range(CONFIG.petalOpacity),
        color: CONFIG.colors.petal[Math.floor(random() * CONFIG.colors.petal.length)]
      };
    });
    blossoms = Array.from({ length: 22 }, function () {
      return {
        x: random() - 0.28,
        y: random() - 0.36,
        size: range([3, 6]),
        color: CONFIG.colors.petal[Math.floor(random() * CONFIG.colors.petal.length)]
      };
    });
  }

  function drawBackground() {
    context.fillStyle = CONFIG.colors.base;
    context.fillRect(0, 0, width, height);

    const haze = context.createRadialGradient(
      width * 0.04, height * 0.08, 0,
      width * 0.04, height * 0.08, Math.max(width * 0.34, 260)
    );
    haze.addColorStop(0, 'rgba(37, 55, 69, 0.18)');
    haze.addColorStop(1, 'rgba(6, 20, 27, 0)');
    context.fillStyle = haze;
    context.fillRect(0, 0, width, height);
  }

  function drawBlossomCluster() {
    const clusterWidth = Math.min(width * CONFIG.clusterWidth, 380);
    const clusterHeight = clusterWidth * 0.72;
    const centerX = clusterWidth * 0.24;
    const centerY = clusterHeight * 0.38;

    context.save();
    context.globalAlpha = CONFIG.clusterOpacity;
    context.filter = 'blur(' + CONFIG.blur + 'px)';
    context.translate(0, 58);
    context.strokeStyle = CONFIG.colors.branch;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = Math.max(1, clusterWidth * 0.009);
    context.beginPath();
    context.moveTo(-12, clusterHeight * 0.95);
    context.quadraticCurveTo(clusterWidth * 0.08, clusterHeight * 0.62, centerX, centerY);
    context.quadraticCurveTo(clusterWidth * 0.42, clusterHeight * 0.08, clusterWidth * 0.78, clusterHeight * 0.02);
    context.moveTo(clusterWidth * 0.18, clusterHeight * 0.58);
    context.quadraticCurveTo(clusterWidth * 0.32, clusterHeight * 0.48, clusterWidth * 0.5, clusterHeight * 0.52);
    context.stroke();

    blossoms.forEach(function (blossom) {
      const x = centerX + blossom.x * clusterWidth * 0.95;
      const y = centerY + blossom.y * clusterHeight * 1.3;
      context.fillStyle = blossom.color;
      for (let petal = 0; petal < 5; petal += 1) {
        context.save();
        context.translate(x, y);
        context.rotate(petal * (Math.PI * 2 / 5));
        context.beginPath();
        context.ellipse(0, -blossom.size * 0.52, blossom.size * 0.22, blossom.size * 0.44, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
      context.fillStyle = CONFIG.colors.base;
      context.beginPath();
      context.arc(x, y, blossom.size * 0.24, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }

  function drawVignette() {
    const vignette = context.createRadialGradient(
      width * 0.5, height * 0.45, Math.min(width, height) * 0.18,
      width * 0.5, height * 0.45, Math.max(width, height) * 0.72
    );
    vignette.addColorStop(0, 'rgba(6, 20, 27, 0.42)');
    vignette.addColorStop(1, 'rgba(6, 20, 27, 0.68)');
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);
  }

  function drawPetal(particle, time) {
    const x = particle.x + Math.sin(time * 0.00012 + particle.phase) * particle.drift;
    const y = particle.y;
    context.save();
    context.globalAlpha = particle.opacity;
    context.translate(x, y);
    context.rotate(particle.rotation);
    context.fillStyle = particle.color;
    context.beginPath();
    context.ellipse(0, 0, particle.size * 1.8, particle.size, 0.35, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function draw(time) {
    drawBackground();
    drawVignette();
    drawBlossomCluster();
    particles.forEach(function (particle) {
      drawPetal(particle, time);
    });
  }

  function update(delta, time) {
    particles.forEach(function (particle) {
      particle.y += particle.speed * delta * 0.001;
      particle.rotation += particle.rotationSpeed * delta;
      if (particle.y > height + 12) {
        particle.y = -12;
        particle.x = random() * width;
      }
      drawPetal(particle, time);
    });
  }

  function animate(time) {
    if (!isVisible || reducedMotion) return;
    const delta = Math.min(time - lastTime, 50);
    lastTime = time;
    drawBackground();
    drawVignette();
    drawBlossomCluster();
    update(delta, time);
    animationFrame = window.requestAnimationFrame(animate);
  }

  function handleVisibilityChange() {
    isVisible = !document.hidden;
    if (isVisible && !reducedMotion) {
      lastTime = performance.now();
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(animate);
    } else {
      window.cancelAnimationFrame(animationFrame);
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);
  resize();
  if (!reducedMotion) {
    animationFrame = window.requestAnimationFrame(animate);
  }
})();
