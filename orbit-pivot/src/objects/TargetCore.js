import { THEME } from '../config/gameConfig.js';

export class TargetCore {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.radius = config.radius || 45;
    this.rotation = 0;
    this.pulseTime = 0;
  }

  checkWin(ball) {
    const dist = Math.hypot(ball.x - this.x, ball.y - this.y);
    return dist <= (this.radius + ball.radius);
  }

  update(dt) {
    this.pulseTime += dt;
    this.rotation += dt * 1.2;
  }

  draw(graphics) {
    const pulse = 1 + Math.sin(this.pulseTime * 4) * 0.08;
    const r = this.radius * pulse;

    // Soft outer beacon glow
    graphics.fillStyle(THEME.target, 0.12);
    graphics.fillCircle(this.x, this.y, r * 1.5);

    // Outer rotating hexagon
    graphics.lineStyle(2.5, THEME.target, 0.85);
    this.drawPolygon(graphics, this.x, this.y, 6, r, this.rotation);

    // Middle counter-rotating triangle / hexagon
    graphics.lineStyle(1.8, 0xffffff, 0.75);
    this.drawPolygon(graphics, this.x, this.y, 6, r * 0.65, -this.rotation * 1.4);

    // Inner pulsing energy core
    graphics.fillStyle(THEME.target, 0.85);
    graphics.fillCircle(this.x, this.y, r * 0.32);

    // White hot center
    graphics.fillStyle(0xffffff, 0.95);
    graphics.fillCircle(this.x, this.y, r * 0.16);
  }

  drawPolygon(graphics, x, y, sides, radius, angleOffset) {
    graphics.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 + angleOffset;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) {
        graphics.moveTo(px, py);
      } else {
        graphics.lineTo(px, py);
      }
    }
    graphics.closePath();
    graphics.strokePath();
  }
}
