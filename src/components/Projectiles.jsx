/**
 * Projectiles Component
 * Renders all active projectiles
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore, selectProjectiles } from '../store/gameStore';
import { PROJECTILE, COLORS } from '../constants/gameplayConstants';

function Projectile({ projectile }) {
  const ref = useRef();
  
  // Pulsing glow effect
  useFrame((state) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity = 
        1 + Math.sin(state.clock.elapsedTime * 20) * 0.3;
    }
  });
  
  const color = projectile.isPlayerProjectile 
    ? COLORS.NEON_CYAN 
    : COLORS.ENEMY_ACCENT;
  
  return (
    <group position={[
      projectile.position.x, 
      projectile.position.y, 
      projectile.position.z
    ]}>
      {/* Core */}
      <mesh ref={ref}>
        <boxGeometry args={[PROJECTILE.WIDTH, PROJECTILE.HEIGHT, 0.1]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={1}
        />
      </mesh>
      
      {/* Trail effect */}
      <mesh position={[-projectile.velocity.x * 0.3, 0, 0]}>
        <boxGeometry args={[PROJECTILE.WIDTH * 0.8, PROJECTILE.HEIGHT * 0.6, 0.05]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.5}
        />
      </mesh>
      <mesh position={[-projectile.velocity.x * 0.5, 0, 0]}>
        <boxGeometry args={[PROJECTILE.WIDTH * 0.5, PROJECTILE.HEIGHT * 0.3, 0.03]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

export function Projectiles() {
  const projectiles = useGameStore(selectProjectiles);
  
  return (
    <>
      {projectiles.map((projectile) => (
        <Projectile key={projectile.id} projectile={projectile} />
      ))}
    </>
  );
}
