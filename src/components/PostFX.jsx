/**
 * Post-processing pipeline.
 * Cyberpunk look: bloom on emissive materials + subtle chromatic aberration
 * + vignette + film noise. Disabled on low-tier devices to preserve FPS.
 */

import React from 'react';
import {
    EffectComposer,
    Bloom,
    ChromaticAberration,
    Vignette,
    Noise,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { Vector2 } from 'three';
import { getDeviceTier } from '../utils/device';

// Module-level: we only want to detect once per session.
const tier = getDeviceTier();
const enabled = tier !== 'low';
const heavy = tier === 'high';

export function PostFX() {
    if (!enabled) return null;

    return (
        <EffectComposer multisampling={0} disableNormalPass>
            {/*
             * Two-pass bloom:
             *  - Wide pass: low intensity, big kernel → "atmospheric" glow
             *    that fills the screen without overpowering details.
             *  - Tight pass: high intensity, small kernel → crisp neon
             *    accent on bright pixels, keeps text readable.
             */}
            <Bloom
                intensity={heavy ? 0.6 : 0.45}
                luminanceThreshold={0.2}
                luminanceSmoothing={0.9}
                mipmapBlur
                radius={0.9}
                levels={8}
                kernelSize={KernelSize.HUGE}
            />
            <Bloom
                intensity={heavy ? 0.7 : 0.55}
                luminanceThreshold={0.55}
                luminanceSmoothing={0.6}
                mipmapBlur
                radius={0.4}
                levels={4}
                kernelSize={KernelSize.SMALL}
            />
            <ChromaticAberration
                blendFunction={BlendFunction.NORMAL}
                offset={new Vector2(0.0008, 0.0008)}
                radialModulation={false}
                modulationOffset={0}
            />
            <Vignette eskil={false} offset={0.25} darkness={0.7} />
            {heavy && (
                <Noise
                    premultiply
                    blendFunction={BlendFunction.SOFT_LIGHT}
                    opacity={0.2}
                />
            )}
        </EffectComposer>
    );
}
