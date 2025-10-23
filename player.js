document.addEventListener('DOMContentLoaded', () => {
  const player = new Plyr('#player', {
    captions: { active: true, update: true },
    keyboard: { focused: true, global: true }
  });
  player.play().catch(()=>{});

  const idleDelay = 2000;
  let idleTimer;
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!player.paused) document.body.classList.add('hide-ui');
    }, idleDelay);
  }
  function showUI() { document.body.classList.remove('hide-ui'); resetIdle(); }

  ['mousemove','click','keydown','touchstart'].forEach(e =>
    document.addEventListener(e, showUI, { passive: true })
  );

  player.on('play', resetIdle);
  player.on('pause', () => document.body.classList.remove('hide-ui'));
  resetIdle();
});