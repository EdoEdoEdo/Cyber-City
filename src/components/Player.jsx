/**
 * Player Component
 * Pure visual representation - no gameplay logic
 * Uses store state for position and animations
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore, selectPlayer } from '../store/gameStore';
import { PLAYER, COLORS } from '../constants/gameplayConstants';

export function Player() {
  const player = useGameStore(selectPlayer);
  const groupRef = useRef();
  const shieldRef = useRef();
  
  // Animate shield pulse
  useFrame((state) => {
    if (shieldRef.current && player.isShielding) {
      shieldRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
    }
  });
  
  if (player.isDead) return null;
  
  const { position, facingRight, isGrounded, isShielding, isShooting } = player;
  
  return (
    <group 
      ref={groupRef}
      position={[position.x, position.y, position.z]}
    >
      {/* Body - main silhouette */}
      <group scale={[facingRight ? 1 : -1, 1, 1]}>
        {/* Torso */}
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[PLAYER.WIDTH, 0.8, 0.3]} />
          <meshStandardMaterial color={COLORS.PLAYER_BODY} />
        </mesh>
        
        {/* Head */}
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[0.35, 0.35, 0.3]} />
          <meshStandardMaterial color={COLORS.PLAYER_BODY} />
        </mesh>
        
        {/* Legs */}
        <mesh position={[-0.12, 0.35, 0]}>
          <boxGeometry args={[0.18, 0.7, 0.2]} />
          <meshStandardMaterial color={COLORS.PLAYER_BODY} />
        </mesh>
        <mesh position={[0.12, 0.35, 0]}>
          <boxGeometry args={[0.18, 0.7, 0.2]} />
          <meshStandardMaterial color={COLORS.PLAYER_BODY} />
        </mesh>
        
        {/* Arm / Gun */}
        <mesh position={[0.35, 1.0, 0]}>
          <boxGeometry args={[0.4, 0.15, 0.15]} />
          <meshStandardMaterial color={COLORS.PLAYER_BODY} />
        </mesh>
        
        {/* Neon accent lines */}
        <mesh position={[0, 1.0, 0.16]}>
          <boxGeometry args={[0.05, 0.6, 0.02]} />
          <meshStandardMaterial 
            color={COLORS.PLAYER_ACCENT} 
            emissive={COLORS.PLAYER_ACCENT}
            emissiveIntensity={0.5}
          />
        </mesh>
        
        {/* Eye visor */}
        <mesh position={[0.1, 1.62, 0.16]}>
          <boxGeometry args={[0.2, 0.08, 0.02]} />
          <meshStandardMaterial 
            color={COLORS.PLAYER_ACCENT} 
            emissive={COLORS.PLAYER_ACCENT}
            emissiveIntensity={1}
          />
        </mesh>
        
        {/* Muzzle flash when shooting */}
        {isShooting && (
          <mesh position={[0.7, 1.0, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial 
              color={COLORS.MUZZLE_FLASH}
              emissive={COLORS.PLAYER_ACCENT}
              emissiveIntensity={2}
              transparent
              opacity={0.8}
            />
          </mesh>
        )}
      </group>
      
      {/* Shield effect */}
      {isShielding && (
        <mesh ref={shieldRef} position={[facingRight ? 0.5 : -0.5, 1.0, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 1.8, 16, 1, true]} />
          <meshStandardMaterial 
            color={COLORS.SHIELD_COLOR}
            emissive={COLORS.SHIELD_COLOR}
            emissiveIntensity={0.5}
            transparent
            opacity={0.3}
            side={2} // DoubleSide
          />
        </mesh>
      )}
      
      {/* Ground shadow */}
      {isGrounded && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.8, 0.4]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
