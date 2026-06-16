document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Toggle Logic ---
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;

  // Check for saved theme in localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    htmlElement.setAttribute('data-theme', 'light');
  }

  themeToggleBtn.addEventListener('click', () => {
    if (htmlElement.getAttribute('data-theme') === 'light') {
      htmlElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      htmlElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  });

  // --- Starfield Canvas Animation ---
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  
  let width, height;
  function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
  }
  
  window.addEventListener('resize', resize);
  resize();

  const stars = [];
  const numStars = 100;

  for (let i = 0; i < numStars; i++) {
      stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5
      });
  }

  function draw() {
      // We clear with transparency so the CSS background-color shines through
      ctx.clearRect(0, 0, width, height);

      // Get current theme star color from CSS variable
      const style = getComputedStyle(document.documentElement);
      const starColor = style.getPropertyValue('--star-color').trim() || '#38bdf8';

      // Use lighter composite op only in dark mode, otherwise source-over
      if (document.documentElement.getAttribute('data-theme') === 'light') {
          ctx.globalCompositeOperation = "source-over";
      } else {
          ctx.globalCompositeOperation = "lighter";
      }

      ctx.fillStyle = starColor;
      ctx.beginPath();

      for (let i = 0; i < numStars; i++) {
          const s = stars[i];

          ctx.moveTo(s.x, s.y);
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);

          s.x += s.vx;
          s.y += s.vy;

          if (s.x < 0) s.x = width;
          if (s.x > width) s.x = 0;
          if (s.y < 0) s.y = height;
          if (s.y > height) s.y = 0;
      }
      ctx.fill();
  }

  function animate() {
      draw();
      requestAnimationFrame(animate);
  }

  animate();
});
