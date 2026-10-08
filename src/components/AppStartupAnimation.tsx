import React, { useEffect, useState, useRef } from 'react';

export const AppStartupAnimation: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Check if running in standalone display mode (installed app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // Check if already shown in this session (skip unnecessary startup delay for warm app)
    const alreadyLaunched = sessionStorage.getItem('luccha_app_launched');

    if (isStandalone && !alreadyLaunched) {
      setIsActive(true);
      sessionStorage.setItem('luccha_app_launched', 'true');

      // Instant-feeling startup: transition into interface after ~650ms
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 650);

      // Clean unmount after ~850ms
      const removeTimer = setTimeout(() => {
        setIsActive(false);
      }, 850);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  // Canvas Particle Animation
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);
    const centerX = width / 2;
    const centerY = height / 2;

    // Generate lightweight micro-particles
    const particleCount = 42;
    const particles = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 120;
      return {
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        targetX: centerX + (Math.random() - 0.5) * 36,
        targetY: centerY + (Math.random() - 0.5) * 36,
        size: 1 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#4fa6ce' : '#ce729c',
        speed: 0.08 + Math.random() * 0.06,
        alpha: 0.2 + Math.random() * 0.8,
      };
    });

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle micro-chip circuit bus lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - 60, centerY);
      ctx.lineTo(centerX + 60, centerY);
      ctx.moveTo(centerX, centerY - 60);
      ctx.lineTo(centerX, centerY + 60);
      ctx.stroke();

      // Microchip Die Frame
      const boxSize = 54;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(centerX - boxSize / 2, centerY - boxSize / 2, boxSize, boxSize);

      // Update & draw particles converging to center
      particles.forEach((p) => {
        p.x += (p.targetX - p.x) * p.speed;
        p.y += (p.targetY - p.y) * p.speed;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Hairline connections
        if (Math.hypot(p.x - centerX, p.y - centerY) < 45) {
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = 0.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(centerX, centerY);
          ctx.stroke();
        }
      });

      // Luminous Core Glow
      const progress = Math.min(frame / 35, 1);
      const radGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40 * progress);
      radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      radGrad.addColorStop(0.3, 'rgba(79, 166, 206, 0.45)');
      radGrad.addColorStop(0.7, 'rgba(206, 114, 156, 0.25)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.globalAlpha = progress;
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40 * progress, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080a12] transition-opacity duration-300 pointer-events-none select-none ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 flex flex-col items-center gap-2 mt-28">
        <h1 className="text-sm font-medium tracking-[0.25em] text-white/90 uppercase font-sans">
          LUCCHA
        </h1>
        <div className="flex items-center gap-1.5 opacity-60">
          <span className="w-1 h-1 rounded-full bg-sky-400 animate-ping" />
          <span className="text-[10px] text-slate-400 font-mono tracking-wider">AI READY</span>
        </div>
      </div>
    </div>
  );
};
