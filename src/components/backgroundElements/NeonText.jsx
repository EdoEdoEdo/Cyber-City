/**
 * NeonText Component
 * Japanese style neon text with flicker effect
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

export function NeonText({
    position,
    text = 'サイバーシティ',
    color = '#ff0080',
    fontSize = 1.5,
    rotation = [0, 0, 0],
}) {
    const glowRef = useRef();

    useFrame((state) => {
        if (glowRef.current) {
            const flicker = Math.random() > 0.97 ? 0.6 : 1;
            const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
            glowRef.current.fillOpacity = pulse * flicker;
        }
    });

    return (
        <group position={position} rotation={rotation}>
            {/* Glow layer (behind) */}
            <Text
                fontSize={fontSize * 1.05}
                position={[0, 0, -0.05]}
                color={color}
                fillOpacity={0.3}
                anchorX="center"
                anchorY="middle"
                font="fonts/NotoSansJP-Bold.ttf"
            >
                {text}
            </Text>

            {/* Main text */}
            <Text
                ref={glowRef}
                fontSize={fontSize}
                color={color}
                anchorX="center"
                anchorY="middle"
                font="fonts/NotoSansJP-Bold.ttf"
            >
                {text}
                <meshBasicMaterial color={color} toneMapped={false} />
            </Text>
        </group>
    );
}
