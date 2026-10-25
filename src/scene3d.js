import * as THREE from 'three';
import gsap from 'gsap';
import { luxuryAudio } from './audio.js';

export class RojaBottleScene {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) throw new Error('Canvas container not found');

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Groups & Meshes
    this.bottleGroup = new THREE.Group();
    this.rocksGroup = new THREE.Group();
    this.particlesGroup = new THREE.Group();
    this.mistGroup = new THREE.Group();

    // Bottle Components (for exploded view)
    this.capGroup = new THREE.Group();
    this.nozzleMesh = null;
    this.collarMesh = null;
    this.flaconMesh = null;
    this.liquidMesh = null;
    this.labelMesh = null;
    this.engravedBackMesh = null;
    this.strawMesh = null;

    // Animation & State
    this.clock = new THREE.Clock();
    this.isExploded = false;
    this.currentTheme = 'sapphire'; // 'sapphire' | 'sovereign' | 'aurora'
    this.engravedText = 'ROYALE BESPOKE';
    this.mistParticles = [];
    this.crystals = [];

    // Scroll & Scrollytelling State
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.scrollProgress = 0;
    this.baseScale = 1.0; // Grand Haute Parfumerie luxury proportion

    // Interaction states
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.targetRotation = { x: 0.1, y: -0.3 };
    this.currentRotation = { x: 0.1, y: -0.3 };
    this.mouseNormalized = { x: 0, y: 0 };

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent to blend with luxury CSS gradient

    // 2. Camera with cinematic focal length
    this.camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    this.camera.position.set(0, 0.3, 11.2);

    // 3. Renderer with high dynamic range & antialiasing
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      precision: 'mediump'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = false;
    this.container.appendChild(this.renderer.domElement);

    // 4. Create Environment Map (procedural studio reflections)
    this.setupEnvironment();

    // 5. Lighting Setup
    this.setupLighting();

    // 6. Build Bottle & Elements
    this.buildBottle();
    this.buildSurroundingCrystals();
    this.buildGoldDustParticles();
    this.buildMistSystem();

    // Assemble Hierarchy
    this.scene.add(this.rocksGroup);
    this.scene.add(this.particlesGroup);
    this.scene.add(this.bottleGroup);
    this.scene.add(this.mistGroup);

    // 7. Event Listeners
    this.setupEvents();

    // 8. Start Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupEnvironment() {
    // Generate a high quality gradient reflection texture
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 1024;
    envCanvas.height = 512;
    const ctx = envCanvas.getContext('2d');

    // Rich luxury gradient with deep sapphire and radiant gold highlights
    const grad = ctx.createLinearGradient(0, 0, envCanvas.width, envCanvas.height);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.25, '#0a1d56');
    grad.addColorStop(0.5, '#1e3a8a');
    grad.addColorStop(0.75, '#e0a93b');
    grad.addColorStop(1, '#050b20');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, envCanvas.width, envCanvas.height);

    // Add crisp softbox studio light stripes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(150, 40, 90, 430);

    ctx.fillStyle = 'rgba(212, 175, 55, 0.75)';
    ctx.fillRect(600, 50, 160, 400);

    ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.fillRect(820, 80, 120, 360);

    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.environment = envTexture;
    this.envTexture = envTexture;
  }

  setupLighting() {
    this.lightsGroup = new THREE.Group();

    // Key light: Warm gold highlighting the cap and liquid
    this.keyLight = new THREE.DirectionalLight(0xfff1cf, 2.8);
    this.keyLight.position.set(4, 5, 5);
    this.lightsGroup.add(this.keyLight);

    // Rim light: Vibrant electric sapphire blue (matches image lighting edge)
    this.rimLight = new THREE.DirectionalLight(0x1e6fff, 4.2);
    this.rimLight.position.set(-5, 2, -3);
    this.lightsGroup.add(this.rimLight);

    // Front soft fill
    this.fillLight = new THREE.DirectionalLight(0x8bc0ff, 1.2);
    this.fillLight.position.set(0, -2, 4);
    this.lightsGroup.add(this.fillLight);

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x0a1638, 1.4);
    this.lightsGroup.add(this.ambientLight);

    // Interactive mouse spotlight (subtle golden cursor reflection)
    this.cursorLight = new THREE.PointLight(0xffdf88, 2.0, 10);
    this.cursorLight.position.set(0, 0, 4);
    this.lightsGroup.add(this.cursorLight);

    this.scene.add(this.lightsGroup);
  }

  // Generate the iconic Roja Dove Royale Gold & Sapphire Front Label
  generateLabelTexture(customInscription = '') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1360;
    const ctx = canvas.getContext('2d');

    // 1. Deep Midnight Velvet Navy Background
    ctx.fillStyle = '#060a17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Metallic 24K Gold Outer Double Border
    const goldGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    goldGrad.addColorStop(0, '#f9e79f');
    goldGrad.addColorStop(0.3, '#d4af37');
    goldGrad.addColorStop(0.6, '#aa771c');
    goldGrad.addColorStop(0.85, '#f5d77f');
    goldGrad.addColorStop(1, '#b38728');

    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 14;
    ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

    ctx.lineWidth = 4;
    ctx.strokeRect(58, 58, canvas.width - 116, canvas.height - 116);

    // 3. Top Brand Typography: "ROJA DOVE"
    ctx.textAlign = 'center';
    ctx.fillStyle = goldGrad;
    ctx.font = '600 76px "Cinzel", "Playfair Display", serif';
    ctx.letterSpacing = '18px';
    ctx.fillText('ROJA DOVE', canvas.width / 2 + 9, 210);

    // Underneath: "PERFUMERY"
    ctx.font = '500 32px "Plus Jakarta Sans", "Montserrat", sans-serif';
    ctx.letterSpacing = '24px';
    ctx.fillStyle = '#edd172';
    ctx.fillText('PERFUMERY', canvas.width / 2 + 12, 275);

    // Delicate separator line
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 180, 310);
    ctx.lineTo(canvas.width / 2 + 180, 310);
    ctx.stroke();

    // 4. Iconic Royale Geometric Design (Concentric Arc & Diagonal Gold/Blue Bands)
    ctx.save();

    // Bottom-Left Sapphire Crescent
    ctx.beginPath();
    ctx.arc(120, 920, 260, 0, Math.PI * 2);
    ctx.fillStyle = '#0047e0';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(120, 920, 180, 0, Math.PI * 2);
    ctx.fillStyle = '#002685';
    ctx.fill();

    // Dynamic Arc Lines (Gold & Cyan)
    ctx.beginPath();
    ctx.arc(120, 920, 420, -0.6 * Math.PI, 0.1 * Math.PI);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#2563eb';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(120, 920, 390, -0.6 * Math.PI, 0.05 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = goldGrad;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(120, 920, 330, -0.55 * Math.PI, 0.02 * Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Curved Text: "LIMITED EDITION"
    ctx.font = '700 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '12px';

    // We can draw curved or diagonal "LIMITED EDITION"
    ctx.save();
    ctx.translate(430, 680);
    ctx.rotate(0.68);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('LIMITED EDITION', 0, 0);
    ctx.restore();

    // Bold Diagonal Royale Bar with 24K Gold & Blue Pinstripes
    ctx.save();
    ctx.translate(220, 880);
    ctx.rotate(-0.62);

    // Gold Bar
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, -18, 480, 14);

    // Blue Stripe
    ctx.fillStyle = '#0055ff';
    ctx.fillRect(0, 6, 480, 12);

    // Cyan Stripe
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 26, 480, 6);

    // "ROYALE" Typography
    ctx.font = '800 52px "Cinzel", serif';
    ctx.fillStyle = '#edd172';
    ctx.letterSpacing = '16px';
    ctx.fillText('ROYALE', 320, 100);
    ctx.restore();

    ctx.restore();

    // 5. Inscription / Bespoke Engraving on Label if provided
    if (customInscription && customInscription.trim() !== '') {
      ctx.fillStyle = '#ecc94b';
      ctx.font = 'italic 500 24px "Cinzel", serif';
      ctx.letterSpacing = '4px';
      ctx.fillText(`“${customInscription.toUpperCase()}”`, canvas.width / 2, 1240);
    } else {
      ctx.fillStyle = 'rgba(237, 209, 114, 0.65)';
      ctx.font = '600 22px "Cinzel", serif';
      ctx.letterSpacing = '6px';
      ctx.fillText('EXTRAIT DE PARFUM • 50 ML', canvas.width / 2, 1240);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    return texture;
  }

  // Procedural Flacon Glass Geometry with Thick Crystal Base
  buildBottle() {
    // === 1. Outer Heavy Crystal Flacon ===
    const flaconWidth = 2.4;
    const flaconHeight = 3.3;
    const flaconDepth = 1.35;
    const radius = 0.08;

    // Use clean low-poly BoxGeometry for instant rendering
    const glassGeo = new THREE.BoxGeometry(flaconWidth, flaconHeight, flaconDepth);

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xebf3ff,
      transparent: true,
      opacity: 0.36,
      roughness: 0.04,
      metalness: 0.15,
      envMapIntensity: 2.2,
      side: THREE.FrontSide
    });

    this.flaconMesh = new THREE.Mesh(glassGeo, glassMat);
    this.flaconMesh.position.y = 0;
    this.bottleGroup.add(this.flaconMesh);

    // === 2. Inner Golden Liquid Elixir ===
    const liquidGeo = new THREE.BoxGeometry(flaconWidth - 0.28, flaconHeight - 1.05, flaconDepth - 0.28);
    const liquidMat = new THREE.MeshStandardMaterial({
      color: 0xdf9328, // Radiant amber-gold
      emissive: 0x4a2805,
      emissiveIntensity: 0.55,
      roughness: 0.12,
      metalness: 0.15,
      transparent: true,
      opacity: 0.92
    });

    this.liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    this.liquidMesh.position.y = 0.42; // Elevated to reveal bottom solid crystal block
    this.bottleGroup.add(this.liquidMesh);

    // === 3. Internal Golden Suction Straw / Dip Tube ===
    const strawGeo = new THREE.CylinderGeometry(0.024, 0.024, flaconHeight - 1.1, 12);
    const strawMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.2
    });
    this.strawMesh = new THREE.Mesh(strawGeo, strawMat);
    this.strawMesh.position.set(0.04, 0.42, 0);
    this.strawMesh.rotation.z = 0.03;
    this.bottleGroup.add(this.strawMesh);

    // === 4. High-Gloss Front Label Plaque ===
    const labelWidth = flaconWidth * 0.76;
    const labelHeight = flaconHeight * 0.72;
    const labelGeo = new THREE.PlaneGeometry(labelWidth, labelHeight);

    this.labelTexture = this.generateLabelTexture();
    const labelMat = new THREE.MeshStandardMaterial({
      map: this.labelTexture,
      roughness: 0.25,
      metalness: 0.45,
      side: THREE.FrontSide
    });

    this.labelMesh = new THREE.Mesh(labelGeo, labelMat);
    this.labelMesh.position.set(0, 0.08, flaconDepth / 2 + 0.008);
    this.bottleGroup.add(this.labelMesh);

    // Back Facet Engraving Plaque
    const backGeo = new THREE.PlaneGeometry(labelWidth * 0.8, 0.6);
    this.backCanvas = document.createElement('canvas');
    this.backCanvas.width = 512;
    this.backCanvas.height = 160;
    this.updateBackEngravingTexture('ROYALE BESPOKE • LIMITED 500');
    this.backTexture = new THREE.CanvasTexture(this.backCanvas);

    const backMat = new THREE.MeshStandardMaterial({
      map: this.backTexture,
      transparent: true,
      roughness: 0.2,
      metalness: 0.8,
      side: THREE.BackSide
    });
    this.engravedBackMesh = new THREE.Mesh(backGeo, backMat);
    this.engravedBackMesh.position.set(0, -0.6, -flaconDepth / 2 - 0.008);
    this.bottleGroup.add(this.engravedBackMesh);

    // === 5. Neck, Collar & Sprayer Assembly ===
    const neckCollarGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.35, 32);
    const goldCapMat = new THREE.MeshStandardMaterial({
      color: 0xf3d274,
      metalness: 0.98,
      roughness: 0.14
    });
    this.collarMesh = new THREE.Mesh(neckCollarGeo, goldCapMat);
    this.collarMesh.position.y = flaconHeight / 2 + 0.17;
    this.bottleGroup.add(this.collarMesh);

    // Sprayer Actuator Button (depresses when sprayed)
    const nozzleGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.35, 32);
    this.nozzleMesh = new THREE.Mesh(nozzleGeo, goldCapMat);
    this.nozzleMesh.position.y = flaconHeight / 2 + 0.38;
    this.bottleGroup.add(this.nozzleMesh);

    // Tiny spray orifice hole
    const orificeGeo = new THREE.SphereGeometry(0.03, 16, 16);
    const orificeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const orificeMesh = new THREE.Mesh(orificeGeo, orificeMat);
    orificeMesh.position.set(0, flaconHeight / 2 + 0.42, 0.24);
    this.bottleGroup.add(orificeMesh);

    // === 6. Iconic Roja Dove Stepped Faceted 24K Gold Cap ===
    this.buildGoldCap();
    this.capGroup.position.y = flaconHeight / 2 + 0.55;
    this.bottleGroup.add(this.capGroup);
  }

  updateBackEngravingTexture(text) {
    const ctx = this.backCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.backCanvas.width, this.backCanvas.height);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, this.backCanvas.width - 16, this.backCanvas.height - 16);

    ctx.fillStyle = '#ecc94b';
    ctx.textAlign = 'center';
    ctx.font = '700 22px "Cinzel", serif';
    ctx.letterSpacing = '6px';
    ctx.fillText(text.toUpperCase(), this.backCanvas.width / 2, 85);

    ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.letterSpacing = '4px';
    ctx.fillText('HAUTE PARFUMERIE • LONDON', this.backCanvas.width / 2, 120);

    if (this.backTexture) {
      this.backTexture.needsUpdate = true;
    }
  }

  buildGoldCap() {
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5d376,
      metalness: 0.98,
      roughness: 0.12,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1
    });

    // 1. Lower Stepped Plinth
    const plinthGeo = new THREE.BoxGeometry(1.5, 0.32, 1.15);
    const plinth = new THREE.Mesh(plinthGeo, goldMat);
    this.capGroup.add(plinth);

    // 2. Middle Fluted / Stepped Body with Notched Corners
    const midGeo = new THREE.BoxGeometry(1.65, 0.55, 1.25);
    const mid = new THREE.Mesh(midGeo, goldMat);
    mid.position.y = 0.38;
    this.capGroup.add(mid);

    // 3. Iconic Top Crown Facet Plate
    const topPlateGeo = new THREE.BoxGeometry(1.4, 0.15, 1.0);
    const topPlate = new THREE.Mesh(topPlateGeo, goldMat);
    topPlate.position.y = 0.72;
    this.capGroup.add(topPlate);

    // 4. Faceted Gem Crystal Inlays (Signature Roja Dove Cap stones)
    const gemGeo = new THREE.OctahedronGeometry(0.12, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.05,
      envMapIntensity: 2.0
    });

    const gemPositions = [
      [-0.45, 0.76, -0.25], [0, 0.76, -0.25], [0.45, 0.76, -0.25],
      [-0.45, 0.76, 0.25],  [0, 0.76, 0.25],  [0.45, 0.76, 0.25],
      [-0.6, 0.38, 0.64],   [0, 0.38, 0.64],   [0.6, 0.38, 0.64],
      [-0.6, 0.38, -0.64],  [0, 0.38, -0.64],  [0.6, 0.38, -0.64]
    ];

    gemPositions.forEach(pos => {
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.set(...pos);
      gem.rotation.y = Math.PI / 4;
      this.capGroup.add(gem);
    });
  }

  // Build the magnificent sapphire crystal monoliths with gold veins seen in the photo
  buildSurroundingCrystals() {
    const sapphireCrystalMat = new THREE.MeshStandardMaterial({
      color: 0x072ea6,
      emissive: 0x02165c,
      emissiveIntensity: 0.45,
      roughness: 0.12,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
      envMapIntensity: 1.8
    });

    const goldVeinMat = new THREE.MeshStandardMaterial({
      color: 0xfcd34d,
      metalness: 0.98,
      roughness: 0.15,
      emissive: 0xaa771c,
      emissiveIntensity: 0.3
    });

    // 1. Giant Left Sapphire Monolith (as in reference image)
    const leftMonolith = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const rockGeo = new THREE.DodecahedronGeometry(1.6 - i * 0.25, 1);
      // Displace vertices slightly for natural crystalline facets
      const pos = rockGeo.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const vx = pos.getX(j);
        const vy = pos.getY(j);
        const vz = pos.getZ(j);
        pos.setXYZ(j, vx * (1 + (Math.sin(j * 1.5) * 0.15)), vy * 1.6, vz * (1 + (Math.cos(j * 1.2) * 0.15)));
      }
      rockGeo.computeVertexNormals();

      const rockMesh = new THREE.Mesh(rockGeo, sapphireCrystalMat);
      rockMesh.position.set(-0.2 * i, (i - 1.5) * 2.0, (i % 2) * 0.3);
      rockMesh.rotation.set(0.3 * i, 0.4 * i, -0.2 * i);
      leftMonolith.add(rockMesh);

      // Gold vein running down the rock fissure
      const veinGeo = new THREE.CylinderGeometry(0.04, 0.08, 2.2, 8);
      const veinMesh = new THREE.Mesh(veinGeo, goldVeinMat);
      veinMesh.position.set(0.6 - i * 0.15, (i - 1.5) * 2.0, 0.4);
      veinMesh.rotation.set(0.4, 0.2 * i, 0.3);
      leftMonolith.add(veinMesh);
    }

    leftMonolith.position.set(-6.4, 0.2, -2.0);
    leftMonolith.scale.set(1.15, 1.4, 1.15);
    leftMonolith.userData = { baseX: -6.4, baseY: 0.2, baseRotY: 0.2, speed: 0.7, floatOffset: 0 };
    this.crystals.push(leftMonolith);
    this.rocksGroup.add(leftMonolith);

    // 2. Giant Right Sapphire Monolith (as in reference image)
    const rightMonolith = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const rockGeo = new THREE.DodecahedronGeometry(1.5 - i * 0.2, 1);
      const pos = rockGeo.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const vx = pos.getX(j);
        const vy = pos.getY(j);
        const vz = pos.getZ(j);
        pos.setXYZ(j, vx * (1 + (Math.cos(j * 1.8) * 0.15)), vy * 1.65, vz * (1 + (Math.sin(j * 1.4) * 0.15)));
      }
      rockGeo.computeVertexNormals();

      const rockMesh = new THREE.Mesh(rockGeo, sapphireCrystalMat);
      rockMesh.position.set(0.2 * i, (i - 1.5) * 2.0, -(i % 2) * 0.3);
      rockMesh.rotation.set(-0.2 * i, -0.4 * i, 0.3 * i);
      rightMonolith.add(rockMesh);

      // Rich gold vein on bottom right facet
      const veinGeo = new THREE.CylinderGeometry(0.05, 0.1, 2.4, 8);
      const veinMesh = new THREE.Mesh(veinGeo, goldVeinMat);
      veinMesh.position.set(-0.5 + i * 0.1, (i - 1.5) * 2.0, 0.5);
      veinMesh.rotation.set(-0.3, 0.4, -0.5);
      rightMonolith.add(veinMesh);
    }

    rightMonolith.position.set(7.0, -0.3, -2.0);
    rightMonolith.scale.set(1.15, 1.4, 1.15);
    rightMonolith.userData = { baseX: 7.0, baseY: -0.3, baseRotY: -0.3, speed: 0.65, floatOffset: 1.5 };
    this.crystals.push(rightMonolith);
    this.rocksGroup.add(rightMonolith);
  }

  // Floating 24K Gold Stardust & Light Orbs
  buildGoldDustParticles() {
    const particleCount = 90;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);

    const goldColor = new THREE.Color(0xfde047);
    const sapphireColor = new THREE.Color(0x38bdf8);

    for (let i = 0; i < particleCount; i++) {
      // Disperse in spherical volume around bottle
      positions[i * 3] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 7;

      scales[i] = Math.random() * 0.08 + 0.02;

      // 80% gold, 20% electric sapphire
      const col = Math.random() > 0.2 ? goldColor : sapphireColor;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Canvas particle circular sprite with soft edge
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    const radGrad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    radGrad.addColorStop(0.35, 'rgba(255, 230, 130, 0.8)');
    radGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    pCtx.fillStyle = radGrad;
    pCtx.fillRect(0, 0, 64, 64);
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const material = new THREE.PointsMaterial({
      size: 0.16,
      map: pTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particlesMesh = new THREE.Points(geometry, material);
    this.particlesGroup.add(this.particlesMesh);
  }

  // Interactive Volumetric Mist Spray System
  buildMistSystem() {
    this.mistParticleCount = 80;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.mistParticleCount * 3);
    const opacities = new Float32Array(this.mistParticleCount);

    for (let i = 0; i < this.mistParticleCount; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 9999; // start off-screen
      pos[i * 3 + 2] = 0;
      opacities[i] = 0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mistMat = new THREE.PointsMaterial({
      size: 0.14,
      color: 0x93c5fd,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.mistPoints = new THREE.Points(geo, mistMat);
    this.mistGroup.add(this.mistPoints);
  }

  // Trigger Perfume Mist Spray Action
  triggerSpray() {
    // 1. Play sound effect
    luxuryAudio.playSpraySound();

    // 2. Depress the golden spray nozzle
    gsap.to(this.nozzleMesh.position, {
      y: 3.3 / 2 + 0.28,
      duration: 0.12,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });

    // 3. Slight gentle recoil on the bottle
    gsap.to(this.bottleGroup.position, {
      z: -0.15,
      y: -0.05,
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      ease: 'back.out(2)'
    });

    // 4. Fire particles from nozzle orifice
    const positions = this.mistPoints.geometry.attributes.position.array;
    this.mistParticles = [];

    const origin = new THREE.Vector3(0, 3.3 / 2 + 0.42, 0.24);
    // Transform to world coordinates based on current bottle rotation
    origin.applyEuler(this.bottleGroup.rotation);
    origin.add(this.bottleGroup.position);

    for (let i = 0; i < this.mistParticleCount; i++) {
      positions[i * 3] = origin.x;
      positions[i * 3 + 1] = origin.y;
      positions[i * 3 + 2] = origin.z;

      // Conical mist trajectory forward and upward
      const spreadX = (Math.random() - 0.5) * 1.5;
      const spreadY = Math.random() * 1.4 + 0.4;
      const spreadZ = Math.random() * 2.8 + 1.2;

      this.mistParticles.push({
        vx: spreadX,
        vy: spreadY,
        vz: spreadZ,
        life: 1.0,
        decay: Math.random() * 0.015 + 0.012
      });
    }

    this.mistPoints.material.opacity = 0.85;
    this.mistPoints.geometry.attributes.position.needsUpdate = true;
  }

  // Exploded Bottle Architecture Mode
  toggleExplodedView(shouldExplode) {
    if (shouldExplode === undefined) {
      this.isExploded = !this.isExploded;
    } else {
      this.isExploded = shouldExplode;
    }

    const duration = 1.4;
    const ease = 'power3.inOut';

    if (this.isExploded) {
      luxuryAudio.playCrystalChime(1.2);
      // Explode cap upwards
      gsap.to(this.capGroup.position, { y: 3.3 / 2 + 2.2, duration, ease });
      gsap.to(this.capGroup.rotation, { y: 0.4, x: -0.2, duration, ease });

      // Atomizer nozzle lifts
      gsap.to(this.nozzleMesh.position, { y: 3.3 / 2 + 1.35, duration, ease });

      // Collar lifts slightly
      gsap.to(this.collarMesh.position, { y: 3.3 / 2 + 0.75, duration, ease });

      // Label plaque moves forward
      gsap.to(this.labelMesh.position, { z: 1.35 / 2 + 0.85, duration, ease });

      // Liquid core shifts sideways and glows
      gsap.to(this.liquidMesh.position, { x: 0.8, y: 0.6, duration, ease });
      gsap.to(this.liquidMesh.material, { emissiveIntensity: 1.2, duration });

      // Straw slides out
      gsap.to(this.strawMesh.position, { x: 0.8, y: 0.9, duration, ease });

      // Flacon shifts slightly backward
      gsap.to(this.flaconMesh.position, { z: -0.4, duration, ease });
    } else {
      luxuryAudio.playCrystalChime(0.9);
      // Assemble everything back into flawless alignment
      gsap.to(this.capGroup.position, { y: 3.3 / 2 + 0.55, duration, ease });
      gsap.to(this.capGroup.rotation, { y: 0, x: 0, duration, ease });
      gsap.to(this.nozzleMesh.position, { y: 3.3 / 2 + 0.38, duration, ease });
      gsap.to(this.collarMesh.position, { y: 3.3 / 2 + 0.17, duration, ease });
      gsap.to(this.labelMesh.position, { z: 1.35 / 2 + 0.008, duration, ease });
      gsap.to(this.liquidMesh.position, { x: 0, y: 0.42, duration, ease });
      gsap.to(this.liquidMesh.material, { emissiveIntensity: 0.55, duration });
      gsap.to(this.strawMesh.position, { x: 0.04, y: 0.42, duration, ease });
      gsap.to(this.flaconMesh.position, { z: 0, duration, ease });
    }

    return this.isExploded;
  }

  // Custom Bespoke Engraving on Bottle
  setBespokeEngraving(name) {
    this.engravedText = name || 'ROYALE BESPOKE';
    // Update Front Label with new inscription
    this.labelMesh.material.map = this.generateLabelTexture(this.engravedText);
    this.labelMesh.material.map.needsUpdate = true;

    // Update Back Plate Engraving
    this.updateBackEngravingTexture(this.engravedText);

    // Gently rotate bottle to showcase the engraving
    luxuryAudio.playGoldChime();
    gsap.to(this.targetRotation, {
      y: this.targetRotation.y + Math.PI * 2,
      duration: 1.8,
      ease: 'power2.inOut'
    });
  }

  // Switch Lighting Themes
  setAtmosphere(themeName) {
    this.currentTheme = themeName;
    luxuryAudio.playCrystalChime(1.1);

    if (themeName === 'sapphire') {
      // Midnight Sapphire
      gsap.to(this.rimLight.color, { r: 0.12, g: 0.43, b: 1.0, duration: 1.2 });
      gsap.to(this.keyLight.color, { r: 1.0, g: 0.94, b: 0.81, duration: 1.2 });
      this.renderer.toneMappingExposure = 1.35;
    } else if (themeName === 'sovereign') {
      // Sovereign Gold & Amber Sunset
      gsap.to(this.rimLight.color, { r: 0.95, g: 0.72, b: 0.22, duration: 1.2 });
      gsap.to(this.keyLight.color, { r: 1.0, g: 0.82, b: 0.5, duration: 1.2 });
      this.renderer.toneMappingExposure = 1.45;
    } else if (themeName === 'aurora') {
      // Royal Aurora (Violet & Cyan)
      gsap.to(this.rimLight.color, { r: 0.65, g: 0.25, b: 1.0, duration: 1.2 });
      gsap.to(this.keyLight.color, { r: 0.2, g: 0.9, b: 1.0, duration: 1.2 });
      this.renderer.toneMappingExposure = 1.4;
    }
  }

  // Camera Focus to specific bottle hotspot
  focusHotspot(hotspotKey) {
    luxuryAudio.playCrystalChime(1.0);
    const duration = 1.3;
    const ease = 'power2.inOut';

    switch (hotspotKey) {
      case 'crown':
        gsap.to(this.camera.position, { x: 0, y: 1.8, z: 4.8, duration, ease });
        gsap.to(this.targetRotation, { x: 0.25, y: 0.2, duration, ease });
        break;
      case 'plaque':
        gsap.to(this.camera.position, { x: 0, y: 0.2, z: 5.2, duration, ease });
        gsap.to(this.targetRotation, { x: 0.05, y: -0.1, duration, ease });
        break;
      case 'liquid':
        gsap.to(this.camera.position, { x: 0.4, y: 0.3, z: 4.5, duration, ease });
        gsap.to(this.targetRotation, { x: -0.1, y: 0.4, duration, ease });
        break;
      case 'base':
        gsap.to(this.camera.position, { x: 0, y: -1.2, z: 5.0, duration, ease });
        gsap.to(this.targetRotation, { x: -0.35, y: -0.3, duration, ease });
        break;
      default:
        gsap.to(this.camera.position, { x: 0, y: 0.2, z: 7.2, duration, ease });
        gsap.to(this.targetRotation, { x: 0.1, y: -0.3, duration, ease });
        break;
    }
  }

  getScrollStage(p) {
    const isMobile = window.innerWidth < 768;

    // Curated Scroll Stages:
    // Stage 0 (0.00): Hero Showcase (Safely below header, generous headroom)
    // Stage 1 (0.28): Olfactory Symphony (Right empty stage beside notes)
    // Stage 2 (0.55): Craftsmanship (Right empty stage, showcasing 24K cap & crystal base)
    // Stage 3 (0.76): Bespoke Engraving (Center empty stage above input, 360° rotation)
    // Stage 4 (0.83): Grand Finale completion - beginning of smooth graceful exit
    // Stage 5 (0.88): Smooth Dissolve / Exit into golden mist BEFORE Reviews & Footer
    // Stage 6 (1.00): Completely hidden - Reviews, Concierge & Footer 100% clean
    const kfs = [
      { p: 0.00, x: isMobile ? 0 : 2.1, y: -0.90, z: 0.10, rx: 0.06, ry: -0.15, s: 0.96 },
      { p: 0.28, x: isMobile ? 0 : 2.1, y: -0.80, z: 0.15, rx: 0.08, ry: -0.35, s: 0.94 },
      { p: 0.55, x: isMobile ? 0 : 2.1, y: -0.80, z: 0.15, rx: -0.06, ry: 0.32, s: 0.94 },
      { p: 0.76, x: isMobile ? 0 : 2.1, y: -0.80, z: 0.15, rx: 0.04, ry: Math.PI * 2, s: 0.96 },
      { p: 0.83, x: isMobile ? 0 : 2.1, y: -1.10, z: 0.00, rx: 0.04, ry: Math.PI * 2.1, s: 0.85 },
      { p: 0.88, x: isMobile ? 0 : 2.1, y: -2.80, z: -0.5, rx: 0.04, ry: Math.PI * 2.2, s: 0.00 },
      { p: 1.00, x: 0,                 y: -4.00, z: -1.0, rx: 0,     ry: 0,            s: 0.00 }
    ];

    let segIndex = 0;
    for (let i = 0; i < kfs.length - 1; i++) {
      if (p >= kfs[i].p && p <= kfs[i + 1].p) {
        segIndex = i;
        break;
      }
    }

    const kfA = kfs[segIndex];
    const kfB = kfs[segIndex + 1] || kfs[segIndex];
    const t = Math.min(1, Math.max(0, (p - kfA.p) / Math.max(0.001, kfB.p - kfA.p)));
    const smoothT = t * t * (3 - 2 * t);

    return {
      x: kfA.x + (kfB.x - kfA.x) * smoothT,
      y: kfA.y + (kfB.y - kfA.y) * smoothT,
      z: kfA.z + (kfB.z - kfA.z) * smoothT,
      rx: kfA.rx + (kfB.rx - kfA.rx) * smoothT,
      ry: kfA.ry + (kfB.ry - kfA.ry) * smoothT,
      scale: Math.max(0, kfA.s + (kfB.s - kfA.s) * smoothT)
    };
  }

  setupEvents() {
    // Scroll tracking for cinematic scrollytelling
    window.addEventListener('scroll', () => {
      this.targetScrollY = window.scrollY;
    }, { passive: true });

    // Mouse / Touch 360 Drag Controls
    const onDown = (e) => {
      if (e.target && e.target.closest('button, a, input, form, select, textarea, .note-card')) return;
      this.isDragging = true;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);

      // Track normalized cursor for parallax
      const rect = this.container.getBoundingClientRect();
      this.mouseNormalized.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNormalized.y = -(((clientY - rect.top) / rect.height) * 2 - 1);

      // Move spotlight
      this.cursorLight.position.x = this.mouseNormalized.x * 4;
      this.cursorLight.position.y = this.mouseNormalized.y * 3;

      if (!this.isDragging) return;

      const deltaX = clientX - this.previousMousePosition.x;
      const deltaY = clientY - this.previousMousePosition.y;

      this.targetRotation.y += deltaX * 0.007;
      this.targetRotation.x += deltaY * 0.007;

      // Clamp vertical tilt
      this.targetRotation.x = Math.max(-0.6, Math.min(0.6, this.targetRotation.x));

      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onUp = () => {
      this.isDragging = false;
    };

    window.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    window.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);

    // Responsive Resize
    window.addEventListener('resize', () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Smooth Scroll Interpolation
    this.scrollY += (this.targetScrollY - this.scrollY) * 0.08;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    this.scrollProgress = Math.min(1, Math.max(0, this.scrollY / maxScroll));

    // 2. Curated Scrollytelling Stage Coordinates
    const stage = this.getScrollStage(this.scrollProgress);

    // Position & Refined Luxury Scale (safely constrained below header)
    this.bottleGroup.position.x = stage.x;
    this.bottleGroup.position.z = stage.z;
    this.bottleGroup.position.y = stage.y + (stage.scale > 0.1 ? Math.sin(elapsedTime * 1.3) * 0.09 : 0);
    this.bottleGroup.scale.set(stage.scale, stage.scale, stage.scale);
    this.bottleGroup.visible = stage.scale > 0.001;

    if (!this.isDragging) {
      // Dynamic breathing sway and cursor parallax on top of scroll stage
      const swayY = stage.ry + Math.sin(elapsedTime * 0.75) * 0.22 + (this.mouseNormalized.x * 0.25);
      const swayX = stage.rx + Math.cos(elapsedTime * 0.55) * 0.06 + (-this.mouseNormalized.y * 0.15);
      this.targetRotation.y = swayY;
      this.targetRotation.x = swayX;
    }

    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;

    this.bottleGroup.rotation.x = this.currentRotation.x;
    this.bottleGroup.rotation.y = this.currentRotation.y;
    this.bottleGroup.rotation.z = Math.sin(elapsedTime * 0.65) * 0.025;

    // Moving dynamic studio lighting caustics & specular glints
    if (this.keyLight) {
      this.keyLight.position.x = 4 + Math.cos(elapsedTime * 0.6) * 1.8;
      this.keyLight.position.y = 5 + Math.sin(elapsedTime * 0.6) * 1.2;
    }
    if (this.rimLight) {
      this.rimLight.position.y = 2 + Math.sin(elapsedTime * 0.8) * 1.5;
    }

    // 3. Crystals Sink and Submerge completely when scrolling past Hero
    const rockFade = Math.max(0, 1 - (this.scrollProgress / 0.18));
    this.rocksGroup.position.y = -this.scrollProgress * 25.0;
    this.rocksGroup.scale.setScalar(Math.max(0.0001, rockFade));

    this.crystals.forEach((crystal) => {
      const { baseX, baseY, baseRotY, speed, floatOffset } = crystal.userData;
      crystal.position.x = baseX + (this.mouseNormalized.x * 0.25);
      crystal.position.y = baseY + Math.sin(elapsedTime * speed + floatOffset) * 0.12;
      crystal.rotation.y = baseRotY + Math.cos(elapsedTime * 0.5 + floatOffset) * 0.06;
    });

    // 3. Floating Gold Dust Particles - fades gently when leaving 3D stages
    if (this.particlesMesh) {
      this.particlesMesh.rotation.y = elapsedTime * 0.03;
      this.particlesMesh.rotation.x = Math.sin(elapsedTime * 0.02) * 0.05;
      const pFade = Math.max(0, 1 - Math.max(0, (this.scrollProgress - 0.80) / 0.10));
      this.particlesMesh.material.opacity = pFade * 0.85;
    }

    // 4. Animate Mist Spray Particles
    if (this.mistParticles.length > 0) {
      const positions = this.mistPoints.geometry.attributes.position.array;
      let activeCount = 0;

      for (let i = 0; i < this.mistParticles.length; i++) {
        const p = this.mistParticles[i];
        if (p.life > 0) {
          activeCount++;
          positions[i * 3] += p.vx * delta * 2.2;
          positions[i * 3 + 1] += p.vy * delta * 2.2;
          positions[i * 3 + 2] += p.vz * delta * 2.8;

          // Drag air resistance
          p.vx *= 0.94;
          p.vy *= 0.94;
          p.vz *= 0.93;
          p.life -= p.decay;
        } else {
          positions[i * 3 + 1] = 9999;
        }
      }

      this.mistPoints.geometry.attributes.position.needsUpdate = true;
      this.mistPoints.material.opacity = Math.max(0, activeCount / this.mistParticleCount) * 0.85;

      if (activeCount === 0) {
        this.mistParticles = [];
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
