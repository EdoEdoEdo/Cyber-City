/**
 * Input System
 * Handles keyboard and touch input
 * Maps raw input to game actions
 * 
 * NOTE: jumpPressed and shootPressed are "consumed" by the player controller
 * They stay true until the controller reads and resets them
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { INPUT } from '../constants/gameplayConstants';

export function useInputSystem() {
  const setInput = useGameStore((state) => state.setInput);
  const togglePause = useGameStore((state) => state.togglePause);
  
  // Track pressed state to detect single presses
  const pressedRef = useRef({
    jump: false,
    shoot: false,
    shield: false,
  });
  
  // -----------------------------------------
  // KEYBOARD INPUT
  // -----------------------------------------
  
  const handleKeyDown = useCallback((e) => {
    const key = e.code;
    
    // Prevent default for game keys
    if ([...INPUT.KEYS.JUMP, ...INPUT.KEYS.LEFT, ...INPUT.KEYS.RIGHT].includes(key)) {
      e.preventDefault();
    }
    
    // Movement
    if (INPUT.KEYS.LEFT.includes(key)) {
      setInput({ left: true });
    }
    if (INPUT.KEYS.RIGHT.includes(key)) {
      setInput({ right: true });
    }
    
    // Jump (single press detection)
    if (INPUT.KEYS.JUMP.includes(key)) {
      setInput({ jump: true });
      if (!pressedRef.current.jump) {
        setInput({ jumpPressed: true });
        pressedRef.current.jump = true;
      }
    }
    
    // Shoot (single press detection)
    if (INPUT.KEYS.SHOOT.includes(key)) {
      setInput({ shoot: true });
      if (!pressedRef.current.shoot) {
        setInput({ shootPressed: true });
        pressedRef.current.shoot = true;
      }
    }
    
    // Shield (single press detection)
    if (INPUT.KEYS.SHIELD.includes(key)) {
      if (!pressedRef.current.shield) {
        setInput({ shield: true, shieldPressed: true });
        pressedRef.current.shield = true;
      }
    }
    
    // Pause
    if (INPUT.KEYS.PAUSE.includes(key)) {
      togglePause();
    }
  }, [setInput, togglePause]);
  
  const handleKeyUp = useCallback((e) => {
    const key = e.code;
    
    if (INPUT.KEYS.LEFT.includes(key)) {
      setInput({ left: false });
    }
    if (INPUT.KEYS.RIGHT.includes(key)) {
      setInput({ right: false });
    }
    if (INPUT.KEYS.JUMP.includes(key)) {
      setInput({ jump: false });
      pressedRef.current.jump = false;
    }
    if (INPUT.KEYS.SHOOT.includes(key)) {
      setInput({ shoot: false });
      pressedRef.current.shoot = false;
    }
    if (INPUT.KEYS.SHIELD.includes(key)) {
      setInput({ shield: false });
      pressedRef.current.shield = false;
    }
  }, [setInput]);
  
  // -----------------------------------------
  // TOUCH INPUT
  // -----------------------------------------
  
  const touchesRef = useRef(new Map());
  
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const screenWidth = window.innerWidth;
    
    Array.from(e.changedTouches).forEach((touch) => {
      const x = touch.clientX / screenWidth;
      const y = touch.clientY / window.innerHeight;
      
      touchesRef.current.set(touch.identifier, { x, y, startX: x, startY: y });
      
      // Left side = movement (determined by position within zone)
      if (x < INPUT.TOUCH.MOVE_ZONE_WIDTH) {
        // Left half of move zone = move left
        if (x < INPUT.TOUCH.MOVE_ZONE_WIDTH / 2) {
          setInput({ left: true, right: false });
        } else {
          setInput({ right: true, left: false });
        }
      }
      // Right side = actions
      else if (x > 1 - INPUT.TOUCH.ACTION_ZONE_WIDTH) {
        // Top half = shoot, bottom half = shield
        if (y < 0.5) {
          setInput({ shootPressed: true, shoot: true });
        } else {
          setInput({ shieldPressed: true, shield: true });
        }
      }
      // Middle = jump
      else {
        setInput({ jumpPressed: true, jump: true });
      }
    });
  }, [setInput]);
  
  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    
    Array.from(e.changedTouches).forEach((touch) => {
      const touchData = touchesRef.current.get(touch.identifier);
      if (!touchData) return;
      
      const x = touchData.startX;
      
      // Clear inputs based on where touch started
      if (x < INPUT.TOUCH.MOVE_ZONE_WIDTH) {
        setInput({ left: false, right: false });
      } else if (x > 1 - INPUT.TOUCH.ACTION_ZONE_WIDTH) {
        setInput({ shoot: false, shield: false });
      } else {
        setInput({ jump: false });
      }
      
      touchesRef.current.delete(touch.identifier);
    });
  }, [setInput]);
  
  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const screenWidth = window.innerWidth;
    
    Array.from(e.changedTouches).forEach((touch) => {
      const touchData = touchesRef.current.get(touch.identifier);
      if (!touchData) return;
      
      // Only handle movement zone swipes
      if (touchData.startX < INPUT.TOUCH.MOVE_ZONE_WIDTH) {
        const x = touch.clientX / screenWidth;
        
        // Update movement based on current position
        if (x < INPUT.TOUCH.MOVE_ZONE_WIDTH / 2) {
          setInput({ left: true, right: false });
        } else {
          setInput({ left: false, right: true });
        }
        
        touchesRef.current.set(touch.identifier, { ...touchData, x });
      }
    });
  }, [setInput]);
  
  // -----------------------------------------
  // SETUP LISTENERS
  // -----------------------------------------
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleKeyDown, handleKeyUp, handleTouchStart, handleTouchEnd, handleTouchMove]);
}
