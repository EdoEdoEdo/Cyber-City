/**
 * DamageNumbers Component
 * Shows floating damage numbers when entities take damage
 */

import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useGameStore, selectPlayer, selectBoss } from '../store/gameStore';

function DamageNumber({ value, position, onComplete }) {
    const [opacity, setOpacity] = useState(1);
    const [offsetY, setOffsetY] = useState(0);
    const startTimeRef = useRef(null);
    const duration = 1.0; // 1 secondo

    useFrame((state) => {
        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime;
        }

        const elapsed = state.clock.elapsedTime - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Muovi verso l'alto
        setOffsetY(progress * 1.5);

        // Fade out nell'ultima metà
        if (progress > 0.5) {
            setOpacity(1 - (progress - 0.5) * 2);
        }

        // Rimuovi quando finito
        if (progress >= 1) {
            onComplete();
        }
    });

    return (
        <Text
            position={[position.x, position.y + 2 + offsetY, position.z + 0.5]}
            fontSize={0.4}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            fillOpacity={opacity}
            outlineWidth={0.02}
            outlineColor="#000000"
        >
            -{value}
        </Text>
    );
}

export function DamageNumbers() {
    const player = useGameStore(selectPlayer);
    const boss = useGameStore(selectBoss);

    const [damageEvents, setDamageEvents] = useState([]);
    const prevPlayerHealthRef = useRef(player.health);
    const prevBossHealthRef = useRef(boss?.health || 0);
    const nextIdRef = useRef(0);

    // Rileva danni al player
    useEffect(() => {
        const prevHealth = prevPlayerHealthRef.current;
        const currentHealth = player.health;

        if (currentHealth < prevHealth && !player.isDead) {
            const damage = prevHealth - currentHealth;
            setDamageEvents((prev) => [
                ...prev,
                {
                    id: nextIdRef.current++,
                    value: damage,
                    position: { ...player.position },
                    type: 'player',
                },
            ]);
        }

        prevPlayerHealthRef.current = currentHealth;
    }, [player.health, player.position, player.isDead]);

    // Rileva danni al boss
    useEffect(() => {
        if (!boss) return;

        const prevHealth = prevBossHealthRef.current;
        const currentHealth = boss.health;

        if (currentHealth < prevHealth && !boss.isDead) {
            const damage = prevHealth - currentHealth;
            setDamageEvents((prev) => [
                ...prev,
                {
                    id: nextIdRef.current++,
                    value: damage,
                    position: { ...boss.position },
                    type: 'boss',
                },
            ]);
        }

        prevBossHealthRef.current = currentHealth;
    }, [boss?.health, boss?.position, boss?.isDead]);

    // Reset quando boss cambia (nuovo gioco)
    useEffect(() => {
        if (boss) {
            prevBossHealthRef.current = boss.health;
        }
    }, [boss?.id]);

    const removeDamageEvent = (id) => {
        setDamageEvents((prev) => prev.filter((e) => e.id !== id));
    };

    return (
        <group>
            {damageEvents.map((event) => (
                <DamageNumber
                    key={event.id}
                    value={event.value}
                    position={event.position}
                    onComplete={() => removeDamageEvent(event.id)}
                />
            ))}
        </group>
    );
}
