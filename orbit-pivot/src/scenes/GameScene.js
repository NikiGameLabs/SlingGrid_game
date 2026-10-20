import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, THEME, LEVELS } from '../config/gameConfig.js';
import { Ball } from '../objects/Ball.js';
import { GravityNode } from '../objects/GravityNode.js';
import { TargetCore } from '../objects/TargetCore.js';
import { sounds } from '../audio/SoundManager.js';
import { sdk } from '../sdk/PlayablesSDK.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.levelId = data.levelId || 1;
    this.levelIndex = Math.max(0, Math.min(this.levelId - 1, LEVELS.length - 1));
    this.levelData = LEVELS[this.levelIndex];

    this.movesTaken = 0;
    this.isLevelWon = false;
    this.isPointerDown = false;
    this.activeNearNode = null;
    this.isTetherKeyDown = false;
  }

  create() {
    this.progress = sdk.loadGameProgress();

    // Graphics layers
    this.bgGraphics = this.add.graphics();
    this.gameGraphics = this.add.graphics();
    this.uiGraphics = this.add.graphics();

    this.drawBackground();

    // Initialize Objects
    this.ball = new Ball(this, this.levelData.ballStart.x, this.levelData.ballStart.y);
    this.target = new TargetCore(this.levelData.target);

    this.gravityNodes = (this.levelData.gravityNodes || []).map(cfg => new GravityNode(cfg));
    this.deflectors = (this.levelData.deflectors || []).map(cfg => ({
      ...cfg,
      angleRad: ((cfg.angle || 0) * Math.PI) / 180
    }));

    this.hazards = (this.levelData.hazards || []).map(cfg => ({
      ...cfg,
      initialX: cfg.x,
      initialY: cfg.y,
      timer: 0
    }));

    // Setup HUD
    this.createHUD();

    // Input handlers
    this.setupInput();

    // Setup lifecycle pause/resume
    sdk.setupLifecycleHandlers(
      () => { this.scene.pause(); },
      () => { this.scene.resume(); }
    );
  }

  drawBackground() {
    this.bgGraphics.clear();
    this.bgGraphics.fillStyle(THEME.bg, 1);
    this.bgGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Grid pattern
    this.bgGraphics.lineStyle(1, THEME.grid, 0.45);
    const gridSize = 60;
    for (let x = 0; x <= GAME_WIDTH; x += gridSize) {
      this.bgGraphics.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y <= GAME_HEIGHT; y += gridSize) {
      this.bgGraphics.lineBetween(0, y, GAME_WIDTH, y);
    }

    // Launch Dock Pad
    this.bgGraphics.lineStyle(2, THEME.orb, 0.4);
    this.bgGraphics.strokeCircle(this.levelData.ballStart.x, this.levelData.ballStart.y, 38);
    this.bgGraphics.fillStyle(THEME.orb, 0.08);
    this.bgGraphics.fillCircle(this.levelData.ballStart.x, this.levelData.ballStart.y, 38);
  }

  createHUD() {
    // Top Bar Container
    const headerY = 55;

    // Level Title
    this.levelText = this.add.text(45, headerY, `SECTOR ${this.levelData.id}: ${this.levelData.name.toUpperCase()}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      fontWeight: '800',
      color: '#00f0ff',
      letterSpacing: 1.5
    });

    // Subtitle / objective hint
    this.subtitleText = this.add.text(45, headerY + 28, this.levelData.subtitle, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      color: '#8ea2c6'
    });

    // Moves Counter
    this.movesText = this.add.text(45, headerY + 62, 'MOVES: 0  (3★: ≤ ' + this.levelData.maxMoves3Stars + ')', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#ffd700'
    });

    // Reset Level Button
    const resetBtn = this.add.container(GAME_WIDTH - 110, headerY + 14);
    const resetBg = this.add.graphics();
    resetBg.fillStyle(0x101730, 0.85);
    resetBg.lineStyle(1.5, 0x00f0ff, 0.7);
    resetBg.fillRoundedRect(-22, -22, 44, 44, 10);
    resetBg.strokeRoundedRect(-22, -22, 44, 44, 10);
    resetBtn.add(resetBg);
    resetBtn.add(this.add.text(0, 0, '↺', { fontSize: '24px', color: '#00f0ff' }).setOrigin(0.5));
    resetBtn.setSize(44, 44);
    resetBtn.setInteractive({ useHandCursor: true });
    resetBtn.on('pointerdown', () => {
      sounds.playClick();
      this.resetShot();
    });

    // Menu Button
    const menuBtn = this.add.container(GAME_WIDTH - 55, headerY + 14);
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x101730, 0.85);
    menuBg.lineStyle(1.5, 0x00f0ff, 0.7);
    menuBg.fillRoundedRect(-22, -22, 44, 44, 10);
    menuBg.strokeRoundedRect(-22, -22, 44, 44, 10);
    menuBtn.add(menuBg);
    menuBtn.add(this.add.text(0, 0, '✕', { fontSize: '20px', color: '#00f0ff' }).setOrigin(0.5));
    menuBtn.setSize(44, 44);
    menuBtn.setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      sounds.playClick();
      this.scene.start('MenuScene');
    });

    // Dynamic Tether Prompt Banner (center screen notification)
    this.tetherPrompt = this.add.text(GAME_WIDTH / 2, 980, 'TOUCH & HOLD TO TETHER', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      fontWeight: '900',
      color: '#ffd700',
      letterSpacing: 2
    }).setOrigin(0.5).setAlpha(0);
  }

  setupInput() {
    this.input.on('pointerdown', (pointer) => {
      this.isPointerDown = true;

      if (this.isLevelWon) return;

      if (this.ball.state === 'docked') {
        this.ball.startDrag(pointer.x, pointer.y);
      } else if (this.ball.state === 'flying') {
        // Check if inside any node aura
        if (this.activeNearNode) {
          this.ball.attachOrbit(this.activeNearNode);
        }
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (this.ball.isDragging) {
        this.ball.updateDrag(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerup', () => {
      this.isPointerDown = false;

      if (this.ball.isDragging) {
        const launched = this.ball.releaseDrag();
        if (launched) {
          this.movesTaken++;
          this.movesText.setText(`MOVES: ${this.movesTaken}  (3★: ≤ ${this.levelData.maxMoves3Stars})`);
        }
      } else if (this.ball.state === 'orbiting') {
        this.ball.detachOrbit();
      }
    });

    // Optional keyboard support (Spacebar / Arrow keys)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.spaceKey.on('down', () => {
      if (this.ball.state === 'flying' && this.activeNearNode) {
        this.ball.attachOrbit(this.activeNearNode);
      }
    });
    this.spaceKey.on('up', () => {
      if (this.ball.state === 'orbiting') {
        this.ball.detachOrbit();
      }
    });
  }

  resetShot() {
    this.ball.reset(this.levelData.ballStart.x, this.levelData.ballStart.y);
  }

  update(time, delta) {
    if (this.isLevelWon) return;

    const dt = delta / 1000;

    // Update Target
    this.target.update(dt);

    // Update Gravity Nodes
    this.activeNearNode = null;
    for (const node of this.gravityNodes) {
      node.update(dt);
      if (this.ball.state === 'flying' && node.isOrbInAura(this.ball)) {
        this.activeNearNode = node;
      }
    }

    // Auto-tether if holding down pointer when entering aura
    if (this.isPointerDown && this.ball.state === 'flying' && this.activeNearNode) {
      this.ball.attachOrbit(this.activeNearNode);
    }

    // Update Tether prompt visibility
    if (this.ball.state === 'flying' && this.activeNearNode) {
      this.tetherPrompt.setText('HOLD TO ORBIT ANCHOR').setAlpha(0.9);
    } else if (this.ball.state === 'orbiting') {
      this.tetherPrompt.setText('RELEASE TO FLING!').setAlpha(1.0);
    } else {
      this.tetherPrompt.setAlpha(0);
    }

    // Update Moving Hazards
    for (const h of this.hazards) {
      if (h.isMoving) {
        h.timer += dt * (h.moveSpeed || 1);
        const offset = Math.sin(h.timer) * (h.moveRange || 100);
        if (h.axis === 'y') {
          h.y = h.initialY + offset;
        } else {
          h.x = h.initialX + offset;
        }
      }
    }

    // Update Ball physics
    this.ball.update(dt);

    // Collision with screen boundaries
    if (this.ball.state === 'flying') {
      // Left boundary
      if (this.ball.x - this.ball.radius <= 10) {
        this.ball.x = 10 + this.ball.radius;
        this.ball.bounce(1, 0);
      }
      // Right boundary
      if (this.ball.x + this.ball.radius >= GAME_WIDTH - 10) {
        this.ball.x = GAME_WIDTH - 10 - this.ball.radius;
        this.ball.bounce(-1, 0);
      }
      // Top boundary
      if (this.ball.y - this.ball.radius <= 140) {
        this.ball.y = 140 + this.ball.radius;
        this.ball.bounce(0, 1);
      }
      // Bottom out of bounds -> reset
      if (this.ball.y >= GAME_HEIGHT + 50) {
        this.resetShot();
      }
    }

    // Collision with Deflectors
    for (const def of this.deflectors) {
      this.checkDeflectorCollision(def);
    }

    // Collision with Hazards
    for (const h of this.hazards) {
      if (this.checkHazardCollision(h)) {
        sounds.playHazard();
        this.cameras.main.shake(180, 0.015);
        this.createShatterParticles(this.ball.x, this.ball.y);
        this.resetShot();
        break;
      }
    }

    // Check Win condition with Target Core
    if (this.ball.state !== 'docked' && this.target.checkWin(this.ball)) {
      this.handleWin();
    }

    // Render Everything
    this.renderScene();
  }

  checkDeflectorCollision(def) {
    if (this.ball.state !== 'flying') return;

    // Transform ball position into deflector's local unrotated space
    const cos = Math.cos(-def.angleRad);
    const sin = Math.sin(-def.angleRad);
    const dx = this.ball.x - def.x;
    const dy = this.ball.y - def.y;
    const localX = cos * dx - sin * dy;
    const localY = sin * dx + cos * dy;

    const halfW = def.width / 2;
    const halfH = def.height / 2;

    const clampedX = Math.max(-halfW, Math.min(halfW, localX));
    const clampedY = Math.max(-halfH, Math.min(halfH, localY));

    const distX = localX - clampedX;
    const distY = localY - clampedY;
    const distSq = distX * distX + distY * distY;

    if (distSq < this.ball.radius * this.ball.radius) {
      // Normal in local space
      let localNormalX = 0;
      let localNormalY = localY >= 0 ? 1 : -1;
      if (Math.abs(distX) > Math.abs(distY)) {
        localNormalX = localX >= 0 ? 1 : -1;
        localNormalY = 0;
      }

      // Transform normal back to world space
      const worldNormalX = Math.cos(def.angleRad) * localNormalX - Math.sin(def.angleRad) * localNormalY;
      const worldNormalY = Math.sin(def.angleRad) * localNormalX + Math.cos(def.angleRad) * localNormalY;

      this.ball.bounce(worldNormalX, worldNormalY, 0.88);
    }
  }

  checkHazardCollision(h) {
    const halfW = h.width / 2;
    const halfH = h.height / 2;
    const clampedX = Math.max(h.x - halfW, Math.min(h.x + halfW, this.ball.x));
    const clampedY = Math.max(h.y - halfH, Math.min(h.y + halfH, this.ball.y));

    const distX = this.ball.x - clampedX;
    const distY = this.ball.y - clampedY;
    return (distX * distX + distY * distY) < (this.ball.radius * this.ball.radius);
  }

  createShatterParticles(x, y) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 120 + Math.random() * 180;
      const p = this.add.circle(x, y, 4, THEME.hazard, 1);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        duration: 400,
        onComplete: () => p.destroy()
      });
    }
  }

  handleWin() {
    this.isLevelWon = true;
    this.ball.state = 'won';
    sounds.playWin();

    // Calculate stars
    let stars = 1;
    if (this.movesTaken <= this.levelData.maxMoves3Stars) {
      stars = 3;
    } else if (this.movesTaken <= this.levelData.maxMoves2Stars) {
      stars = 2;
    }

    // Save progress
    const nextLevel = Math.max(this.progress.unlockedLevel || 1, this.levelData.id + 1);
    const levelStars = { ...(this.progress.levelStars || {}) };
    levelStars[this.levelData.id] = Math.max(levelStars[this.levelData.id] || 0, stars);

    sdk.saveGameProgress({
      unlockedLevel: nextLevel,
      levelStars
    });

    // Celebration fireworks particles
    this.createVictoryParticles();

    // Show Victory Screen modal
    this.time.delayedCall(450, () => {
      this.showVictoryModal(stars);
    });
  }

  createVictoryParticles() {
    const colors = [THEME.orb, THEME.gold, THEME.target, 0xffffff];
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 220;
      const col = colors[Math.floor(Math.random() * colors.length)];
      const p = this.add.circle(this.target.x, this.target.y, 5, col, 1);
      this.tweens.add({
        targets: p,
        x: this.target.x + Math.cos(angle) * dist,
        y: this.target.y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  showVictoryModal(stars) {
    const modal = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    // Dim background overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    modal.add(overlay);

    // Modal Card
    const cardW = 540;
    const cardH = 460;
    const card = this.add.graphics();
    card.fillStyle(0x0d1428, 0.96);
    card.lineStyle(2.5, THEME.target, 0.9);
    card.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 20);
    card.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 20);
    modal.add(card);

    // Title
    const title = this.add.text(0, -165, 'CORE SYNCHRONIZED!', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '28px',
      fontWeight: '900',
      color: '#00f0ff',
      letterSpacing: 2
    }).setOrigin(0.5);
    modal.add(title);

    // Moves result
    const movesDesc = this.add.text(0, -115, `Sector cleared in ${this.movesTaken} ${this.movesTaken === 1 ? 'move' : 'moves'}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontWeight: '600',
      color: '#c0d0ec'
    }).setOrigin(0.5);
    modal.add(movesDesc);

    // Star Icons display
    const starStr = stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : '★☆☆');
    const starDisplay = this.add.text(0, -50, starStr, {
      fontFamily: 'sans-serif',
      fontSize: '52px',
      color: '#ffd700'
    }).setOrigin(0.5);
    modal.add(starDisplay);

    // Action buttons
    const isLastLevel = this.levelIndex >= LEVELS.length - 1;
    const nextBtnText = isLastLevel ? 'SECTOR COMPLETE!' : 'NEXT LEVEL';

    // Next Level Button
    const nextBtn = this.createModalButton(0, 50, nextBtnText, '#00f0ff', '#0b1d3a', () => {
      sounds.playClick();
      if (isLastLevel) {
        this.scene.start('MenuScene');
      } else {
        this.scene.start('GameScene', { levelId: this.levelId + 1 });
      }
    });
    modal.add(nextBtn);

    // Replay / Menu row buttons
    const replayBtn = this.createModalButton(-130, 140, 'REPLAY', '#ffd700', '#1c1b10', () => {
      sounds.playClick();
      this.scene.restart({ levelId: this.levelId });
    }, 210, 52);
    modal.add(replayBtn);

    const menuBtn = this.createModalButton(130, 140, 'SECTORS', '#8ea2c6', '#141824', () => {
      sounds.playClick();
      this.scene.start('MenuScene');
    }, 210, 52);
    modal.add(menuBtn);

    // Entrance pop-in tween
    modal.setScale(0.8);
    modal.setAlpha(0);
    this.tweens.add({
      targets: modal,
      scale: 1,
      alpha: 1,
      duration: 320,
      ease: 'Back.easeOut'
    });
  }

  createModalButton(x, y, text, borderColor, fillColor, callback, width = 360, height = 58) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor(fillColor).color, 0.95);
    bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(borderColor).color, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    container.add(bg);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontWeight: '800',
      color: borderColor,
      letterSpacing: 1.5
    }).setOrigin(0.5);
    container.add(label);

    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', callback);
    container.on('pointerover', () => container.setScale(1.04));
    container.on('pointerout', () => container.setScale(1.0));

    return container;
  }

  renderScene() {
    this.gameGraphics.clear();

    // Draw Deflectors
    for (const def of this.deflectors) {
      this.gameGraphics.save();
      this.gameGraphics.translateCanvas(def.x, def.y);
      this.gameGraphics.rotateCanvas(def.angleRad);

      this.gameGraphics.fillStyle(THEME.deflector, 0.2);
      this.gameGraphics.fillRoundedRect(-def.width / 2, -def.height / 2, def.width, def.height, 6);

      this.gameGraphics.lineStyle(2.5, THEME.deflector, 0.95);
      this.gameGraphics.strokeRoundedRect(-def.width / 2, -def.height / 2, def.width, def.height, 6);

      this.gameGraphics.restore();
    }

    // Draw Hazards
    for (const h of this.hazards) {
      this.gameGraphics.fillStyle(THEME.hazard, 0.28);
      this.gameGraphics.fillRoundedRect(h.x - h.width / 2, h.y - h.height / 2, h.width, h.height, 6);

      this.gameGraphics.lineStyle(2.5, THEME.hazard, 0.95);
      this.gameGraphics.strokeRoundedRect(h.x - h.width / 2, h.y - h.height / 2, h.width, h.height, 6);

      // Warning hatch stripes
      this.gameGraphics.lineStyle(1.5, 0xffffff, 0.7);
      const startX = h.x - h.width / 2 + 10;
      const endX = h.x + h.width / 2 - 10;
      for (let sx = startX; sx < endX; sx += 20) {
        this.gameGraphics.lineBetween(sx, h.y - h.height / 2 + 3, sx + 10, h.y + h.height / 2 - 3);
      }
    }

    // Draw Gravity Nodes
    for (const node of this.gravityNodes) {
      const isNear = (this.activeNearNode === node);
      node.draw(this.gameGraphics, isNear);
    }

    // Draw Target Core
    this.target.draw(this.gameGraphics);

    // Draw Ball
    this.ball.draw(this.gameGraphics);
  }
}
