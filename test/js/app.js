(function () {
  'use strict';

  function initializePortfolio() {
    const root = document.documentElement;
    const themeButtons = document.querySelectorAll('#theme-toggle, [data-theme-toggle]');

    function readSavedTheme() {
      try {
        return window.localStorage.getItem('theme');
      } catch (error) {
        return null;
      }
    }

    function saveTheme(theme) {
      try {
        window.localStorage.setItem('theme', theme);
      } catch (error) {
        // Theme switching still works for this visit when storage is unavailable.
      }
    }

    function currentTheme() {
      return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function applyTheme(theme, persist) {
      if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
      } else {
        root.removeAttribute('data-theme');
        theme = 'dark';
      }

      themeButtons.forEach(function (button) {
        const isLight = theme === 'light';
        button.setAttribute('aria-pressed', String(isLight));
        button.setAttribute('aria-label', 'Switch to ' + (isLight ? 'dark' : 'light') + ' theme');
        button.setAttribute('title', 'Switch to ' + (isLight ? 'dark' : 'light') + ' theme');
      });

      if (persist) saveTheme(theme);
    }

    const savedTheme = readSavedTheme();
    if (savedTheme === 'light' || savedTheme === 'dark') {
      applyTheme(savedTheme, false);
    } else {
      applyTheme(currentTheme(), false);
    }

    themeButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        applyTheme(currentTheme() === 'light' ? 'dark' : 'light', true);
      });
    });

    initializeNavigationFallback();
    initializeBootstrapMobileNavigation();
    initializeStarfield();

    function initializeNavigationFallback() {
      // Bootstrap owns its collapse controls when its bundle is present. This
      // small fallback keeps the nav operable if the optional CDN script fails.
      if (window.bootstrap && window.bootstrap.Collapse) return;

      const toggles = document.querySelectorAll('.navbar-toggler, [data-nav-toggle]');

      toggles.forEach(function (button) {
        const selector = button.getAttribute('data-bs-target');
        const controlledId = button.getAttribute('aria-controls');
        let menu = null;

        try {
          menu = selector ? document.querySelector(selector) : null;
        } catch (error) {
          menu = null;
        }

        if (!menu && controlledId) menu = document.getElementById(controlledId);
        if (!menu) return;

        function setExpanded(expanded) {
          button.setAttribute('aria-expanded', String(expanded));
          menu.classList.toggle('show', expanded);
        }

        button.addEventListener('click', function () {
          setExpanded(button.getAttribute('aria-expanded') !== 'true');
        });

        menu.addEventListener('click', function (event) {
          const link = event.target.closest('a[href]');
          if (link && window.matchMedia('(max-width: 991.98px)').matches) {
            setExpanded(false);
          }
        });

        button.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
            setExpanded(false);
            button.focus();
          }
        });

        menu.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
            setExpanded(false);
            button.focus();
          }
        });
      });
    }

    function initializeBootstrapMobileNavigation() {
      const menus = document.querySelectorAll('.navbar-collapse');

      menus.forEach(function (menu) {
        menu.addEventListener('click', function (event) {
          const link = event.target.closest('a[href]');
          const collapse = window.bootstrap && window.bootstrap.Collapse;
          if (!link || !collapse || !window.matchMedia('(max-width: 991.98px)').matches) return;

          collapse.getOrCreateInstance(menu).hide();
        });
      });
    }

    function initializeStarfield() {
      const canvas = document.getElementById('starfield');
      if (!canvas || typeof canvas.getContext !== 'function') return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
      const stars = [];
      const starCount = Math.min(90, Math.max(36, Math.round((window.innerWidth * window.innerHeight) / 18000)));
      let width = 0;
      let height = 0;
      let animationFrame = 0;

      for (let index = 0; index < starCount; index += 1) {
        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          radius: 0.35 + Math.random() * 1.05,
          alpha: 0.2 + Math.random() * 0.5,
          vx: (Math.random() - 0.5) * 0.13,
          vy: (Math.random() - 0.5) * 0.13
        });
      }

      function resizeCanvas() {
        const nextWidth = Math.max(1, window.innerWidth);
        const nextHeight = Math.max(1, window.innerHeight);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const widthRatio = width ? nextWidth / width : 1;
        const heightRatio = height ? nextHeight / height : 1;

        width = nextWidth;
        height = nextHeight;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        if (widthRatio !== 1 || heightRatio !== 1) {
          stars.forEach(function (star) {
            star.x *= widthRatio;
            star.y *= heightRatio;
          });
        }

        render(false);
        synchronizeAnimation();
      }

      function render(moveStars) {
        context.clearRect(0, 0, width, height);
        context.globalCompositeOperation = currentTheme() === 'light' ? 'source-over' : 'lighter';

        const starColor = window.getComputedStyle(root).getPropertyValue('--star-color').trim() || '#8ce8f0';
        stars.forEach(function (star) {
          context.globalAlpha = star.alpha;
          context.fillStyle = starColor;
          context.beginPath();
          context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          context.fill();

          if (moveStars) {
            star.x += star.vx;
            star.y += star.vy;

            if (star.x < 0) star.x = width;
            if (star.x > width) star.x = 0;
            if (star.y < 0) star.y = height;
            if (star.y > height) star.y = 0;
          }
        });

        context.globalAlpha = 1;
        context.globalCompositeOperation = 'source-over';
      }

      function animate() {
        animationFrame = 0;
        if (document.hidden || motionPreference.matches) {
          render(false);
          return;
        }

        render(true);
        animationFrame = window.requestAnimationFrame(animate);
      }

      function synchronizeAnimation() {
        if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }

        if (document.hidden || motionPreference.matches) {
          render(false);
          return;
        }

        animationFrame = window.requestAnimationFrame(animate);
      }

      window.addEventListener('resize', resizeCanvas, { passive: true });
      document.addEventListener('visibilitychange', synchronizeAnimation);
      if (typeof motionPreference.addEventListener === 'function') {
        motionPreference.addEventListener('change', synchronizeAnimation);
      } else if (typeof motionPreference.addListener === 'function') {
        motionPreference.addListener(synchronizeAnimation);
      }

      const themeObserver = new MutationObserver(function () {
        render(false);
      });
      themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

      resizeCanvas();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePortfolio, { once: true });
  } else {
    initializePortfolio();
  }
}());
