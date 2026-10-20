import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, THEME, LEVELS } from '../config/gameConfig.js';
import { sounds } from '../audio/SoundManager.js';
import { sdk } from '../sdk/PlayablesSDK.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.progress = sdk.loadGameProgress();

    // Background graphics
    this.bgGraphics = this.add.graphics();
    this.drawBackground();

    // Sound toggle in top right
    this.createSoundButton();

    // Game Title
    const title = this.add.text(GAME_WIDTH / 2, 220, 'SLINGGRID', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '68px',
      fontWeight: '900',
      color: '#00f0ff',
      letterSpacing: 4
    }).setOrigin(0.5);

    // Glowing title shadow
    title.setShadow(0, 0, '#00f0ff', 25, true, true);

    const subtitle = this.add.text(GAME_WIDTH / 2, 290, 'ORBITAL PHYSICS PUZZLE', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '20px',
      fontWeight: '600',
      color: '#ffd700',
      letterSpacing: 3
    }).setOrigin(0.5);

    // Animated floating demo orb
    this.createHeroAnimation();

    // Primary Quick Play button
    const currentLvl = Math.min(this.progress.unlockedLevel || 1, LEVELS.length);
    this.createButton(GAME_WIDTH / 2, 570, `PLAY LEVEL ${currentLvl}`, '#00f0ff', '#081729', () => {
      sounds.playClick();
      this.scene.start('GameScene', { levelId: currentLvl });
    });

    // Level Select Section Header
    this.add.text(GAME_WIDTH / 2, 670, '— SELECT SECTOR —', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '17px',
      fontWeight: '700',
      color: '#8ea2c6',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Level Select Buttons
    this.createLevelSelect();

    // Quick Instructions Box
    this.createInstructions();

    // Signal game ready to SDK
    sdk.gameReady();
  }

  drawBackground() {
    this.bgGraphics.clear();
    this.bgGraphics.fillStyle(THEME.bg, 1);
    this.bgGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Subtle Grid lines
    this.bgGraphics.lineStyle(1, THEME.grid, 0.45);
    const gridSize = 60;
    for (let x = 0; x <= GAME_WIDTH; x += gridSize) {
      this.bgGraphics.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y <= GAME_HEIGHT; y += gridSize) {
      this.bgGraphics.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  createHeroAnimation() {
    const heroGfx = this.add.graphics();
    let angle = 0;
    const centerX = GAME_WIDTH / 2;
    const centerY = 410;
    const orbitRadius = 75;

    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        angle += 0.045;
        heroGfx.clear();

        // Central Anchor Node
        heroGfx.lineStyle(1.5, THEME.gold, 0.4);
        heroGfx.strokeCircle(centerX, centerY, orbitRadius);

        heroGfx.fillStyle(THEME.gold, 0.25);
        heroGfx.fillCircle(centerX, centerY, 24);
        heroGfx.fillStyle(THEME.gold, 0.95);
        heroGfx.fillCircle(centerX, centerY, 18);
        heroGfx.fillStyle(0x090c19, 1);
        heroGfx.fillCircle(centerX, centerY, 8);

        // Orbiting Hero Orb
        const ox = centerX + Math.cos(angle) * orbitRadius;
        const oy = centerY + Math.sin(angle) * orbitRadius;

        // Tether line
        heroGfx.lineStyle(2, THEME.gold, 0.7);
        heroGfx.lineBetween(centerX, centerY, ox, oy);

        // Orb body
        heroGfx.fillStyle(THEME.orb, 0.3);
        heroGfx.fillCircle(ox, oy, 18);
        heroGfx.fillStyle(THEME.orb, 1);
        heroGfx.fillCircle(ox, oy, 12);
        heroGfx.fillStyle(0xffffff, 0.9);
        heroGfx.fillCircle(ox, oy, 5);
      }
    });
  }

  createLevelSelect() {
    const totalLevels = LEVELS.length;
    const btnSize = 82;
    const spacing = 22;
    const totalWidth = totalLevels * btnSize + (totalLevels - 1) * spacing;
    const startX = (GAME_WIDTH - totalWidth) / 2 + btnSize / 2;
    const y = 740;

    const unlocked = this.progress.unlockedLevel || 1;
    const starsData = this.progress.levelStars || {};

    for (let i = 0; i < totalLevels; i++) {
      const levelId = i + 1;
      const x = startX + i * (btnSize + spacing);
      const isUnlocked = levelId <= unlocked;
      const starsEarned = starsData[levelId] || 0;

      const container = this.add.container(x, y);

      const bg = this.add.graphics();
      bg.fillStyle(isUnlocked ? 0x121b38 : 0x0c1020, 0.9);
      bg.lineStyle(2, isUnlocked ? 0x00f0ff : 0x22304d, 0.8);
      bg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
      bg.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
      container.add(bg);

      // Level number or Lock icon
      if (isUnlocked) {
        const numText = this.add.text(0, -10, `${levelId}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '28px',
          fontWeight: '800',
          color: '#ffffff'
        }).setOrigin(0.5);
        container.add(numText);

        // Stars display (e.g. ★★★)
        let starStr = '☆☆☆';
        if (starsEarned === 3) starStr = '★★★';
        else if (starsEarned === 2) starStr = '★★☆';
        else if (starsEarned === 1) starStr = '★☆☆';

        const starText = this.add.text(0, 18, starStr, {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: starsEarned > 0 ? '#ffd700' : '#495a7d'
        }).setOrigin(0.5);
        container.add(starText);

        container.setSize(btnSize, btnSize);
        container.setInteractive({ useHandCursor: true });
        container.on('pointerdown', () => {
          sounds.playClick();
          this.scene.start('GameScene', { levelId });
        });

        container.on('pointerover', () => {
          bg.clear();
          bg.fillStyle(0x192852, 1);
          bg.lineStyle(2, 0xffd700, 1);
          bg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
          bg.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
        });

        container.on('pointerout', () => {
          bg.clear();
          bg.fillStyle(0x121b38, 0.9);
          bg.lineStyle(2, 0x00f0ff, 0.8);
          bg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
          bg.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
        });
      } else {
        const lockText = this.add.text(0, 0, '🔒', {
          fontSize: '24px'
        }).setOrigin(0.5);
        container.add(lockText);
      }
    }
  }

  createInstructions() {
    const panelY = 940;
    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(0x0e1428, 0.85);
    panelGfx.lineStyle(1.5, 0x1f2e54, 0.75);
    panelGfx.fillRoundedRect(40, panelY, GAME_WIDTH - 80, 240, 16);
    panelGfx.strokeRoundedRect(40, panelY, GAME_WIDTH - 80, 240, 16);

    this.add.text(GAME_WIDTH / 2, panelY + 28, 'HOW TO PLAY', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontWeight: '800',
      color: '#00f0ff',
      letterSpacing: 2
    }).setOrigin(0.5);

    const steps = [
      '1. SLING: Drag backward on the glowing orb & release to launch.',
      '2. ORBIT: While the orb is in an Anchor aura, HOLD to tether.',
      '3. PIVOT: Release during orbit to slingshot with momentum.',
      '4. GOAL: Synchronize with the core in minimal moves for 3 stars!'
    ];

    steps.forEach((st, idx) => {
      this.add.text(65, panelY + 68 + idx * 38, st, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontWeight: '500',
        color: '#c0d0ec'
      });
    });
  }

  createButton(x, y, text, borderColor, fillColor, callback) {
    const width = 320;
    const height = 64;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor(fillColor).color, 0.95);
    bg.lineStyle(2.5, Phaser.Display.Color.HexStringToColor(borderColor).color, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
    container.add(bg);

    const btnText = this.add.text(0, 0, text, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontWeight: '800',
      color: borderColor,
      letterSpacing: 2
    }).setOrigin(0.5);
    container.add(btnText);

    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', callback);
    container.on('pointerover', () => {
      container.setScale(1.04);
    });
    container.on('pointerout', () => {
      container.setScale(1.0);
    });

    return container;
  }

  createSoundButton() {
    const btn = this.add.container(GAME_WIDTH - 60, 60);
    const bg = this.add.graphics();
    bg.fillStyle(0x101730, 0.8);
    bg.lineStyle(1.5, 0x00f0ff, 0.6);
    bg.fillCircle(0, 0, 24);
    bg.strokeCircle(0, 0, 24);
    btn.add(bg);

    const icon = this.add.text(0, 0, sounds.isMuted() ? '🔇' : '🔊', {
      fontSize: '20px'
    }).setOrigin(0.5);
    btn.add(icon);

    btn.setSize(48, 48);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      const isMuted = sounds.toggleMute();
      icon.setText(isMuted ? '🔇' : '🔊');
      sounds.playClick();
    });
  }
}
