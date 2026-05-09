/**
 * OutroUI — debrief overlay shown during the OUTRO game phase.
 *
 * Mirrors IntroUI: corner brackets + chat bubbles. Drives sounds on each
 * new message via the same notification audio used by the intro. The
 * VICTORY modal (in UIOverlay) takes over once gamePhase === VICTORY.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useGameStore, selectOutro, selectGamePhase } from '../store/gameStore';
import { GAME_PHASES } from '../constants/gameplayConstants';
import { OUTRO_MESSAGES } from '../constants/outroMessages';

export function OutroUI() {
    const outro = useGameStore(selectOutro);
    const gamePhase = useGameStore(selectGamePhase);
    const notificationRef = useRef(null);
    const lastMessageCountRef = useRef(0);

    useEffect(() => {
        notificationRef.current = new Audio('audio/notification.mp3');
        notificationRef.current.volume = 0.4;
    }, []);

    useEffect(() => {
        if (gamePhase !== GAME_PHASES.OUTRO) {
            lastMessageCountRef.current = 0;
            return;
        }
        const count = (outro.currentMessage ?? -1) + 1;
        if (count > lastMessageCountRef.current && notificationRef.current) {
            notificationRef.current.currentTime = 0;
            notificationRef.current.play().catch(() => {});
        }
        lastMessageCountRef.current = count;
    }, [outro.currentMessage, gamePhase]);

    if (gamePhase !== GAME_PHASES.OUTRO) return null;

    const visibleMessages =
        outro.currentMessage >= 0
            ? OUTRO_MESSAGES.slice(0, outro.currentMessage + 1)
            : [];

    return (
        <div style={styles.root}>
            {/* HUD corners */}
            <div style={{ ...styles.corner, top: 24, left: 24 }}>
                <CornerBracket />
            </div>
            <div
                style={{
                    ...styles.corner,
                    top: 24,
                    right: 24,
                    transform: 'scaleX(-1)',
                }}
            >
                <CornerBracket />
            </div>
            <div
                style={{
                    ...styles.corner,
                    bottom: 24,
                    left: 24,
                    transform: 'scaleY(-1)',
                }}
            >
                <CornerBracket />
            </div>
            <div
                style={{
                    ...styles.corner,
                    bottom: 24,
                    right: 24,
                    transform: 'scale(-1, -1)',
                }}
            >
                <CornerBracket />
            </div>

            {/* Telemetry: mission status */}
            <div style={styles.telemetry}>
                <div>SYS · NEURONET v3.41</div>
                <div>MISSION · COMPLETE</div>
            </div>

            {/* Chat bubbles */}
            <div style={styles.chatContainer}>
                {visibleMessages.map((msg, i) => (
                    <ChatMessage key={i} sender={msg.sender} text={msg.text} />
                ))}
            </div>
        </div>
    );
}

function CornerBracket() {
    return (
        <svg width={28} height={28} viewBox="0 0 28 28">
            <path
                d="M 0 10 L 0 0 L 10 0"
                stroke="#00ffff"
                strokeWidth="2"
                fill="none"
            />
        </svg>
    );
}

function ChatMessage({ sender, text }) {
    const isOperator = sender === 'operator';
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 30);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            style={{
                ...styles.messageRow,
                justifyContent: isOperator ? 'flex-start' : 'flex-end',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
            }}
        >
            <div
                style={{
                    ...styles.messageBubble,
                    borderColor: isOperator ? '#ff0080' : '#00ffff',
                    backgroundColor: isOperator
                        ? 'rgba(255, 0, 128, 0.1)'
                        : 'rgba(0, 255, 255, 0.1)',
                }}
            >
                <div
                    style={{
                        ...styles.senderLabel,
                        color: isOperator ? '#ff0080' : '#00ffff',
                    }}
                >
                    {isOperator ? 'OPERATOR' : 'AGENT'}
                </div>
                <div
                    style={{
                        ...styles.messageText,
                        color: isOperator ? '#ff0080' : '#00ffff',
                    }}
                >
                    {text}
                </div>
            </div>
        </div>
    );
}

const styles = {
    root: {
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 150,
        fontFamily: "'Courier New', monospace",
        letterSpacing: '2px',
    },
    corner: {
        position: 'absolute',
        width: 28,
        height: 28,
    },
    telemetry: {
        position: 'absolute',
        top: 24,
        left: 64,
        color: '#00ffffaa',
        fontSize: 11,
        lineHeight: '16px',
        textShadow: '0 0 6px #00ffff55',
    },
    chatContainer: {
        position: 'absolute',
        bottom: '22%',
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'center',
        padding: '0 24px',
    },
    messageRow: {
        display: 'flex',
        width: '100%',
        maxWidth: 520,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: '10px 14px',
        border: '1px solid',
        borderRadius: 4,
        backdropFilter: 'blur(10px)',
    },
    senderLabel: {
        fontSize: 10,
        letterSpacing: 2,
        marginBottom: 4,
        fontWeight: 'bold',
    },
    messageText: {
        fontSize: 13,
        lineHeight: '1.4',
        letterSpacing: 0.5,
    },
};
