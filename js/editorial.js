(() => {
  'use strict';

  const STORAGE_KEY = 'notzeke:starfield-paused';

  function readPausedPreference() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (_) {
      return false;
    }
  }

  function writePausedPreference(paused) {
    try {
      window.localStorage.setItem(STORAGE_KEY, paused ? 'true' : 'false');
    } catch (_) {
      // Ignore storage failures in restricted browsing contexts.
    }
  }

  function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionToggleBtn = document.getElementById('motion-toggle');

    let userPaused = readPausedPreference();
    let animationFrameId = null;
    let lastTimestamp = 0;
    let width = 0;
    let height = 0;

    const palette = ['#e2e8f0', '#7dd3fc', '#fde68a'];
    const stars = [];

    function targetStarCount(w, h) {
      const area = w * h;
      return Math.max(28, Math.min(64, Math.round(area / 28000)));
    }

    function createStar(w, h, index) {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 0.45 + Math.random() * 0.9,
        alpha: 0.12 + Math.random() * 0.24,
        color: palette[index % palette.length],
        // Slow drift in CSS pixels per second (calm editorial feel)
        vx: (Math.random() - 0.5) * 4.2,
        vy: (Math.random() - 0.5) * 3.2
      };
    }

    function seedStars() {
      stars.length = 0;
      const count = targetStarCount(width, height);
      for (let i = 0; i < count; i += 1) {
        stars.push(createStar(width, height, i));
      }
    }

    function resize() {
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;
      if (nextWidth <= 0 || nextHeight <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(nextWidth * dpr);
      canvas.height = Math.floor(nextHeight * dpr);
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (stars.length === 0 || width === 0 || height === 0) {
        width = nextWidth;
        height = nextHeight;
        seedStars();
      } else {
        const scaleX = nextWidth / width;
        const scaleY = nextHeight / height;
        for (let i = 0; i < stars.length; i += 1) {
          stars[i].x *= scaleX;
          stars[i].y *= scaleY;
        }
        width = nextWidth;
        height = nextHeight;
      }
    }

    function drawFrame(dtSeconds) {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i += 1) {
        const star = stars[i];
        if (dtSeconds > 0) {
          star.x += star.vx * dtSeconds;
          star.y += star.vy * dtSeconds;

          if (star.x < 0) star.x += width;
          else if (star.x > width) star.x -= width;

          if (star.y < 0) star.y += height;
          else if (star.y > height) star.y -= height;
        }

        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    function stopAnimation() {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      lastTimestamp = 0;
    }

    function updateToggleButton(paused) {
      if (!motionToggleBtn) return;
      motionToggleBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      motionToggleBtn.textContent = paused ? 'Play starfield' : 'Pause starfield';
      motionToggleBtn.setAttribute(
        'aria-label',
        paused ? 'Play background starfield' : 'Pause background starfield'
      );
    }

    function isEffectivelyPaused() {
      return userPaused || motionQuery.matches || document.hidden;
    }

    function tick(timestamp) {
      if (isEffectivelyPaused()) {
        stopAnimation();
        drawFrame(0);
        return;
      }

      const dtSeconds = lastTimestamp
        ? Math.min((timestamp - lastTimestamp) / 1000, 0.05)
        : 0;
      lastTimestamp = timestamp;

      drawFrame(dtSeconds);
      animationFrameId = window.requestAnimationFrame(tick);
    }

    function syncMotionState() {
      const uiPaused = userPaused || motionQuery.matches;
      updateToggleButton(uiPaused);

      if (isEffectivelyPaused()) {
        stopAnimation();
        drawFrame(0);
      } else if (animationFrameId === null) {
        lastTimestamp = 0;
        animationFrameId = window.requestAnimationFrame(tick);
      }
    }

    window.addEventListener(
      'resize',
      () => {
        resize();
        drawFrame(0);
      },
      { passive: true }
    );

    document.addEventListener('visibilitychange', syncMotionState);

    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', syncMotionState);
    } else if (typeof motionQuery.addListener === 'function') {
      motionQuery.addListener(syncMotionState);
    }

    if (motionToggleBtn) {
      motionToggleBtn.addEventListener('click', () => {
        userPaused = !userPaused;
        writePausedPreference(userPaused);
        syncMotionState();
      });
    }

    resize();
    syncMotionState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStarfield);
  } else {
    initStarfield();
  }
})();
