/**
 * LedWall Component
 * Video billboard with LED shader effect
 */

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from './constants';

export function LedWall({
    position,
    width = 8,
    height = 12,
    videoSrc = 'textures/video.mp4',
}) {
    const meshRef = useRef();
    const [videoTexture, setVideoTexture] = useState(null);

    // Create video texture
    useEffect(() => {
        const video = document.createElement('video');
        video.src = videoSrc;
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.play();

        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;
        setVideoTexture(texture);

        return () => {
            video.pause();
            video.src = '';
            texture.dispose();
        };
    }, [videoSrc]);

    // LED Wall shader
    const ledShaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: null },
                uTime: { value: 0 },
                uResolution: {
                    value: new THREE.Vector2(width * 50, height * 50),
                },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                uniform float uTime;
                uniform vec2 uResolution;
                varying vec2 vUv;

                void main() {
                    vec2 uv = vUv;
                    
                    // Sample video
                    vec4 texColor = texture2D(uTexture, uv);
                    
                    // === LED PIXEL GRID (much smaller) ===
                    vec2 pixelSize = vec2(1.0 / uResolution.x, 1.0 / uResolution.y) * 20.0;
                    vec2 pixelUv = mod(uv, pixelSize) / pixelSize;
                    float pixelMask = smoothstep(0.0, 0.05, pixelUv.x) * smoothstep(1.0, 0.95, pixelUv.x);
                    pixelMask *= smoothstep(0.0, 0.05, pixelUv.y) * smoothstep(1.0, 0.95, pixelUv.y);
                    pixelMask = mix(0.85, 1.0, pixelMask);
                    
                    // === SUBTLE SCANLINES ===
                    float scanline = sin(uv.y * uResolution.y * 3.0) * 0.5 + 0.5;
                    scanline = mix(0.92, 1.0, scanline);
                    
                    // === SUBTLE FLICKER ===
                    float flicker = 0.98 + 0.02 * sin(uTime * 40.0);
                    
                    // === PROCESS COLOR ===
                    vec3 color = texColor.rgb;
                    
                    // Boost brightness
                    color *= 1.8;
                    
                    // Add white glow/haze (stronger on darker areas)
                    float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
                    float glowAmount = 0.05 * (1.0 - luminance * 0.5);
                    color += vec3(glowAmount);
                    
                    // Boost saturation
                    float gray = dot(color, vec3(0.299, 0.587, 0.114));
                    color = mix(vec3(gray), color, 1.4);
                    
                    // LED emission glow
                    color += texColor.rgb * 0.3;
                    
                    // Apply effects
                    color *= pixelMask;
                    color *= scanline;
                    color *= flicker;
                    
                    // Slight warm tint
                    color += vec3(0.03, 0.02, 0.01);
                    
                    // Clamp to prevent overexposure
                    color = clamp(color, 0.0, 1.0);
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            transparent: false,
        });
    }, [width, height]);

    // Update shader uniforms
    useFrame((state) => {
        if (ledShaderMaterial && videoTexture) {
            ledShaderMaterial.uniforms.uTexture.value = videoTexture;
            ledShaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    const borderThickness = 0.12;

    return (
        <group position={position}>
            {/* Back panel */}
            <mesh position={[0, 0, -0.2]}>
                <boxGeometry args={[width + 0.6, height + 0.6, 0.3]} />
                <meshBasicMaterial color="#0a0a0f" />
            </mesh>

            {/* Video screen with LED shader */}
            <mesh ref={meshRef}>
                <planeGeometry args={[width, height]} />
                {videoTexture ? (
                    <primitive object={ledShaderMaterial} attach="material" />
                ) : (
                    <meshBasicMaterial color="#111122" />
                )}
            </mesh>

            {/* Subtle outer glow */}
            <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[width + 0.8, height + 0.8]} />
                <meshBasicMaterial
                    color={PALETTE.NEON_PINK}
                    transparent
                    opacity={0.1}
                />
            </mesh>

            {/* Thin pink neon frame */}
            {/* Top border */}
            <mesh position={[0, height / 2 + borderThickness / 2, 0.05]}>
                <boxGeometry
                    args={[width + borderThickness * 2, borderThickness, 0.08]}
                />
                <meshStandardMaterial
                    color={PALETTE.NEON_PINK}
                    emissive={PALETTE.NEON_PINK}
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Bottom border */}
            <mesh position={[0, -height / 2 - borderThickness / 2, 0.05]}>
                <boxGeometry
                    args={[width + borderThickness * 2, borderThickness, 0.08]}
                />
                <meshStandardMaterial
                    color={PALETTE.NEON_PINK}
                    emissive={PALETTE.NEON_PINK}
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Left border */}
            <mesh position={[-width / 2 - borderThickness / 2, 0, 0.05]}>
                <boxGeometry args={[borderThickness, height, 0.08]} />
                <meshStandardMaterial
                    color={PALETTE.NEON_PINK}
                    emissive={PALETTE.NEON_PINK}
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Right border */}
            <mesh position={[width / 2 + borderThickness / 2, 0, 0.05]}>
                <boxGeometry args={[borderThickness, height, 0.08]} />
                <meshStandardMaterial
                    color={PALETTE.NEON_PINK}
                    emissive={PALETTE.NEON_PINK}
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Mounting brackets */}
            <mesh position={[-width / 2 - 0.4, height / 3, -0.1]}>
                <boxGeometry args={[0.2, 0.6, 0.15]} />
                <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[width / 2 + 0.4, height / 3, -0.1]}>
                <boxGeometry args={[0.2, 0.6, 0.15]} />
                <meshBasicMaterial color="#1a1a1a" />
            </mesh>
        </group>
    );
}
