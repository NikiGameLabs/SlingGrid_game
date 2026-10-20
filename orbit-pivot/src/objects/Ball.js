import { THEME } from '../config/gameConfig.js';
import { sounds } from '../audio/SoundManager.js';

export class Ball {
  constructor(scene, startX, startY) {
    this.scene = scene;
    this.startX = startX;
    this.startY = startY;
    this.x = startX;
    this.y = startY;
    this.radius = 14;

    this.vx = 0;
    this.vy = 0;

    // States: 'docked' | 'flying' | 'orbiting' | 'dead' | 'won'
    this.state = 'docked';

    // Drag / Slingshot properties
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragCurrent = { x: 0, y: 0 };
    this.maxDragDistance = 140;
    this.launchMultiplier = 14.5;

    // Orbit properties
    this.orbitNode = null;
    this.orbitAngle = 0;
    this.orbitRadius = 0;
    this.orbitAngularSpeed = 0;

    // Visual trail
    this.trail = [];
    this.maxTrail = 18;

    // Pulse animation
    this.pulseTime = 0;
  }

  reset(x = this.startX, y = this.startY) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.state = 'docked';
    this.isDragging = false;
    this.orbitNode = null;
    this.trail = [];
  }

  startDrag(pointerX, pointerY) {
    if (this.state !== 'docked') return;
    this.isDragging = true;
    this.dragStart = { x: pointerX, y: pointerY };
    this.dragCurrent = { x: pointerX, y: pointerY };
    sounds.playSlingPull(0.2);
  }

  updateDrag(pointerX, pointerY) {
    if (!this.isDragging) return;
    this.dragCurrent = { x: pointerX, y: pointerY };

    const dx = this.dragStart.x - pointerX;
    const dy = this.dragStart.y - pointerY;
    const dist = Math.hypot(dx, dy);
    sounds.playSlingPull(dist / this.maxDragDistance);
  }

  getLaunchVelocity() {
    const dx = this.dragStart.x - this.dragCurrent.x;
    const dy = this.dragStart.y - this.dragCurrent.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 10) return { vx: 0, vy: 0, power: 0 };

    const clampedDist = Math.min(dist, this.maxDragDistance);
    const angle = Math.atan2(dy, dx);
    const speed = clampedDist * this.launchMultiplier;

    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      power: clampedDist / this.maxDragDistance,
      angle
    };
  }

  releaseDrag() {
    if (!this.isDragging) return false;
    this.isDragging = false;

    const { vx, vy, power } = this.getLaunchVelocity();
    if (power < 0.1) {
      return false;
    }

    this.vx = vx;
    this.vy = vy;
    this.state = 'flying';
    sounds.playLaunch();
    return true;
  }

  attachOrbit(node) {
    if (this.state !== 'flying') return;
    this.state = 'orbiting';
    this.orbitNode = node;

    const dx = this.x - node.x;
    const dy = this.y - node.y;
    this.orbitRadius = Math.max(Math.hypot(dx, dy), node.radius + this.radius + 6);
    this.orbitAngle = Math.atan2(dy, dx);

    // Tangential speed matching current entry speed
    const currentSpeed = Math.hypot(this.vx, this.vy) || 500;
    const direction = node.orbitSpeed >= 0 ? 1 : -1;
    this.orbitAngularSpeed = (currentSpeed / this.orbitRadius) * direction;

    sounds.playTether();
  }

  detachOrbit() {
    if (this.state !== 'orbiting' || !this.orbitNode) return;

    // Tangential launch velocity
    const tangentAngle = this.orbitAngle + (this.orbitAngularSpeed >= 0 ? Math.PI / 2 : -Math.PI / 2);
    const tangentialSpeed = Math.abs(this.orbitAngularSpeed * this.orbitRadius);

    this.vx = Math.cos(tangentAngle) * tangentialSpeed;
    this.vy = Math.sin(tangentAngle) * tangentialSpeed;
    this.state = 'flying';
    this.orbitNode = null;

    sounds.playTetherRelease();
  }

  bounce(normalX, normalY, restitution = 0.82) {
    const dot = this.vx * normalX + this.vy * normalY;
    if (dot < 0) {
      this.vx = (this.vx - 2 * dot * normalX) * restitution;
      this.vy = (this.vy - 2 * dot * normalY) * restitution;
      sounds.playBounce();
    }
  }

  update(dt) {
    this.pulseTime += dt;

    if (this.state === 'flying') {
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Slight air friction
      this.vx *= Math.pow(0.998, dt * 60);
      this.vy *= Math.pow(0.998, dt * 60);

      // Add trail point
      this.trail.unshift({ x: this.x, y: this.y, alpha: 1.0 });
      if (this.trail.length > this.maxTrail) {
        this.trail.pop();
      }
    } else if (this.state === 'orbiting' && this.orbitNode) {
      this.orbitAngle += this.orbitAngularSpeed * dt;
      this.x = this.orbitNode.x + Math.cos(this.orbitAngle) * this.orbitRadius;
      this.y = this.orbitNode.y + Math.sin(this.orbitAngle) * this.orbitRadius;

      // Add trail point
      this.trail.unshift({ x: this.x, y: this.y, alpha: 1.0 });
      if (this.trail.length > this.maxTrail) {
        this.trail.pop();
      }
    }

    // Fade trail points
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha = 1 - (i / this.trail.length);
    }
  }

  draw(graphics) {
    // Draw trail
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const radius = this.radius * (1 - (i / this.trail.length) * 0.75);
      graphics.fillStyle(THEME.orb, p.alpha * 0.35);
      graphics.fillCircle(p.x, p.y, radius);
    }

    // Draw tether beam if orbiting
    if (this.state === 'orbiting' && this.orbitNode) {
      graphics.lineStyle(2.5, THEME.gold, 0.85);
      graphics.lineBetween(this.orbitNode.x, this.orbitNode.y, this.x, this.y);

      // Draw tangent launch indicator arrow
      const tangentAngle = this.orbitAngle + (this.orbitAngularSpeed >= 0 ? Math.PI / 2 : -Math.PI / 2);
      const arrowLength = 55;
      const ax = this.x + Math.cos(tangentAngle) * arrowLength;
      const ay = this.y + Math.sin(tangentAngle) * arrowLength;

      graphics.lineStyle(2, THEME.orb, 0.9);
      graphics.lineBetween(this.x, this.y, ax, ay);

      // Arrow head
      const headAngle1 = tangentAngle + Math.PI * 0.82;
      const headAngle2 = tangentAngle - Math.PI * 0.82;
      graphics.lineBetween(ax, ay, ax + Math.cos(headAngle1) * 12, ay + Math.sin(headAngle1) * 12);
      graphics.lineBetween(ax, ay, ax + Math.cos(headAngle2) * 12, ay + Math.sin(headAngle2) * 12);
    }

    // Outer glow
    const pulse = 1 + Math.sin(this.pulseTime * 6) * 0.08;
    graphics.fillStyle(THEME.orbGlow, 0.22);
    graphics.fillCircle(this.x, this.y, (this.radius + 7) * pulse);

    // Main orb body
    graphics.fillStyle(THEME.orb, 0.95);
    graphics.fillCircle(this.x, this.y, this.radius);

    // Inner bright core
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(this.x, this.y, this.radius * 0.45);

    // Slingshot trajectory & tension line while dragging
    if (this.isDragging) {
      const { vx, vy, power } = this.getLaunchVelocity();

      // Tension elastic line from ball to drag point
      graphics.lineStyle(3, THEME.orb, 0.8);
      graphics.lineBetween(this.x, this.y, this.dragCurrent.x, this.dragCurrent.y);

      // Trajectory predictive dots
      if (power > 0.05) {
        const steps = 18;
        const timeStep = 0.04;
        let simX = this.x;
        let simY = this.y;

        for (let i = 1; i <= steps; i++) {
          simX += vx * timeStep;
          simY += vy * timeStep;

          const dotRadius = Math.max(2, 6 * (1 - i / steps));
          const dotAlpha = 0.85 * (1 - i / steps);

          graphics.fillStyle(THEME.orb, dotAlpha);
          graphics.fillCircle(simX, simY, dotRadius);
        }
      }
    }
  }
}
