document.addEventListener('DOMContentLoaded', () => {
  // --- Color Scheme Toggle Logic ---
  const themeToggleBtn = document.getElementById('theme-toggle');
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  const darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function getStoredScheme() {
    try {
      const value = localStorage.getItem('color-scheme');
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }

  function setStoredScheme(value) {
    try {
      if (value === null) {
        localStorage.removeItem('color-scheme');
      } else {
        localStorage.setItem('color-scheme', value);
      }
    } catch {
      // Storage blocked; visual override still applies for current page
    }
  }

  function getRenderedScheme() {
    const stored = getStoredScheme();
    if (stored) return stored;
    return darkSchemeQuery.matches ? 'dark' : 'light';
  }

  function applyColorSchemeMeta(value) {
    if (!colorSchemeMeta) return;
    colorSchemeMeta.content = value ?? 'light dark';
  }

  applyColorSchemeMeta(getStoredScheme());

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentRendered = getRenderedScheme();
      const target = currentRendered === 'dark' ? 'light' : 'dark';
      const systemScheme = darkSchemeQuery.matches ? 'dark' : 'light';
      const nextStored = target === systemScheme ? null : target;

      setStoredScheme(nextStored);
      applyColorSchemeMeta(nextStored);
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key === 'color-scheme') {
      applyColorSchemeMeta(getStoredScheme());
    }
  });

  // --- Starfield Canvas Animation ---
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionToggleBtn = document.getElementById('motion-toggle');
  let userPaused = false;
  let animationFrameId = null;

  let width = 0;
  let height = 0;
  const numStars = 90;
  const stars = [];

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.6 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 0.65,
        vy: (Math.random() - 0.5) * 0.65
      });
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    if (stars.length === 0) {
      initStars();
    }
  }

  function drawFrame(advance) {
    ctx.clearRect(0, 0, width, height);

    const style = getComputedStyle(document.documentElement);
    const starColor = style.getPropertyValue('--star-color').trim() || '#4adfff';
    const isDark = getRenderedScheme() === 'dark';

    ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';
    ctx.fillStyle = starColor;
    ctx.globalAlpha = isDark ? 0.65 : 0.45;
    ctx.beginPath();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.moveTo(s.x + s.radius, s.y);
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);

      if (advance) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;
      }
    }
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function stopAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function updateMotionButton(isPaused) {
    if (!motionToggleBtn) return;
    motionToggleBtn.textContent = isPaused ? 'Play Stars' : 'Pause Stars';
    motionToggleBtn.setAttribute('aria-label', isPaused ? 'Play starfield animation' : 'Pause starfield animation');
  }

  function tick() {
    if (userPaused || motionQuery.matches) {
      stopAnimation();
      drawFrame(false);
      return;
    }
    drawFrame(true);
    animationFrameId = requestAnimationFrame(tick);
  }

  function syncMotionState() {
    const shouldPause = userPaused || motionQuery.matches;
    updateMotionButton(shouldPause);
    if (shouldPause) {
      stopAnimation();
      drawFrame(false);
    } else if (animationFrameId === null) {
      tick();
    }
  }

  window.addEventListener('resize', () => {
    resize();
    drawFrame(false);
  });

  if (motionToggleBtn) {
    motionToggleBtn.addEventListener('click', () => {
      userPaused = !userPaused;
      syncMotionState();
    });
  }

  motionQuery.addEventListener('change', syncMotionState);
  darkSchemeQuery.addEventListener('change', () => drawFrame(false));

  resize();
  syncMotionState();
});
