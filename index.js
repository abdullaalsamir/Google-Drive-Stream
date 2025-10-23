(function(){
  if (!('IntersectionObserver' in window)) {
    // fallback - load images immediately
    document.querySelectorAll('.thumb').forEach(thumb => {
      const url = thumb.dataset.bg;
      if (url) {
        thumb.style.backgroundImage = `url("${url}")`;
      }
    });
    return;
  }
  const cards = document.querySelectorAll('.card');
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const card = entry.target;
      const thumb = card.querySelector('.thumb');
      const url = thumb.dataset.bg;
      if (!url) { obs.unobserve(card); return; }
      // create image for better layout & decoding
      const img = new Image();
      img.src = url;
      img.alt = card.getAttribute('title') || '';
      img.loading = 'lazy';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.position = 'absolute';
      img.style.left = 0;
      img.style.top = 0;
      thumb.style.backgroundImage = 'none';
      thumb.appendChild(img);
      obs.unobserve(card);
    });
  }, { rootMargin: '200px' });
  cards.forEach(c => io.observe(c));
})();