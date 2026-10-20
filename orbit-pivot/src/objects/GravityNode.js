import { THEME } from '../config/gameConfig.js';

export class GravityNode {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.radius = config.radius || 28;
    this.auraRadius = config.auraRadius || 150;
    this.orbitSpeed = config.orbitSpeed || 3.5;

    this.pulseTime = 0;
    this.rotationAngle = 0;
  }

  isOrbInAura(ball) {
    const dist = Math.hypot(ball.x - this.x, ball.y - this.y);
    return dist <= this.auraRadius;
  }

  update(dt) {
    this.pulseTime += dt;
    this.rotationAngle += this.orbitSpeed * dt * 0.4;
  }

  draw(graphics, isOrbNear = false) {
    const pulse = Math.sin(this.pulseTime * 3) * 0.05;
    const currentAura = this.auraRadius * (1 + pulse);

    // Gravitational Aura background fill
    graphics.fillStyle(THEME.gravityAura, isOrbNear ? 0.12 : 0.05);
    graphics.fillCircle(this.x, this.y, currentAura);

    // Gravitational boundary dashed ring
    graphics.lineStyle(1.5, THEME.gravityNode, isOrbNear ? 0.65 : 0.3);
    const ringSegments = 24;
    for (let i = 0; i < ringSegments; i += 2) {
      const a1 = (i / ringSegments) * Math.PI * 2 + this.rotationAngle;
      const a2 = ((i + 1) / ringSegments) * Math.PI * 2 + this.rotationAngle;
      graphics.beginPath();
      graphics.arc(this.x, this.y, currentAura, a1, a2);
      graphics.strokePath();
    }

    // Inner gravitational ripple ring
    const rippleRadius = (this.radius + (this.pulseTime * 40) % (this.auraRadius - this.radius));
    const rippleAlpha = 0.4 * (1 - (rippleRadius - this.radius) / (this.auraRadius - this.radius));
    graphics.lineStyle(1, THEME.gravityNode, rippleAlpha);
    graphics.strokeCircle(this.x, this.y, rippleRadius);

    // Outer anchor glow
    graphics.fillStyle(THEME.gravityNode, 0.25);
    graphics.fillCircle(this.x, this.y, this.radius + 6);

    // Solid core
    graphics.fillStyle(THEME.gravityNode, 0.95);
    graphics.fillCircle(this.x, this.y, this.radius);

    // Inner pivot anchor center (dark hole / vortex center)
    graphics.fillStyle(0x0a0c18, 1);
    graphics.fillCircle(this.x, this.y, this.radius * 0.42);

    // Pivot center dot
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(this.x, this.y, 4);

    // Orbit direction indicator notches
    const notches = 4;
    for (let i = 0; i < notches; i++) {
      const angle = (i / notches) * Math.PI * 2 + this.rotationAngle * 2;
      const nx = this.x + Math.cos(angle) * (this.radius - 4);
      const ny = this.y + Math.sin(angle) * (this.radius - 4);
      graphics.fillStyle(0xffffff, 0.7);
      graphics.fillCircle(nx, ny, 2.5);
    }
  }
}
