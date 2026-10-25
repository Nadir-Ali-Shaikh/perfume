import { RojaBottleScene } from './scene3d.js';
import { luxuryAudio } from './audio.js';
import confetti from 'canvas-confetti';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Bottle Scene
  const scene3d = new RojaBottleScene('webgl-canvas-container');

  // 2. Custom Golden Cursor
  const cursor = document.getElementById('custom-cursor');
  const cursorDot = document.getElementById('custom-cursor-dot');

  if (cursor && cursorDot) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    });

    const renderCursor = () => {
      cursorX += (mouseX - cursorX) * 0.18;
      cursorY += (mouseY - cursorY) * 0.18;
      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
      requestAnimationFrame(renderCursor);
    };
    renderCursor();

    // Hover effect on interactive elements
    const hoverTargets = document.querySelectorAll('button, a, .note-card, input, .hud-btn-toggle, .theme-pill');
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
    });
  }

  // 3. Audio Atmosphere Toggle
  const audioBtn = document.getElementById('audio-toggle');
  const audioLabel = document.getElementById('audio-label');

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const isPlaying = luxuryAudio.toggleSound();
      if (isPlaying) {
        audioBtn.classList.add('sound-active');
        audioLabel.textContent = 'ATMOSPHERE: ACTIVE';
      } else {
        audioBtn.classList.remove('sound-active');
        audioLabel.textContent = 'ATMOSPHERE: MUTED';
      }
    });
  }

  // 4. Trigger Fragrance Mist
  const sprayBtn = document.getElementById('trigger-spray-btn');
  if (sprayBtn) {
    sprayBtn.addEventListener('click', () => {
      scene3d.triggerSpray();

      // Screen ripple / glow pulse effect
      const ambientLight = document.getElementById('ambient-light');
      if (ambientLight) {
        ambientLight.style.opacity = '1.0';
        setTimeout(() => {
          ambientLight.style.opacity = '0.7';
        }, 800);
      }
    });
  }

  // 5. Exploded Flacon Architecture Mode
  const explodeBtn = document.getElementById('toggle-exploded-btn');
  const explodeLabel = document.getElementById('exploded-label');
  if (explodeBtn) {
    explodeBtn.addEventListener('click', () => {
      const isExploded = scene3d.toggleExplodedView();
      if (isExploded) {
        explodeBtn.classList.add('active');
        explodeLabel.textContent = 'Assemble Flacon';
      } else {
        explodeBtn.classList.remove('active');
        explodeLabel.textContent = 'Exploded View';
      }
    });
  }

  // 6. Lighting Atmosphere Mood Switcher
  const themePills = document.querySelectorAll('.theme-pill');
  const ambientLight = document.getElementById('ambient-light');

  themePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      themePills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const theme = pill.dataset.theme;
      scene3d.setAtmosphere(theme);

      // Adjust background ambient lighting CSS
      if (ambientLight) {
        if (theme === 'sapphire') {
          ambientLight.style.background = 'radial-gradient(circle at 50% 40%, rgba(24, 76, 214, 0.28) 0%, rgba(4, 9, 28, 0) 70%)';
        } else if (theme === 'sovereign') {
          ambientLight.style.background = 'radial-gradient(circle at 50% 40%, rgba(212, 175, 55, 0.32) 0%, rgba(4, 9, 28, 0) 70%)';
        } else if (theme === 'aurora') {
          ambientLight.style.background = 'radial-gradient(circle at 50% 40%, rgba(147, 51, 234, 0.26) 0%, rgba(4, 9, 28, 0) 70%)';
        }
      }
    });
  });

  // 7. Hotspot Camera Focus Buttons
  const hotspotBtns = document.querySelectorAll('.hotspot-focus-btn');
  hotspotBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      hotspotBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const spot = btn.dataset.hotspot;
      scene3d.focusHotspot(spot);
    });
  });

  // 8. Bespoke 3D Engraving Form
  const engravingForm = document.getElementById('engraving-form');
  const engravingInput = document.getElementById('engraving-text-input');
  const engravingBadge = document.getElementById('engraving-status-badge');

  if (engravingForm && engravingInput) {
    const handleEngrave = (e) => {
      e.preventDefault();
      const text = engravingInput.value.trim() || 'ROYALE PRIVÉ';
      scene3d.setBespokeEngraving(text);

      if (engravingBadge) {
        engravingBadge.textContent = `ACTIVE INSCRIPTION: “${text.toUpperCase()}”`;
        engravingBadge.style.borderColor = 'var(--gold-primary)';
        engravingBadge.style.background = 'rgba(212, 175, 55, 0.25)';
        setTimeout(() => {
          engravingBadge.style.background = 'rgba(212, 175, 55, 0.1)';
        }, 1200);
      }
    };

    engravingForm.addEventListener('submit', handleEngrave);
  }

  // 9. Olfactory Pyramid Note Cards interaction
  const noteCards = document.querySelectorAll('.note-card');
  noteCards.forEach((card, index) => {
    card.addEventListener('click', () => {
      luxuryAudio.playCrystalChime(0.8 + (index % 5) * 0.15);

      // Card click flash
      card.style.transform = 'scale(0.96)';
      setTimeout(() => {
        card.style.transform = '';
      }, 180);

      // Gentle perfume mist burst
      scene3d.triggerSpray();
    });
  });

  // 10. VIP Order Modal / Drawer
  const modal = document.getElementById('order-modal');
  const openModalBtns = [
    document.getElementById('nav-reserve-btn'),
    document.getElementById('hero-order-btn')
  ];
  const closeModalBtn = document.getElementById('modal-close-btn');
  const vipOrderForm = document.getElementById('vip-order-form');

  const openModal = () => {
    if (!modal) return;
    luxuryAudio.playCrystalChime(1.1);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  openModalBtns.forEach((btn) => {
    if (btn) btn.addEventListener('click', openModal);
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });

  if (vipOrderForm) {
    vipOrderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      luxuryAudio.playGoldChime();

      // Golden Confetti Celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#f5d376', '#38bdf8', '#ffffff']
      });

      const btn = document.getElementById('btn-submit-order');
      if (btn) {
        btn.textContent = 'ALLOCATION SECURED ✓';
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        btn.style.color = '#ffffff';
      }

      setTimeout(() => {
        alert('Thank you. Your private VIP reservation for ROJA DOVE ROYALE Flacon #187 has been transmitted to our London Mayfair Concierge. Our private director will contact you directly.');
        closeModal();
        if (btn) {
          btn.textContent = 'CONFIRM PRIVATE ALLOCATION';
          btn.style.background = '';
          btn.style.color = '';
        }
      }, 1600);
    });
  }

  // 11. Navbar dynamic blur on scroll
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  });
});
