import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AnimationSettings } from '../types.ts';

interface ThreeTradingBackgroundProps {
  settings: AnimationSettings;
}

export const ThreeTradingBackground: React.FC<ThreeTradingBackgroundProps> = ({ settings }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    if (!settings.enable3D) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Check mobile disable
    const isMobile = window.innerWidth < 768;
    if (isMobile && !settings.enableOnMobile) return;

    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      // Scene & Camera
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 32);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Handle context lost
      const handleContextLost = (e: Event) => {
        e.preventDefault();
        cancelAnimationFrame(animationFrameId);
      };
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

      // Lights
      const ambientLight = new THREE.AmbientLight(0x081510, 2.5);
      scene.add(ambientLight);

      const emeraldPointLight = new THREE.PointLight(0x00D084, 4, 60);
      emeraldPointLight.position.set(-15, 12, 10);
      scene.add(emeraldPointLight);

      const goldPointLight = new THREE.PointLight(0xD4AF37, 2.5, 50);
      goldPointLight.position.set(18, -10, 8);
      scene.add(goldPointLight);

      // Speed & density multipliers based on settings
      const speedMultiplier = settings.speed || 1.0;
      const intensityFactor = settings.intensity === 'high' ? 1.5 : settings.intensity === 'low' ? 0.6 : 1.0;
      const particleCount = Math.floor((settings.particleDensity || 70) * (isMobile ? 0.4 : 1.0));

      // 1. Candlestick Bars in 3D Space
      const candleGroup = new THREE.Group();
      const candleCount = isMobile ? 12 : 24;
      const candleMeshes: {
        body: THREE.Mesh;
        wick: THREE.Line;
        initialY: number;
        speedY: number;
        amplitude: number;
      }[] = [];

      const bullMaterial = new THREE.MeshStandardMaterial({
        color: 0x00D084,
        roughness: 0.2,
        metalness: 0.6,
        transparent: true,
        opacity: 0.85
      });

      const bearMaterial = new THREE.MeshStandardMaterial({
        color: 0x087F5B,
        roughness: 0.3,
        metalness: 0.5,
        transparent: true,
        opacity: 0.75
      });

      const wickMaterial = new THREE.LineBasicMaterial({
        color: 0xD4AF37,
        transparent: true,
        opacity: 0.5
      });

      for (let i = 0; i < candleCount; i++) {
        const x = (i - candleCount / 2) * 2.2;
        const height = Math.random() * 4 + 2;
        const isBull = Math.random() > 0.35;
        const bodyGeo = new THREE.BoxGeometry(0.8, height, 0.8);
        const bodyMesh = new THREE.Mesh(bodyGeo, isBull ? bullMaterial : bearMaterial);

        const initialY = (Math.sin(i * 0.4) * 3) + (Math.random() * 2 - 1);
        const z = (Math.random() - 0.5) * 8;
        bodyMesh.position.set(x, initialY, z);

        // Wick line
        const wickHeight = height + Math.random() * 3 + 2;
        const wickPoints = [
          new THREE.Vector3(x, initialY - wickHeight / 2, z),
          new THREE.Vector3(x, initialY + wickHeight / 2, z)
        ];
        const wickGeo = new THREE.BufferGeometry().setFromPoints(wickPoints);
        const wickLine = new THREE.Line(wickGeo, wickMaterial);

        candleGroup.add(bodyMesh);
        candleGroup.add(wickLine);

        candleMeshes.push({
          body: bodyMesh,
          wick: wickLine,
          initialY,
          speedY: (0.4 + Math.random() * 0.6) * speedMultiplier,
          amplitude: 0.8 + Math.random() * 1.2
        });
      }
      scene.add(candleGroup);

      // 2. Floating Emerald & Gold Particles
      if (settings.enableParticles) {
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const emeraldColor = new THREE.Color(0x00D084);
        const goldColor = new THREE.Color(0xD4AF37);

        for (let p = 0; p < particleCount; p++) {
          positions[p * 3] = (Math.random() - 0.5) * 60;
          positions[p * 3 + 1] = (Math.random() - 0.5) * 40;
          positions[p * 3 + 2] = (Math.random() - 0.5) * 30;

          const chosenColor = Math.random() > 0.25 ? emeraldColor : goldColor;
          colors[p * 3] = chosenColor.r;
          colors[p * 3 + 1] = chosenColor.g;
          colors[p * 3 + 2] = chosenColor.b;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
          size: 0.35,
          vertexColors: true,
          transparent: true,
          opacity: 0.65,
          blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);
      }

      // 3. Subtle Cybernetic Grid Floor
      const gridHelper = new THREE.GridHelper(80, 40, 0x00D084, 0x11221c);
      gridHelper.position.y = -12;
      (gridHelper.material as THREE.Material).transparent = true;
      (gridHelper.material as THREE.Material).opacity = 0.25;
      scene.add(gridHelper);

      // 4. Floating Glass Panels with Emerald Edge
      const panelGroup = new THREE.Group();
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x0d1f18,
        transparent: true,
        opacity: 0.18,
        roughness: 0.1,
        metalness: 0.9,
        wireframe: false
      });

      for (let g = 0; g < 3; g++) {
        const panelGeo = new THREE.BoxGeometry(10 + g * 4, 6 + g * 2, 0.1);
        const panelMesh = new THREE.Mesh(panelGeo, glassMat);
        panelMesh.position.set((g - 1) * 12, (g - 1) * 3, -8 - g * 4);
        panelMesh.rotation.y = (g - 1) * 0.15;
        panelGroup.add(panelMesh);
      }
      scene.add(panelGroup);

      // Mouse Parallax Interaction
      let targetMouseX = 0;
      let targetMouseY = 0;
      let currentMouseX = 0;
      let currentMouseY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        if (!settings.enableCursor) return;
        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        const normY = -(e.clientY / window.innerHeight) * 2 + 1;
        targetMouseX = normX * 2.5 * intensityFactor;
        targetMouseY = normY * 1.5 * intensityFactor;
      };

      if (!isMobile) {
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
      }

      // Resize Handler
      const handleResize = () => {
        if (!container || !renderer) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      window.addEventListener('resize', handleResize);

      // Animation Loop
      let clock = new THREE.Clock();

      const animate = () => {
        if (document.hidden) {
          animationFrameId = requestAnimationFrame(animate);
          return;
        }

        const elapsedTime = clock.getElapsedTime();

        // Parallax damping
        currentMouseX += (targetMouseX - currentMouseX) * 0.05;
        currentMouseY += (targetMouseY - currentMouseY) * 0.05;

        camera.position.x = currentMouseX;
        camera.position.y = currentMouseY;
        camera.lookAt(0, 0, 0);

        // Animate candlestick bars gently
        candleMeshes.forEach((item, idx) => {
          const wave = Math.sin(elapsedTime * item.speedY + idx * 0.4) * item.amplitude;
          item.body.position.y = item.initialY + wave;
          item.wick.position.y = wave;
        });

        // Slow rotation for glass panels & grid
        panelGroup.rotation.y = Math.sin(elapsedTime * 0.2 * speedMultiplier) * 0.08;
        gridHelper.position.z = (elapsedTime * 1.5 * speedMultiplier) % 2 - 1;

        if (renderer) {
          renderer.render(scene, camera);
        }
        animationFrameId = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        if (!isMobile) {
          window.removeEventListener('mousemove', handleMouseMove);
        }
        if (renderer && renderer.domElement) {
          renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
          renderer.dispose();
        }
      };
    } catch (err) {
      console.warn('WebGL initialization failed, falling back to CSS background:', err);
      setWebglError(true);
    }
  }, [settings]);

  // If 3D disabled or WebGL failed, render graceful CSS gradient mesh
  if (!settings.enable3D || webglError) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#080B0A]">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-[#D4AF37]/5 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1a2620_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      style={{
        background: settings.backgroundStyle === 'matte_obsidian'
          ? '#080B0A'
          : settings.backgroundStyle === 'cyber_grid'
          ? 'radial-gradient(ellipse at 50% 20%, #0d1713 0%, #080B0A 100%)'
          : 'radial-gradient(circle at 40% 30%, #0a1813 0%, #080B0A 80%)'
      }}
    />
  );
};
