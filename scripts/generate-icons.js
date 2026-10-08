import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Core High-Res Vector SVG Icon for Luccha
// Incorporating: Micro-chip geometry, tiny connected particles, liquid-glass depth, refined 3D structure, elegant illumination, slightly sensual curves (Araan & Miku dual aura)
const createSvg = (isMaskable = false) => {
  const padding = isMaskable ? 80 : 30;
  const viewBoxSize = 512;
  const contentSize = viewBoxSize - padding * 2;
  const center = viewBoxSize / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0e17" />
      <stop offset="50%" stop-color="#121728" />
      <stop offset="100%" stop-color="#080a12" />
    </linearGradient>

    <!-- Glass Rim Caustic -->
    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.45)" />
      <stop offset="30%" stop-color="rgba(79,166,206,0.25)" />
      <stop offset="70%" stop-color="rgba(206,114,156,0.25)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0.08)" />
    </linearGradient>

    <!-- Chip Bus Gradients -->
    <linearGradient id="traceGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4fa6ce" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#60c5ea" stop-opacity="0.2" />
    </linearGradient>
    <linearGradient id="traceGradRose" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ce729c" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#e28eb3" stop-opacity="0.2" />
    </linearGradient>

    <!-- Liquid Glass Core Gradient -->
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="25%" stop-color="#6ad5f7" stop-opacity="0.7" />
      <stop offset="60%" stop-color="#ce729c" stop-opacity="0.4" />
      <stop offset="100%" stop-color="transparent" stop-opacity="0" />
    </radialGradient>

    <!-- Dual Aura Gradient for Interlocking Silhouette -->
    <linearGradient id="auraA" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="60%" stop-color="#4fa6ce" />
      <stop offset="100%" stop-color="#93c5fd" />
    </linearGradient>
    <linearGradient id="auraB" x1="100%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#be185d" />
      <stop offset="60%" stop-color="#ce729c" />
      <stop offset="100%" stop-color="#f472b6" />
    </linearGradient>

    <!-- Soft Glow Filter -->
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Base Solid Background -->
  <rect width="512" height="512" rx="${isMaskable ? '0' : '112'}" fill="url(#bgGrad)" />

  <!-- Outer Glass Rim Highlight (non-maskable) -->
  ${
    !isMaskable
      ? `<rect x="6" y="6" width="500" height="500" rx="108" fill="none" stroke="url(#rimGrad)" stroke-width="2.5" opacity="0.8" />`
      : ''
  }

  <!-- Main Scaled Group to respect Safe-Zone -->
  <g transform="translate(${isMaskable ? 40 : 0}, ${isMaskable ? 40 : 0}) scale(${isMaskable ? 0.84 : 1})">
    
    <!-- Micro-Chip Circuit Trace Lines (Background Geometry) -->
    <g opacity="0.45" stroke-width="1.5">
      <!-- Horizontal / Vertical Micro-Buses -->
      <path d="M 64 160 L 140 160 L 180 200 L 180 256" stroke="url(#traceGradCyan)" fill="none" stroke-dasharray="4 2" />
      <path d="M 448 160 L 372 160 L 332 200 L 332 256" stroke="url(#traceGradRose)" fill="none" stroke-dasharray="4 2" />
      <path d="M 64 352 L 140 352 L 180 312 L 180 256" stroke="url(#traceGradCyan)" fill="none" />
      <path d="M 448 352 L 372 352 L 332 312 L 332 256" stroke="url(#traceGradRose)" fill="none" />

      <!-- Hairline Diagonal Interconnects -->
      <line x1="120" y1="120" x2="160" y2="160" stroke="#4fa6ce" stroke-opacity="0.5" />
      <line x1="392" y1="120" x2="352" y2="160" stroke="#ce729c" stroke-opacity="0.5" />
      <line x1="120" y1="392" x2="160" y2="352" stroke="#4fa6ce" stroke-opacity="0.5" />
      <line x1="392" y1="392" x2="352" y2="352" stroke="#ce729c" stroke-opacity="0.5" />
    </g>

    <!-- Micro-Chip Quantum Particle Nodes -->
    <g fill="#60c5ea" opacity="0.85">
      <circle cx="64" cy="160" r="3.5" />
      <circle cx="140" cy="160" r="3" />
      <circle cx="180" cy="200" r="3" />
      <circle cx="120" cy="120" r="3" />
      <circle cx="64" cy="352" r="3.5" />
      <circle cx="140" cy="352" r="3" />
      <circle cx="180" cy="312" r="3" />
      <circle cx="120" cy="392" r="3" />
    </g>
    <g fill="#e28eb3" opacity="0.85">
      <circle cx="448" cy="160" r="3.5" />
      <circle cx="372" cy="160" r="3" />
      <circle cx="332" cy="200" r="3" />
      <circle cx="392" cy="120" r="3" />
      <circle cx="448" cy="352" r="3.5" />
      <circle cx="372" cy="352" r="3" />
      <circle cx="332" cy="312" r="3" />
      <circle cx="392" cy="392" r="3" />
    </g>

    <!-- Micro Silicon Die Framework (Octagonal Silicon Core Boundary) -->
    <polygon points="210,130 302,130 382,210 382,302 302,382 210,382 130,302 130,210" 
             fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
    <polygon points="220,144 292,144 368,220 368,292 292,368 220,368 144,292 144,220" 
             fill="rgba(18,24,40,0.6)" stroke="url(#rimGrad)" stroke-width="1" />

    <!-- Ambient Core Radiance -->
    <circle cx="256" cy="256" r="100" fill="url(#coreGlow)" opacity="0.65" filter="url(#softGlow)" />

    <!-- Sensual 3D Liquid-Glass Interlocking Ribbon (Araan Male & Miku Female Harmony) -->
    <!-- Wing A: Masculine poise (cool cyan-blue flow) -->
    <path d="M 210 330 C 170 290 170 210 220 180 C 260 156 295 185 275 235 C 260 270 230 295 210 330 Z"
          fill="url(#auraA)" opacity="0.92" filter="url(#softGlow)" />
    <!-- Wing B: Feminine grace (soft rose-magenta curve) -->
    <path d="M 302 182 C 342 222 342 302 292 332 C 252 356 217 327 237 277 C 252 242 282 217 302 182 Z"
          fill="url(#auraB)" opacity="0.92" filter="url(#softGlow)" />

    <!-- Inner Liquid Glass Refractive Caustic -->
    <ellipse cx="256" cy="256" rx="42" ry="58" transform="rotate(-30 256 256)" 
             fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2" opacity="0.9" />
    <ellipse cx="256" cy="256" rx="20" ry="32" transform="rotate(25 256 256)" 
             fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.95)" stroke-width="1.5" />

    <!-- Luminous Central Spark (Consciousness Core) -->
    <circle cx="256" cy="256" r="6" fill="#ffffff" filter="url(#softGlow)" />
    <circle cx="256" cy="256" r="2.5" fill="#ffffff" />

    <!-- Microscopic Constellation of Orbiting Particles -->
    <circle cx="230" cy="210" r="2.2" fill="#ffffff" opacity="0.9" />
    <circle cx="282" cy="302" r="2.2" fill="#ffffff" opacity="0.9" />
    <circle cx="218" cy="270" r="1.8" fill="#60c5ea" opacity="0.8" />
    <circle cx="294" cy="242" r="1.8" fill="#f472b6" opacity="0.8" />
    <circle cx="256" cy="180" r="1.5" fill="#ffffff" opacity="0.7" />
    <circle cx="256" cy="332" r="1.5" fill="#ffffff" opacity="0.7" />
  </g>
</svg>`;
};

async function build() {
  console.log('Generating Luccha App Icons...');

  const standardSvg = createSvg(false);
  const maskableSvg = createSvg(true);

  // Write SVGs
  fs.writeFileSync(path.join(outDir, 'icon.svg'), standardSvg);
  fs.writeFileSync(path.join(outDir, 'icon-maskable.svg'), maskableSvg);

  // 192x192 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(outDir, 'icon-192x192.png'));
  console.log('✓ Created icon-192x192.png');

  // 512x512 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(outDir, 'icon-512x512.png'));
  console.log('✓ Created icon-512x512.png');

  // 512x512 Maskable PNG
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(outDir, 'icon-maskable-512x512.png'));
  console.log('✓ Created icon-maskable-512x512.png');

  // Apple Touch Icon 180x180 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(outDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  // Favicon 48x48 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(48, 48)
    .png()
    .toFile(path.join(outDir, 'favicon-48x48.png'));
  console.log('✓ Created favicon-48x48.png');

  console.log('All Luccha icons generated successfully!');
}

build().catch((err) => {
  console.error('Failed generating icons:', err);
  process.exit(1);
});
