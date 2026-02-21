/**
 * ScifiBuilding Component
 * GLB model with reflective materials
 */

import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function ScifiBuilding({ position, scale = 1, rotation = [0, 0, 0] }) {
    const { scene } = useGLTF('models/scifi_building_1.glb');

    const clonedScene = useMemo(() => {
        const clone = scene.clone();

        clone.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();

                if (child.material.isMeshBasicMaterial) {
                    const oldMat = child.material;
                    child.material = new THREE.MeshStandardMaterial({
                        color: oldMat.color,
                        map: oldMat.map,
                    });
                }

                if (child.material.isMeshStandardMaterial) {
                    child.material.metalness = 0.5;
                    child.material.roughness = 1;
                    child.material.envMapIntensity = 1.2;

                    if (child.material.color) {
                        child.material.color.multiplyScalar(1.2);
                    }
                }
            }
        });

        return clone;
    }, [scene]);

    return (
        <group position={position} scale={scale} rotation={rotation}>
            <primitive object={clonedScene} />
        </group>
    );
}

// Preload
useGLTF.preload('models/scifi_building_1.glb');
