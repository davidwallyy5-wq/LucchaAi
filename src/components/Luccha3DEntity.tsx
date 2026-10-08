import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThemeConfig } from '../types/theme';

interface Luccha3DEntityProps {
  theme: ThemeConfig;
  isInteracting?: boolean;
}

export const Luccha3DEntity: React.FC<Luccha3DEntityProps> = ({ theme, isInteracting = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef(isInteracting);
  interactionRef.current = isInteracting;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 220;
    let height = container.clientHeight || 220;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5.2;

    // Renderer with high quality anti-aliasing & alpha
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // Group for all entity components
    const entityGroup = new THREE.Group();
    scene.add(entityGroup);

    // Subtle ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Key directional light with warm champagne hint
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    // Cool rim light for liquid edge refraction
    const rimLight = new THREE.DirectionalLight(theme.canvasConfig.rimColor, 2.8);
    rimLight.position.set(-4, -3, -3);
    scene.add(rimLight);

    // Secondary fill light
    const fillLight = new THREE.DirectionalLight(theme.canvasConfig.secondaryColor, 1.5);
    fillLight.position.set(0, -4, 3);
    scene.add(fillLight);

    // Primary Core Material
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.canvasConfig.coreColor),
      emissive: new THREE.Color(theme.canvasConfig.secondaryColor),
      emissiveIntensity: 0.12,
      roughness: theme.canvasConfig.roughness,
      metalness: theme.canvasConfig.metalness,
      transmission: theme.canvasConfig.transmission,
      ior: theme.canvasConfig.ior,
      thickness: 1.6,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.95,
    });

    // Outer Liquid/Glass Shell
    let mainGeometry: THREE.BufferGeometry;
    if (theme.id === 'prismatic') {
      mainGeometry = new THREE.IcosahedronGeometry(1.2, 1);
    } else if (theme.id === 'organic-liquid') {
      mainGeometry = new THREE.SphereGeometry(1.2, 48, 48);
    } else {
      mainGeometry = new THREE.SphereGeometry(1.22, 64, 64);
    }

    const mainMesh = new THREE.Mesh(mainGeometry, coreMaterial);
    entityGroup.add(mainMesh);

    // Inner Nucleus / Optical Heart
    const innerGeometry = new THREE.OctahedronGeometry(0.55, 2);
    const innerMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.canvasConfig.secondaryColor),
      emissive: new THREE.Color(theme.canvasConfig.coreColor),
      emissiveIntensity: 0.35,
      roughness: 0.05,
      metalness: 0.25,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.85,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    entityGroup.add(innerMesh);

    // Theme Specific Extra Geometric Accents
    let particleSystem: THREE.Points | null = null;
    let orbitalRing: THREE.Mesh | null = null;
    let orbitalRing2: THREE.Mesh | null = null;
    let satelliteMesh: THREE.Mesh | null = null;

    if (theme.id === 'nano-particle') {
      // Swarm of nano particles orbiting
      const pCount = theme.canvasConfig.particleCount || 160;
      const pGeometry = new THREE.BufferGeometry();
      const pPositions = new Float32Array(pCount * 3);
      const pScales = new Float32Array(pCount);

      for (let i = 0; i < pCount; i++) {
        const radius = 1.45 + Math.random() * 0.9;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        pPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        pPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        pPositions[i * 3 + 2] = radius * Math.cos(phi);
        pScales[i] = Math.random() * 0.04 + 0.02;
      }
      pGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

      const pMaterial = new THREE.PointsMaterial({
        color: new THREE.Color(theme.canvasConfig.secondaryColor),
        size: 0.055,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });

      particleSystem = new THREE.Points(pGeometry, pMaterial);
      entityGroup.add(particleSystem);
    }

    if (theme.id === 'minimal-luxury' || theme.id === 'holographic' || theme.id === 'liquid-prism') {
      // Sleek precision titanium / prismatic halo ring
      const ringGeom = new THREE.TorusGeometry(1.68, 0.022, 16, 100);
      const ringMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(theme.id === 'minimal-luxury' ? 0xd0c4b2 : theme.canvasConfig.secondaryColor),
        metalness: 0.85,
        roughness: 0.15,
        transparent: true,
        opacity: 0.7,
      });
      orbitalRing = new THREE.Mesh(ringGeom, ringMat);
      orbitalRing.rotation.x = Math.PI / 2.8;
      orbitalRing.rotation.y = Math.PI / 6;
      entityGroup.add(orbitalRing);

      if (theme.id === 'holographic') {
        const ringGeom2 = new THREE.TorusGeometry(1.9, 0.015, 16, 100);
        orbitalRing2 = new THREE.Mesh(ringGeom2, ringMat.clone());
        orbitalRing2.rotation.x = -Math.PI / 3;
        orbitalRing2.rotation.z = Math.PI / 4;
        entityGroup.add(orbitalRing2);
      }
    }

    if (theme.id === 'organic-liquid' || theme.id === 'liquid-glass') {
      // Small satellite droplet bound in surface tension
      const satGeom = new THREE.SphereGeometry(0.28, 32, 32);
      satelliteMesh = new THREE.Mesh(satGeom, coreMaterial);
      entityGroup.add(satelliteMesh);
    }

    // Pointer Parallax & Interaction Tracking
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;
    let pulseFactor = 1.0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotationY = x * 0.9;
      targetRotationX = y * 0.9;
    };

    const handlePointerClick = () => {
      pulseFactor = 1.15;
    };

    window.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handlePointerClick);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const speed = theme.canvasConfig.flowSpeed;

      // Smooth pointer parallax damping
      currentRotationX += (targetRotationX - currentRotationX) * 0.06;
      currentRotationY += (targetRotationY - currentRotationY) * 0.06;

      entityGroup.rotation.x = currentRotationX + Math.sin(elapsedTime * 0.5 * speed) * 0.08;
      entityGroup.rotation.y = currentRotationY + elapsedTime * 0.35 * speed;

      // Smooth breathing scale
      const interactionScale = interactionRef.current ? 1.06 : 1.0;
      pulseFactor += (1.0 - pulseFactor) * 0.08;
      const breathe = Math.sin(elapsedTime * 1.8 * speed) * 0.02 + 1.0;
      const finalScale = breathe * pulseFactor * interactionScale;
      mainMesh.scale.set(finalScale, finalScale, finalScale);

      // Inner nucleus counter-rotation
      innerMesh.rotation.x = -elapsedTime * 0.6 * speed;
      innerMesh.rotation.y = elapsedTime * 0.8 * speed;

      // Particle subtle expansion/rotation
      if (particleSystem) {
        particleSystem.rotation.y = elapsedTime * 0.25 * speed;
        particleSystem.rotation.z = Math.sin(elapsedTime * 0.3) * 0.15;
      }

      // Orbital rings animation
      if (orbitalRing) {
        orbitalRing.rotation.z = elapsedTime * 0.2 * speed;
      }
      if (orbitalRing2) {
        orbitalRing2.rotation.z = -elapsedTime * 0.18 * speed;
      }

      // Satellite fluid droplet orbit
      if (satelliteMesh) {
        const satAngle = elapsedTime * 0.9 * speed;
        satelliteMesh.position.set(
          Math.cos(satAngle) * 1.62,
          Math.sin(satAngle * 1.3) * 0.45,
          Math.sin(satAngle) * 1.62
        );
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      width = container.clientWidth || 220;
      height = container.clientHeight || 220;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handlePointerClick);
      resizeObserver.disconnect();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      mainGeometry.dispose();
      innerGeometry.dispose();
      coreMaterial.dispose();
      innerMaterial.dispose();
    };
  }, [theme]);

  return (
    <div className="relative flex items-center justify-center select-none pointer-events-auto">
      {/* Soft prismatic back-halo glow */}
      <div
        className="absolute w-56 h-56 rounded-full blur-3xl opacity-45 pointer-events-none transition-all duration-700 -z-10"
        style={{
          background: `radial-gradient(circle, ${theme.canvasConfig.rimColor ? '#' + theme.canvasConfig.rimColor.toString(16).padStart(6, '0') : '#ffffff'} 0%, ${theme.accentColor} 45%, transparent 75%)`,
        }}
      />
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] flex items-center justify-center cursor-pointer transition-transform duration-300 active:scale-95"
        title="Luccha AI Physical Entity"
      />
    </div>
  );
};
