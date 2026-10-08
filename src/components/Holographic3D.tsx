import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AIPersona } from '../types/persona';

interface Holographic3DProps {
  persona: AIPersona;
  isListening?: boolean;
  isThinking?: boolean;
  isSpeaking?: boolean;
  isHovered?: boolean;
  size?: 'normal' | 'compact';
}

export const Holographic3D: React.FC<Holographic3DProps> = ({
  persona,
  isListening = false,
  isThinking = false,
  isSpeaking = false,
  isHovered = false,
  size = 'normal',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ isListening, isThinking, isSpeaking, isHovered, persona });
  stateRef.current = { isListening, isThinking, isSpeaking, isHovered, persona };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || (size === 'compact' ? 140 : 240);
    let height = container.clientHeight || (size === 'compact' ? 140 : 240);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Color definitions based on Persona
    let coreColorHex = 0xf0f4f9;
    let accentColorHex = 0x8ba5c4;
    let rimColorHex = 0xffffff;
    let innerCoreHex = 0xdde7f2;

    if (persona === 'Miku') {
      coreColorHex = 0xedf7fc;
      accentColorHex = 0x4fa6ce;
      rimColorHex = 0xd4f3ff;
      innerCoreHex = 0x76caea;
    } else if (persona === 'Araan') {
      coreColorHex = 0xfcf3f6;
      accentColorHex = 0xce729c;
      rimColorHex = 0xffe2ee;
      innerCoreHex = 0xeb9dbf;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(rimColorHex, 3.2);
    rimLight.position.set(-4, -3, -3);
    scene.add(rimLight);

    const bottomFill = new THREE.DirectionalLight(accentColorHex, 1.6);
    bottomFill.position.set(0, -4, 2);
    scene.add(bottomFill);

    // Primary Holographic Outer Shell (Physical Glass with high transmission & clearcoat)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(coreColorHex),
      emissive: new THREE.Color(accentColorHex),
      emissiveIntensity: 0.14,
      roughness: 0.08,
      metalness: 0.12,
      transmission: 0.94,
      ior: 1.52,
      thickness: 1.8,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.92,
    });

    const outerGeom = new THREE.SphereGeometry(1.22, 64, 64);
    const outerMesh = new THREE.Mesh(outerGeom, glassMat);
    rootGroup.add(outerMesh);

    // Inner Holographic Geometric Core (Octahedron Nucleus)
    const nucleusGeom = new THREE.OctahedronGeometry(0.58, 2);
    const nucleusMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(innerCoreHex),
      emissive: new THREE.Color(accentColorHex),
      emissiveIntensity: 0.45,
      roughness: 0.06,
      metalness: 0.35,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.88,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeom, nucleusMat);
    rootGroup.add(nucleusMesh);

    // Holographic Orbital Rings (Diffraction Gyroscope)
    const ring1Geom = new THREE.TorusGeometry(1.72, 0.016, 16, 120);
    const ringMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentColorHex),
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const ring1 = new THREE.Mesh(ring1Geom, ringMat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    rootGroup.add(ring1);

    const ring2Geom = new THREE.TorusGeometry(1.92, 0.012, 16, 120);
    const ring2 = new THREE.Mesh(ring2Geom, ringMat.clone());
    ring2.rotation.x = -Math.PI / 3.2;
    ring2.rotation.z = Math.PI / 4;
    rootGroup.add(ring2);

    // Micro Nano Particle Cloud
    const particleCount = 140;
    const pGeometry = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.45 + Math.random() * 0.95;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pPositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    pGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

    const pMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(accentColorHex),
      size: 0.05,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeometry, pMaterial);
    rootGroup.add(particles);

    // Mouse Pointer Parallax
    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;
    let pulseFactor = 1.0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 0.8;
      targetRotX = y * 0.8;
    };

    const handlePointerClick = () => {
      pulseFactor = 1.18;
    };

    window.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handlePointerClick);

    // Animation Loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const { isListening, isThinking, isSpeaking, isHovered } = stateRef.current;

      // Pointer damping
      curRotX += (targetRotX - curRotX) * 0.06;
      curRotY += (targetRotY - curRotY) * 0.06;

      rootGroup.rotation.x = curRotX + Math.sin(elapsedTime * 0.6) * 0.06;
      rootGroup.rotation.y = curRotY + elapsedTime * 0.45;

      // Dynamic scales and states
      pulseFactor += (1.0 - pulseFactor) * 0.08;
      let stateScale = 1.0;
      if (isHovered) stateScale = 1.06;
      if (isThinking) stateScale = 1.0 + Math.sin(elapsedTime * 6) * 0.04;
      if (isListening) stateScale = 1.08 + Math.sin(elapsedTime * 8) * 0.06;
      if (isSpeaking) stateScale = 1.06 + Math.sin(elapsedTime * 12) * 0.05;

      const breathe = Math.sin(elapsedTime * 2.2) * 0.02 + 1.0;
      const totalScale = breathe * pulseFactor * stateScale;
      outerMesh.scale.set(totalScale, totalScale, totalScale);

      // Nucleus counter-rotation
      nucleusMesh.rotation.x = -elapsedTime * 0.8;
      nucleusMesh.rotation.y = elapsedTime * 1.1;

      // Orbital rings animation
      ring1.rotation.z = elapsedTime * 0.35;
      ring2.rotation.z = -elapsedTime * 0.3;

      // Particle subtle wave
      particles.rotation.y = elapsedTime * 0.22;
      particles.rotation.z = Math.sin(elapsedTime * 0.4) * 0.12;

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      width = container.clientWidth || (size === 'compact' ? 140 : 240);
      height = container.clientHeight || (size === 'compact' ? 140 : 240);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handlePointerClick);
      resizeObserver.disconnect();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      outerGeom.dispose();
      nucleusGeom.dispose();
      ring1Geom.dispose();
      ring2Geom.dispose();
      pGeometry.dispose();
      glassMat.dispose();
      nucleusMat.dispose();
      ringMat.dispose();
      pMaterial.dispose();
    };
  }, [persona, size]);

  const glowGradient =
    persona === 'Miku'
      ? 'radial-gradient(circle, rgba(162,224,255,0.7) 0%, rgba(79,166,206,0.3) 45%, transparent 72%)'
      : persona === 'Araan'
      ? 'radial-gradient(circle, rgba(255,205,225,0.7) 0%, rgba(206,114,156,0.3) 45%, transparent 72%)'
      : 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(139,165,196,0.3) 45%, transparent 72%)';

  return (
    <div className="relative flex items-center justify-center select-none pointer-events-auto">
      {/* Soft Holographic Halo Glow */}
      <div
        className={`absolute rounded-full blur-3xl pointer-events-none transition-all duration-700 -z-10 ${
          size === 'compact' ? 'w-36 h-36 opacity-35' : 'w-64 h-64 opacity-50'
        }`}
        style={{ background: glowGradient }}
      />

      {/* 3D Canvas Box */}
      <div
        ref={mountRef}
        className={`flex items-center justify-center cursor-pointer transition-transform duration-300 active:scale-95 ${
          size === 'compact'
            ? 'w-[120px] h-[120px] sm:w-[140px] sm:h-[140px]'
            : 'w-[200px] h-[200px] sm:w-[250px] sm:h-[250px]'
        }`}
        title="Luccha AI Holographic 3D"
      />
    </div>
  );
};
