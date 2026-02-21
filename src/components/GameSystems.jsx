/**
 * Game Systems Component
 * Runs all game logic hooks inside the R3F Canvas context
 */

import { usePlayerController } from '../systems/usePlayerController';
import { useEnemyAI } from '../systems/useEnemyAI';
import { useBossAI } from '../systems/useBossAI';
import { useCombatSystem } from '../systems/useCombatSystem';
import { useCameraFollow } from '../systems/useCameraFollow';

export function GameSystems() {
    usePlayerController();
    useEnemyAI();
    useBossAI();
    useCombatSystem();
    useCameraFollow();

    return null;
}
