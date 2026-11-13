document.addEventListener('DOMContentLoaded', () => {
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
  const numStars = 110;
  const stars = [];

  function initStars() {
    stars.length = 0;
    const palette = ['#e2e8f0', '#7dd3fc', '#fde68a'];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.5 + Math.random() * 1.15,
        alpha: 0.25 + Math.random() * 0.55,
        color: palette[i % palette.length],
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28
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

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();

      if (advance) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;
      }
    }
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
    motionToggleBtn.textContent = isPaused ? 'Play starfield' : 'Pause starfield';
    motionToggleBtn.setAttribute('aria-label', isPaused ? 'Play background starfield' : 'Pause background starfield');
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

  resize();
  syncMotionState();
});
