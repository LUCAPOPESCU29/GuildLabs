"use client";

/**
 * Lightweight 3D "server galaxy" for the AI builder hero: a glowing core
 * (the server) with one orbiting low-poly node per category. No models — just
 * geometry — so it stays cheap. Lazy-loaded (ssr:false), DPR capped at 2,
 * paused when offscreen, and reduced to a single static frame when the user
 * prefers reduced motion.
 */

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import { ROLE_PALETTE } from "@/lib/blueprint";

function Core() {
  const ref = React.useRef<THREE.Mesh>(null);
  useFrame((_s, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.25;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#6366f1"
        emissive="#6366f1"
        emissiveIntensity={0.6}
        flatShading
        roughness={0.4}
        metalness={0.2}
      />
    </mesh>
  );
}

function OrbitNode({
  radius,
  phase,
  color,
  size,
}: {
  radius: number;
  phase: number;
  color: string;
  size: number;
}) {
  const ref = React.useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime * 0.18 + phase;
    ref.current.position.set(Math.cos(t) * radius, Math.sin(phase) * 0.6, Math.sin(t) * radius);
  });
  return (
    <group ref={ref}>
      <Float speed={2} rotationIntensity={0.6} floatIntensity={0.4}>
        <mesh>
          <dodecahedronGeometry args={[size, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} flatShading roughness={0.5} />
        </mesh>
      </Float>
    </group>
  );
}

function Scene({ count }: { count: number }) {
  const nodes = React.useMemo(() => {
    const n = Math.max(3, Math.min(count, 8));
    return Array.from({ length: n }, (_, i) => ({
      radius: 2.4 + (i % 3) * 0.55,
      phase: (i / n) * Math.PI * 2,
      color: ROLE_PALETTE[i % ROLE_PALETTE.length],
      size: 0.22 + (i % 2) * 0.06,
    }));
  }, [count]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 0]} intensity={28} color="#a78bfa" distance={12} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <Core />
      {nodes.map((n, i) => (
        <OrbitNode key={i} {...n} />
      ))}
      <Stars radius={40} depth={30} count={900} factor={3} saturation={0} fade speed={0.6} />
    </>
  );
}

export default function ServerGalaxy({ categoryCount = 5 }: { categoryCount?: number }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(true);
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Pause the render loop while the hero is scrolled out of view.
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <div ref={wrapRef} className="h-full w-full" aria-hidden>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 1.5, 7], fov: 50 }}
        frameloop={reduce || !active ? "demand" : "always"}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Scene count={categoryCount} />
      </Canvas>
    </div>
  );
}
