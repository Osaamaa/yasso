/* Yasso's Gaming Universe — no libraries, accounts, or build step required. */
(() => {
  'use strict';

  const content = window.YASSO_CONTENT || {};
  const photos = Array.isArray(content.photos) ? content.photos : [];
  const questions = Array.isArray(content.quiz) ? content.quiz : [];
  const copy = content.messages || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const on = (selector, type, handler, options) => $(selector)?.addEventListener(type, handler, options);
  const setText = (selector, text) => { const el = $(selector); if (el) el.textContent = text; };
  const hide = (selector, hidden = true) => { const el = $(selector); if (el) el.hidden = hidden; };
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery.matches;
  let started = false;
  let adventureRun = 0;
  let muted = false;
  try {
    const savedMute = localStorage.getItem('yasso-universe-muted') ?? localStorage.getItem('yassin-universe-muted');
    muted = savedMute === 'true';
  } catch (_) { /* Private mode is fine. */ }

  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  }

  function buttonLabel(button, label, iconName) {
    if (!button) return;
    button.replaceChildren(document.createTextNode(label));
    if (iconName) button.append(document.createTextNode(' '), icon(iconName));
  }

  // One master gain controls every generated sound, including sounds already playing.
  let audioContext;
  let masterGain;
  let music;
  let musicUnavailable = false;
  let musicFade = 0;
  let musicRequest = 0;
  const video = $('#cinema-video');
  const videoIsPlaying = () => video && !video.paused && !video.ended;

  function prepareAudio() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        try {
          audioContext = new AudioContextClass();
          masterGain = audioContext.createGain();
          masterGain.gain.value = muted ? 0 : 0.16;
          masterGain.connect(audioContext.destination);
        } catch (_) { /* Audio is an optional extra. */ }
      }
    }
    if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {});
  }

  function sound(kind = 'click') {
    if (!started || muted || document.hidden || !audioContext || !masterGain) return;
    const notes = kind === 'reward' ? [523.25, 659.25, 783.99, 1046.5]
      : kind === 'block' ? [220, 330] : kind === 'bug' ? [620, 280] : [440];
    const now = audioContext.currentTime;
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      const at = now + index * 0.075;
      oscillator.type = kind === 'bug' ? 'square' : 'triangle';
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(0.35, at + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.001, at + 0.14);
      oscillator.connect(envelope);
      envelope.connect(masterGain);
      oscillator.start(at);
      oscillator.stop(at + 0.16);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    });
  }

  function pauseMusic() {
    musicRequest += 1;
    cancelAnimationFrame(musicFade);
    musicFade = 0;
    music?.pause();
  }

  async function resumeMusic() {
    if (!started || muted || document.hidden || musicUnavailable || videoIsPlaying() || !content.music) return;
    if (!music) {
      music = new Audio();
      music.loop = true;
      music.preload = 'none';
      music.volume = 0;
      music.src = content.music;
      music.addEventListener('error', () => { musicUnavailable = true; pauseMusic(); });
    }
    if (!music.paused) return;
    const request = ++musicRequest;
    try {
      music.volume = 0;
      await music.play();
      if (request !== musicRequest) return;
      if (!started || muted || document.hidden || videoIsPlaying()) {
        music.pause();
        return;
      }
      const beginning = performance.now();
      cancelAnimationFrame(musicFade);
      const fade = now => {
        if (request !== musicRequest) return;
        music.volume = Math.min(0.24, ((now - beginning) / 1400) * 0.24);
        if (now - beginning < 1400) musicFade = requestAnimationFrame(fade);
      };
      musicFade = requestAnimationFrame(fade);
    } catch (_) {
      // A missing optional song or an autoplay restriction must never block a game.
    }
  }

  function renderSound() {
    const toggle = $('#sound-toggle');
    toggle?.setAttribute('aria-pressed', String(muted));
    toggle?.setAttribute('aria-label', muted ? 'Turn sound on' : 'Mute all sound');
    toggle?.classList.toggle('is-muted', muted);
    setText('#sound-label', muted ? 'SOUND OFF' : 'SOUND ON');
  }

  function setMuted(value) {
    muted = value;
    try { localStorage.setItem('yasso-universe-muted', String(muted)); } catch (_) { /* Optional persistence. */ }
    if (masterGain) masterGain.gain.setValueAtTime(muted ? 0 : 0.16, audioContext.currentTime);
    if (video) video.muted = muted;
    renderSound();
    if (muted) pauseMusic();
    else { if (started) prepareAudio(); resumeMusic(); }
  }

  on('#sound-toggle', 'click', () => { setMuted(!muted); if (!muted) sound(); });
  renderSound();
  if (video) video.muted = muted;

  let toastTimer = 0;
  function toast(message) {
    const element = $('#toast');
    if (!element) return;
    clearTimeout(toastTimer);
    element.textContent = message;
    element.hidden = false;
    element.classList.add('visible');
    toastTimer = setTimeout(() => { element.classList.remove('visible'); element.hidden = true; }, 4200);
  }

  // Confetti runs only while particles exist and never runs with reduced motion.
  const canvas = $('#confetti-canvas');
  const context = canvas?.getContext('2d');
  let particles = [];
  let confettiFrame = 0;
  let confettiLastTime = 0;
  const colors = ['#a3e451', '#60d7ef', '#bb8cf5', '#f4c969', '#f4f0e7'];

  function sizeCanvas() {
    if (!canvas || !context) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * scale);
    canvas.height = Math.round(innerHeight * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function stopConfetti() {
    cancelAnimationFrame(confettiFrame);
    confettiFrame = 0;
    particles = [];
    context?.clearRect(0, 0, innerWidth, innerHeight);
  }

  function confetti(count = 75) {
    if (reducedMotion || document.hidden || !context) return;
    if (!confettiFrame) sizeCanvas();
    const total = Math.min(count, 150 - particles.length);
    for (let i = 0; i < total; i += 1) {
      particles.push({ x: innerWidth * (0.2 + Math.random() * 0.6), y: innerHeight * 0.2,
        vx: (Math.random() - 0.5) * 6, vy: -2 - Math.random() * 6,
        size: 4 + Math.random() * 7, life: 0, rotation: Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)] });
    }
    if (confettiFrame) return;
    confettiLastTime = performance.now();
    const draw = now => {
      const delta = Math.min((now - confettiLastTime) / 16.67, 3);
      confettiLastTime = now;
      context.clearRect(0, 0, innerWidth, innerHeight);
      particles = particles.filter(p => p.life < 210 && p.y < innerHeight + 30);
      particles.forEach(p => {
        p.life += delta; p.x += p.vx * delta; p.vy += 0.075 * delta; p.y += p.vy * delta;
        p.rotation += 0.045 * delta;
        context.save(); context.translate(p.x, p.y); context.rotate(p.rotation);
        context.globalAlpha = Math.min(1, (210 - p.life) / 35);
        context.fillStyle = p.color; context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        context.restore();
      });
      if (particles.length) confettiFrame = requestAnimationFrame(draw);
      else { confettiFrame = 0; context.clearRect(0, 0, innerWidth, innerHeight); }
    };
    confettiFrame = requestAnimationFrame(draw);
  }

  // Keep the boot sequence decorative: PRESS START works from the first paint.
  const bootLines = $$('#boot-lines > span');
  let bootTimers = [];
  function finishBoot() { bootTimers.forEach(clearTimeout); bootTimers = []; bootLines.forEach(line => { line.hidden = false; }); }
  function runBoot() {
    finishBoot();
    if (reducedMotion) return;
    bootLines.forEach((line, index) => {
      line.hidden = index > 0;
      if (index) bootTimers.push(setTimeout(() => { line.hidden = false; }, index * 420));
    });
  }

  const observers = [];
  const achievements = new Set();
  let finaleCelebrated = false;
  function observeOnce(element, callback, threshold = 0.2) {
    if (!element) return;
    if (!('IntersectionObserver' in window)) { callback(); return; }
    const run = adventureRun;
    const observer = new IntersectionObserver(entries => {
      if (!started || run !== adventureRun) { observer.disconnect(); return; }
      if (entries.some(entry => entry.isIntersecting)) { callback(); observer.disconnect(); }
    }, { threshold });
    observers.push(observer);
    observer.observe(element);
  }

  function armScrollRewards() {
    observeOnce($('#stats'), () => {
      $('#stats')?.classList.add('is-visible');
      $$('.stat-fill').forEach(fill => {
        const amount = Math.max(0, Math.min(100, Number(fill.dataset.value) || 0));
        fill.style.setProperty('--fill', `${amount}%`);
        fill.style.width = `${amount}%`;
        fill.classList.add('is-visible');
      });
    });
    $$('[data-achievement]').forEach(badge => {
      const trigger = badge.dataset.trigger ? $(badge.dataset.trigger) : badge;
      observeOnce(trigger || badge, () => {
        const id = badge.dataset.achievement;
        if (achievements.has(id)) return;
        achievements.add(id);
        badge.classList.add('unlocked');
        badge.dataset.unlocked = 'true';
        const status = $('[data-status], .achievement-status', badge);
        if (status) status.textContent = 'UNLOCKED';
        const name = $('b, h3, h4, strong', badge)?.textContent || 'Legend status';
        badge.setAttribute('aria-label', `${name}: achievement unlocked`);
        toast(`Achievement unlocked: ${name}`);
        sound('reward');
      }, 0.15);
    });
    observeOnce($('#finale'), () => {
      if (finaleCelebrated) return;
      finaleCelebrated = true;
      confetti(100);
    }, 0.25);
  }

  function startAdventure() {
    if (started) return;
    started = true;
    adventureRun += 1;
    finishBoot();
    document.body.classList.add('started');
    $('#adventure')?.removeAttribute('inert');
    hide('#adventure', false);
    hide('#welcome-banner', false);
    $('#hero')?.classList.add('launching');
    $('#hero .game-scene')?.classList.add('launching');
    setText('#player-status', 'PLAYER CONNECTED');
    const startButton = $('#start-button');
    buttonLabel(startButton, 'SERVER UNLOCKED', 'star');
    if (startButton) startButton.disabled = true;
    prepareAudio();
    resumeMusic();
    sound('reward');
    confetti(100);
    armScrollRewards();
  }

  on('#start-button', 'click', startAdventure);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.getAttribute('href').length > 1) {
      startAdventure();
      hide('#mobile-menu');
      $('#menu-toggle')?.setAttribute('aria-expanded', 'false');
      $('#menu-toggle')?.setAttribute('aria-label', 'Open navigation');
    }
    const button = event.target.closest('button');
    if (button && !button.matches('#start-button, #sound-toggle, .grid-cell, .pixel-bug')) sound();
  });

  on('#menu-toggle', 'click', () => {
    const menu = $('#mobile-menu');
    if (!menu) return;
    menu.hidden = !menu.hidden;
    $('#menu-toggle').setAttribute('aria-expanded', String(!menu.hidden));
    $('#menu-toggle').setAttribute('aria-label', menu.hidden ? 'Open navigation' : 'Close navigation');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && $('#mobile-menu') && !$('#mobile-menu').hidden) {
      hide('#mobile-menu');
      $('#menu-toggle').setAttribute('aria-expanded', 'false');
      $('#menu-toggle').setAttribute('aria-label', 'Open navigation');
      $('#menu-toggle').focus();
    }
  });

  // Both galleries share a single index. Originals are requested only in the modal.
  let photoIndex = 0;
  let chestOpen = false;
  let chestTimer = 0;
  let photoReturnFocus;
  const photoDialog = $('#photo-dialog');
  $('#photo-caption')?.setAttribute('aria-live', 'polite');
  $('#loot-counter')?.setAttribute('aria-live', 'polite');
  const counter = () => `${String(photoIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;

  function loadPhoto(img, photo, source, errorElement) {
    if (!img || !photo) return;
    const candidates = [...new Set([source, photo.src, photo.full].filter(Boolean))];
    let attempt = 0;
    img.hidden = false;
    img.classList.remove('image-missing');
    img.alt = photo.alt || photo.caption || 'A memory from Yasso’s collection';
    img.decoding = 'async';
    img.draggable = false;
    if (errorElement) errorElement.hidden = true;
    img.onload = () => { img.hidden = false; if (errorElement) errorElement.hidden = true; };
    img.onerror = () => {
      attempt += 1;
      if (attempt < candidates.length) img.src = candidates[attempt];
      else {
        img.classList.add('image-missing');
        if (errorElement) { img.hidden = true; errorElement.hidden = false; }
        if (img.id === 'loot-image') setText('#loot-caption', 'This memory couldn’t load. Try the next photo, or open the full collection.');
      }
    };
    if (candidates.length) img.src = candidates[0];
    else { img.removeAttribute('src'); img.onerror(); }
  }

  function syncPhoto() {
    if (!photos.length) return;
    const photo = photos[photoIndex];
    if (chestOpen) {
      loadPhoto($('#loot-image'), photo, photo.src);
      setText('#loot-caption', photo.caption);
      setText('#loot-rarity', `★ ${photo.rarity || 'LEGENDARY'}`);
      const rarity = String(photo.rarity || 'legendary').toLowerCase().replace(/[^a-z-]/g, '');
      const tag = $('#loot-rarity');
      if (tag) tag.className = `rarity-tag ${rarity}`;
      setText('#loot-counter', counter());
    }
    $$('.inventory-slot').forEach((slot, index) => {
      slot.classList.toggle('is-selected', index === photoIndex);
      if (index === photoIndex) slot.setAttribute('aria-current', 'true');
      else slot.removeAttribute('aria-current');
    });
    if (photoDialog?.open) {
      loadPhoto($('#photo-image'), photo, photo.full || photo.src, $('#photo-error'));
      setText('#photo-caption', photo.caption);
      setText('#photo-counter', counter());
    }
  }

  function movePhoto(direction) {
    if (!photos.length) return;
    photoIndex = (photoIndex + direction + photos.length) % photos.length;
    syncPhoto();
  }

  function openPhoto(index = photoIndex) {
    if (!photos.length || !photoDialog) return;
    photoIndex = index;
    photoReturnFocus = document.activeElement;
    if (!photoDialog.open) photoDialog.showModal();
    syncPhoto();
    $('#photo-close')?.focus();
  }

  const hotbar = $('#hotbar');
  if (hotbar) {
    const fragment = document.createDocumentFragment();
    photos.forEach((photo, index) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'inventory-slot';
      slot.setAttribute('aria-label', `Open memory ${index + 1}: ${photo.caption || 'Yasso’s collection'}`);
      slot.setAttribute('aria-haspopup', 'dialog');
      slot.title = photo.caption || `Memory ${index + 1}`;
      const thumbnail = document.createElement('img');
      thumbnail.loading = 'lazy';
      thumbnail.width = 100;
      thumbnail.height = 100;
      loadPhoto(thumbnail, photo, photo.thumb || photo.src);
      const number = document.createElement('span');
      number.className = 'slot-number';
      number.textContent = String(index + 1).padStart(2, '0');
      number.setAttribute('aria-hidden', 'true');
      slot.append(thumbnail, number);
      slot.addEventListener('click', () => openPhoto(index));
      fragment.append(slot);
    });
    hotbar.replaceChildren(fragment);
  }
  setText('#hotbar-count', `${photos.length} ITEMS`);
  $$('[data-photo-count]').forEach(element => { element.textContent = String(photos.length); });
  on('#chest-button', 'click', () => {
    if (chestOpen) return;
    if (!photos.length) { toast('The memory collection is still being packed.'); return; }
    chestOpen = true;
    photoIndex = 0;
    $('#chest-button')?.classList.add('is-open');
    $('#chest-button .chest')?.classList.add('is-open');
    $('#chest-button')?.setAttribute('aria-expanded', 'true');
    $('#chest-button').disabled = true;
    const reveal = () => {
      chestTimer = 0;
      if (!started || !chestOpen) return;
      hide('#chest-closed');
      hide('#loot-reveal', false);
      syncPhoto();
      $('#loot-expand')?.focus({ preventScroll: true });
    };
    if (reducedMotion) reveal();
    else chestTimer = setTimeout(reveal, 440);
    sound('reward');
    confetti(45);
  });
  on('#loot-prev', 'click', () => movePhoto(-1));
  on('#loot-next', 'click', () => movePhoto(1));
  on('#loot-expand', 'click', () => openPhoto());
  on('#photo-prev', 'click', () => movePhoto(-1));
  on('#photo-next', 'click', () => movePhoto(1));
  on('#photo-close', 'click', () => photoDialog?.close());
  photoDialog?.addEventListener('close', () => {
    if (photoReturnFocus?.isConnected) photoReturnFocus.focus({ preventScroll: true });
  });
  photoDialog?.addEventListener('click', event => {
    if (event.target !== photoDialog) return;
    const rect = photoDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) photoDialog.close();
  });
  photoDialog?.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); movePhoto(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  function addSwipe(element) {
    if (!element) return;
    let origin;
    let suppressClickUntil = 0;
    element.style.touchAction = 'pan-y';
    element.addEventListener('pointerdown', event => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      origin = { x: event.clientX, y: event.clientY, id: event.pointerId };
    }, { passive: true });
    element.addEventListener('pointerup', event => {
      if (!origin || origin.id !== event.pointerId) return;
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      origin = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        suppressClickUntil = performance.now() + 400;
        movePhoto(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
    element.addEventListener('pointercancel', () => { origin = null; }, { passive: true });
    element.addEventListener('click', event => {
      if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
    }, true);
  }
  addSwipe($('#loot-expand'));
  addSwipe($('#photo-image'));
  syncPhoto();

  // Video is never autoplayed. Its own controls remain available after the first tap.
  const clip = Array.isArray(content.videos) ? content.videos[0] : undefined;
  if (video && clip?.src) {
    video.src = clip.src;
    if (clip.poster) video.poster = clip.poster;
    video.preload = 'none';
    video.playsInline = true;
    setText('#video-title', clip.title || 'A very good memory');
    video.addEventListener('play', () => {
      hide('#video-play'); hide('#video-error'); pauseMusic();
      video.closest('.cinema-screen')?.classList.add('is-playing');
    });
    video.addEventListener('pause', () => {
      video.closest('.cinema-screen')?.classList.remove('is-playing');
      resumeMusic();
    });
    video.addEventListener('ended', () => {
      hide('#video-play', false);
      video.closest('.cinema-screen')?.classList.remove('is-playing');
      resumeMusic();
    });
    video.addEventListener('error', () => {
      hide('#video-play'); hide('#video-error', false); resumeMusic();
      setText('#video-error', 'This clip couldn’t load. Your photos and games are still ready to play.');
    });
    video.addEventListener('volumechange', () => {
      // If the player explicitly unmutes the native controls, reflect that choice globally.
      if (muted && !video.muted) setMuted(false);
    });
  } else {
    hide('#video-play'); hide('#video-error', false);
    setText('#video-error', 'No clip has been added yet. The rest of your universe is ready.');
  }
  on('#video-play', 'click', async () => {
    if (!video || !clip?.src) return;
    startAdventure();
    video.muted = muted;
    try { await video.play(); } catch (error) {
      if (video.error) return;
      if (error.name !== 'AbortError') {
        hide('#video-play', false);
        hide('#video-error', false);
        setText('#video-error', 'Tap the video’s own play button to start this memory.');
      }
    }
  });

  // An occupied cell counts once; replacing its material never increases the score.
  let material = 'grass';
  let occupied = 0;
  let builderUnlocked = false;
  const builderGrid = $('#builder-grid');
  const board = Array(64).fill(null);
  const cells = [];
  const builderReady = copy.builderReady || 'Pick a block, then tap a square. Your world, your rules.';
  const builderReward = copy.builderUnlock || '20 blocks! Planning permission denied: this build is too awesome. A future engineer clearly lives here. — Uncle Osama';

  function cellLabel(index) {
    return `Row ${Math.floor(index / 8) + 1}, column ${index % 8 + 1}: ${board[index] || 'empty'}. Place ${material}.`;
  }

  function updateBoardLabels() { cells.forEach((cell, index) => { cell.setAttribute('aria-label', cellLabel(index)); }); }

  if (builderGrid) {
    builderGrid.setAttribute('role', 'group');
    builderGrid.setAttribute('aria-label', 'Block builder. Use arrow keys to move, then Enter or Space to place a block.');
    for (let index = 0; index < 64; index += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'grid-cell';
      cell.tabIndex = index === 0 ? 0 : -1;
      cell.addEventListener('focus', () => cells.forEach(item => { item.tabIndex = item === cell ? 0 : -1; }));
      cell.addEventListener('click', () => {
        if (!board[index]) occupied += 1;
        board[index] = material;
        cell.dataset.material = material;
        cell.classList.add('is-filled');
        cell.setAttribute('aria-label', cellLabel(index));
        setText('#block-count', String(occupied));
        sound('block');
        if (occupied >= 20 && !builderUnlocked) {
          builderUnlocked = true;
          setText('#builder-message', builderReward);
          $('#builder-message')?.classList.add('is-unlocked');
          sound('reward'); confetti(55);
        }
      });
      cell.addEventListener('keydown', event => {
        let next = index;
        if (event.key === 'ArrowRight') next = Math.min(index + 1, Math.floor(index / 8) * 8 + 7);
        else if (event.key === 'ArrowLeft') next = Math.max(index - 1, Math.floor(index / 8) * 8);
        else if (event.key === 'ArrowDown') next = index < 56 ? index + 8 : index;
        else if (event.key === 'ArrowUp') next = index >= 8 ? index - 8 : index;
        else if (event.key === 'Home') next = event.ctrlKey ? 0 : Math.floor(index / 8) * 8;
        else if (event.key === 'End') next = event.ctrlKey ? 63 : Math.floor(index / 8) * 8 + 7;
        else return;
        event.preventDefault(); cells[next].focus();
      });
      cells.push(cell);
      builderGrid.append(cell);
    }
    updateBoardLabels();
  }
  on('#material-picker', 'click', event => {
    const choice = event.target.closest('button[data-material]');
    if (!choice) return;
    material = choice.dataset.material;
    $$('#material-picker button').forEach(button => button.setAttribute('aria-pressed', String(button === choice)));
    updateBoardLabels();
  });

  function resetBuilder() {
    board.fill(null); occupied = 0; builderUnlocked = false; material = 'grass';
    cells.forEach((cell, index) => {
      cell.removeAttribute('data-material'); cell.classList.remove('is-filled');
      cell.tabIndex = index === 0 ? 0 : -1;
    });
    $$('#material-picker button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.material === material)));
    updateBoardLabels();
    setText('#block-count', '0'); setText('#builder-message', builderReady);
    $('#builder-message')?.classList.remove('is-unlocked');
  }
  on('#builder-clear', 'click', resetBuilder);

  // Each bug moves inside its own cell, so targets cannot pile up or leave the arena.
  const arena = $('#bug-arena');
  $('#bug-count')?.parentElement?.setAttribute('aria-live', 'polite');
  const initialArena = arena ? Array.from(arena.childNodes, node => node.cloneNode(true)) : [];
  let bugs = [];
  let bugsCaught = 0;
  let bugFrame = 0;
  let bugStartTime = 0;
  let bugSize = 52;
  let arenaWidth = 0;
  let arenaHeight = 0;

  function measureArena() {
    if (!arena) return;
    arenaWidth = arena.clientWidth;
    const columns = arenaWidth < 360 ? 2 : 4;
    const rows = 8 / columns;
    // 48px targets, a little separation, and the border must fit even at tablet widths.
    const minimumHeight = `${rows * 52 + 6}px`;
    if (arena.style.minHeight !== minimumHeight) arena.style.minHeight = minimumHeight;
    arenaHeight = arena.clientHeight;
    bugSize = Math.max(48, Math.min(56,
      Math.floor(arenaWidth / columns - 8), Math.floor(arenaHeight / rows - 8)));
    bugs.forEach(bug => { bug.element.style.width = `${bugSize}px`; bug.element.style.height = `${bugSize}px`; });
  }

  function placeBugs(time = 0, force = false) {
    const columns = arenaWidth < 360 ? 2 : 4;
    const rows = 8 / columns;
    const cellWidth = arenaWidth / columns;
    const cellHeight = arenaHeight / rows;
    bugs.forEach((bug, index) => {
      if (bug.caught || (!force && document.activeElement === bug.element)) return;
      const amplitudeX = reducedMotion ? 0 : Math.max(0, (cellWidth - bugSize - 20) / 2);
      const amplitudeY = reducedMotion ? 0 : Math.max(0, (cellHeight - bugSize - 16) / 2);
      const x = (index % columns + 0.5) * cellWidth - bugSize / 2 + Math.sin(time / 2300 + index * 1.7) * amplitudeX;
      const y = (Math.floor(index / columns) + 0.5) * cellHeight - bugSize / 2 + Math.cos(time / 2700 + index * 1.3) * amplitudeY;
      bug.element.style.left = `${Math.max(4, Math.min(arenaWidth - bugSize - 4, x))}px`;
      bug.element.style.top = `${Math.max(4, Math.min(arenaHeight - bugSize - 4, y))}px`;
    });
  }

  function stopBugs() { cancelAnimationFrame(bugFrame); bugFrame = 0; }
  function animateBugs() {
    stopBugs();
    if (reducedMotion || document.hidden || !bugs.length || bugsCaught === 8) { placeBugs(0, true); return; }
    bugStartTime = performance.now();
    const frame = now => {
      placeBugs(now - bugStartTime);
      bugFrame = requestAnimationFrame(frame);
    };
    bugFrame = requestAnimationFrame(frame);
  }

  function startBugs() {
    if (!arena) return;
    stopBugs(); bugs = []; bugsCaught = 0;
    arena.replaceChildren();
    setText('#bug-count', '0'); hide('#bug-secret');
    buttonLabel($('#bugs-start'), 'RESTART DEBUGGING', 'arrow');
    for (let index = 0; index < 8; index += 1) {
      const element = document.createElement('button');
      element.type = 'button'; element.className = 'pixel-bug';
      element.style.position = 'absolute';
      element.setAttribute('aria-label', `Squash bug ${index + 1} of 8`);
      element.append(icon('bug'));
      const bug = { element, caught: false };
      element.addEventListener('click', event => {
        if (bug.caught) return;
        const wasFocused = document.activeElement === element;
        bug.caught = true; bugsCaught += 1;
        element.classList.add('squashed'); element.disabled = true;
        element.setAttribute('aria-label', `Bug ${index + 1} squashed`);
        element.style.visibility = 'hidden';
        setText('#bug-count', String(bugsCaught)); sound('bug');
        if (bugsCaught === 8) {
          stopBugs();
          setText('#bug-secret', content.secretMessage || 'Secret unlocked: You don’t have to be perfect to make me proud. But debugging my Wi-Fi would definitely earn bonus points. — Uncle Osama');
          hide('#bug-secret', false);
          buttonLabel($('#bugs-start'), 'DEBUG AGAIN', 'arrow');
          sound('reward'); confetti(65);
        }
        if (wasFocused && event.detail === 0) (bugs.find(item => !item.caught)?.element || $('#bugs-start'))?.focus({ preventScroll: true });
      });
      bugs.push(bug); arena.append(element);
    }
    measureArena(); placeBugs(); animateBugs();
  }

  function resetBugs() {
    stopBugs(); bugs = []; bugsCaught = 0;
    arena?.replaceChildren(...initialArena.map(node => node.cloneNode(true)));
    setText('#bug-count', '0'); hide('#bug-secret');
    buttonLabel($('#bugs-start'), 'LET’S DEBUG', 'arrow');
  }
  on('#bugs-start', 'click', startBugs);
  if (arena && 'ResizeObserver' in window) new ResizeObserver(() => { measureArena(); placeBugs(0, true); }).observe(arena);

  let quizIndex = 0;
  let quizAnswer = null;
  let quizScore = 0;
  function renderQuestion(focus = false) {
    const question = questions[quizIndex];
    hide('#quiz-game', false); hide('#quiz-victory');
    setText('#quiz-feedback', '');
    $('#quiz-feedback')?.classList.remove('correct', 'incorrect');
    const nextButton = $('#quiz-next');
    if (nextButton) nextButton.disabled = true;
    buttonLabel(nextButton, quizIndex === questions.length - 1 ? 'CLAIM VICTORY' : 'NEXT QUESTION', 'arrow');
    if (!question) {
      setText('#quiz-question', 'The quiz is getting a little update. Your legend status is already confirmed.');
      return;
    }
    setText('#quiz-progress', `${String(quizIndex + 1).padStart(2, '0')} / ${String(questions.length).padStart(2, '0')}`);
    setText('#quiz-code', question.code);
    setText('#quiz-question', question.question);
    const answerBox = $('#quiz-answers');
    if (!answerBox) return;
    answerBox.replaceChildren();
    question.answers.forEach((answer, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'quiz-answer';
      const key = document.createElement('span'); key.className = 'answer-key'; key.textContent = String.fromCharCode(65 + index);
      const label = document.createElement('span'); label.className = 'answer-text'; label.textContent = answer;
      button.append(key, label);
      button.addEventListener('click', event => {
        if (quizAnswer !== null) return;
        quizAnswer = index;
        const isCorrect = index === question.correct;
        if (isCorrect) quizScore += 1;
        $$('.quiz-answer', answerBox).forEach((option, optionIndex) => {
          option.disabled = true;
          if (optionIndex === question.correct) option.classList.add('correct');
        });
        button.classList.add(isCorrect ? 'correct' : 'incorrect');
        button.setAttribute('aria-pressed', 'true');
        setText('#quiz-feedback', `${isCorrect ? '✓ ' : 'Plot twist: '}${question.feedback || 'Uncle approval remains at 100%.'}`);
        $('#quiz-feedback')?.classList.add(isCorrect ? 'correct' : 'incorrect');
        if (nextButton) nextButton.disabled = false;
        if (event.detail === 0) nextButton?.focus({ preventScroll: true });
        if (isCorrect) sound('reward');
      });
      answerBox.append(button);
    });
    if (focus) { $('#quiz-question').tabIndex = -1; $('#quiz-question').focus({ preventScroll: true }); }
  }

  function resetQuiz(focus = false) { quizIndex = 0; quizAnswer = null; quizScore = 0; renderQuestion(focus); }
  on('#quiz-next', 'click', () => {
    if (quizAnswer === null) return;
    if (quizIndex < questions.length - 1) { quizIndex += 1; quizAnswer = null; renderQuestion(true); }
    else {
      hide('#quiz-game'); hide('#quiz-victory', false);
      setText('#quiz-progress', 'COMPLETE ✓');
      const victoryCopy = $('#quiz-victory p');
      if (victoryCopy) victoryCopy.textContent = copy.quizVictory || 'You passed the vibe check. Uncle approval: 100%. Every answer ends with you being my favorite legend.';
      const score = $('#quiz-score');
      if (score) score.textContent = `${quizScore} / ${questions.length}`;
      const victory = $('#quiz-victory');
      if (victory) { victory.tabIndex = -1; victory.focus({ preventScroll: true }); }
      sound('reward'); confetti(85);
    }
  });
  on('#quiz-retry', 'click', () => resetQuiz(true));
  resetQuiz();

  const surpriseDialog = $('#surprise-dialog');
  $('#surprise-message')?.setAttribute('role', 'status');
  let surpriseTimer = 0;
  let surpriseRevealed = false;
  let suppressSurpriseToast = false;
  let surpriseReturnFocus;
  const dangerReveal = copy.dangerReveal || 'Just kidding! Nothing crashed. Your awesomeness briefly exceeded the server limit. Uncle Osama has approved the upgrade.';
  function revealSurprise() {
    clearTimeout(surpriseTimer); surpriseTimer = 0;
    if (!surpriseDialog?.open) return;
    surpriseRevealed = true;
    document.body.classList.remove('fake-crash');
    surpriseDialog.classList.remove('crash-phase');
    setText('#surprise-title', 'JUST KIDDING!');
    setText('#surprise-message', dangerReveal);
    buttonLabel($('#surprise-close'), 'I KNEW IT.', 'arrow');
    sound('reward'); confetti(90);
  }
  on('#danger-button', 'click', () => {
    if (!surpriseDialog || surpriseDialog.open) return;
    surpriseReturnFocus = document.activeElement;
    surpriseRevealed = false; suppressSurpriseToast = false;
    setText('#surprise-title', 'GAME CRASH…?');
    setText('#surprise-message', copy.dangerIntro || 'ERROR 014: Too much awesome. Rebooting nephew.exe… Please remain extremely legendary.');
    buttonLabel($('#surprise-close'), 'SKIP THE DRAMA', 'arrow');
    surpriseDialog.classList.add('crash-phase');
    if (!reducedMotion) document.body.classList.add('fake-crash');
    surpriseDialog.showModal();
    $('#surprise-close')?.focus();
    surpriseTimer = setTimeout(revealSurprise, reducedMotion ? 700 : 1500);
  });
  on('#surprise-close', 'click', () => surpriseDialog?.close());
  surpriseDialog?.addEventListener('close', () => {
    clearTimeout(surpriseTimer); surpriseTimer = 0;
    document.body.classList.remove('fake-crash');
    surpriseDialog.classList.remove('crash-phase');
    if (!surpriseRevealed && !suppressSurpriseToast) { toast(dangerReveal); confetti(45); }
    if (surpriseReturnFocus?.isConnected) surpriseReturnFocus.focus({ preventScroll: true });
  });

  setText('#final-message', content.message || 'Yasso, keep building crazy ideas, asking big questions, and turning “what if?” into “look what I made.” I’m proud of the smart, funny person you are becoming. Whatever level comes next, I’m always on your team. I love you, Yasso! — Uncle Osama');
  const initialHeartHint = $('#heart-hint')?.textContent || 'Psst. Some hearts have cheat codes.';
  let hearts = 0;
  on('#heart-button', 'click', () => {
    if (hearts >= 5) return;
    hearts += 1;
    if (hearts === 5) {
      setText('#heart-hint', copy.heartUnlock || 'CHEAT CODE ACCEPTED: Infinite uncle love. No cooldown. No expiry. ♥');
      $('#heart-button')?.classList.add('is-unlocked');
      $('#heart-button')?.setAttribute('aria-label', 'Secret unlocked: infinite uncle love');
      sound('reward'); confetti(80);
    } else setText('#heart-hint', `${5 - hearts} more ${hearts === 4 ? 'tap' : 'taps'} to unlock something sweet…`);
  });

  function replay() {
    started = false;
    adventureRun += 1;
    pauseMusic();
    video?.pause();
    if (video && Number.isFinite(video.duration)) video.currentTime = 0;
    if (clip?.src && !video?.error) hide('#video-play', false);
    document.body.classList.remove('started', 'fake-crash');
    $('#adventure')?.setAttribute('inert', '');
    hide('#adventure');
    hide('#welcome-banner');
    $('#hero')?.classList.remove('launching');
    $('#hero .game-scene')?.classList.remove('launching');
    const startButton = $('#start-button');
    buttonLabel(startButton, 'PRESS START', 'arrow');
    if (startButton) startButton.disabled = false;
    setText('#player-status', 'SERVER ONLINE');
    observers.forEach(observer => observer.disconnect()); observers.length = 0;
    achievements.clear(); finaleCelebrated = false;
    $$('[data-achievement]').forEach(badge => {
      badge.classList.remove('unlocked'); delete badge.dataset.unlocked; badge.removeAttribute('aria-label');
    });
    $('#stats')?.classList.remove('is-visible');
    $$('.stat-fill').forEach(fill => { fill.style.width = '0%'; fill.style.setProperty('--fill', '0%'); fill.classList.remove('is-visible'); });
    clearTimeout(chestTimer); chestTimer = 0;
    chestOpen = false; photoIndex = 0;
    hide('#chest-closed', false); hide('#loot-reveal');
    $('#chest-button')?.classList.remove('is-open');
    $('#chest-button .chest')?.classList.remove('is-open');
    $('#chest-button')?.setAttribute('aria-expanded', 'false');
    if ($('#chest-button')) $('#chest-button').disabled = false;
    if (photoDialog?.open) photoDialog.close();
    photoReturnFocus = null;
    syncPhoto();
    if (hotbar) hotbar.scrollLeft = 0;
    resetBuilder(); resetBugs(); resetQuiz();
    hearts = 0; setText('#heart-hint', initialHeartHint);
    $('#heart-button')?.classList.remove('is-unlocked');
    $('#heart-button')?.setAttribute('aria-label', 'A pixel heart with a secret. Tap five times.');
    suppressSurpriseToast = true;
    clearTimeout(surpriseTimer); surpriseTimer = 0;
    if (surpriseDialog?.open) surpriseDialog.close();
    surpriseReturnFocus = null;
    clearTimeout(toastTimer); hide('#toast'); $('#toast')?.classList.remove('visible');
    stopConfetti();
    hide('#mobile-menu'); $('#menu-toggle')?.setAttribute('aria-expanded', 'false');
    $('#menu-toggle')?.setAttribute('aria-label', 'Open navigation');
    runBoot();
    startButton?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }
  on('#replay-button', 'click', replay);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pauseMusic(); stopBugs(); stopConfetti(); }
    else { resumeMusic(); animateBugs(); }
  });
  window.addEventListener('resize', () => { if (confettiFrame) sizeCanvas(); measureArena(); placeBugs(0, true); }, { passive: true });
  const motionChanged = event => {
    reducedMotion = event.matches;
    if (reducedMotion) { stopConfetti(); finishBoot(); document.body.classList.remove('fake-crash'); }
    animateBugs();
  };
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', motionChanged);
  else motionQuery.addListener(motionChanged);
  runBoot();
})();
