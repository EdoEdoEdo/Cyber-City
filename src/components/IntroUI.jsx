/**
 * IntroUI — terminal HUD overlay for the in-engine intro.
 *
 * Combines two layers:
 *   1) Cinematic chrome: corner brackets + bottom terminal line + telemetry.
 *      Driven by `intro.phase` (0..3).
 *   2) Operator/Agent chat bubbles: short narrative beats kept verbatim.
 *      Driven by `intro.currentMessage` set by IntroManager from elapsed time.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore, selectIntro, selectGamePhase } from '../store/gameStore';
import { GAME_PHASES } from '../constants/gameplayConstants';
import { INTRO_MESSAGES } from '../constants/introMessages';

const PHASE_LINES = [
    { text: 'ESTABLISHING CONNECTION', dots: true, accent: false },
    { text: 'NIGHT CITY · 03:14 · TARGET LOCKED', dots: false, accent: false },
    { text: 'AGENT ONLINE', dots: false, accent: true },
    { text: 'READY', dots: false, accent: true, blink: true },
];

export function IntroUI() {
    const intro = useGameStore(selectIntro);
    const gamePhase = useGameStore(selectGamePhase);
    const notificationRef = useRef(null);
    const lastMessageCountRef = useRef(0);

    const [tick, setTick] = useState(0);

    useEffect(() => {
        notificationRef.current = new Audio('audio/notification.mp3');
        notificationRef.current.volume = 0.4;
    }, []);

    // Chat sound on every new message
    useEffect(() => {
        if (gamePhase !== GAME_PHASES.INTRO) {
            lastMessageCountRef.current = 0;
            return;
        }
        const count = (intro.currentMessage ?? -1) + 1;
        if (count > lastMessageCountRef.current && notificationRef.current) {
            notificationRef.current.currentTime = 0;
            notificationRef.current.play().catch(() => {});
        }
        lastMessageCountRef.current = count;
    }, [intro.currentMessage, gamePhase]);

    useEffect(() => {
        if (gamePhase !== GAME_PHASES.INTRO) return;
        const id = setInterval(() => setTick((v) => v + 1), 400);
        return () => clearInterval(id);
    }, [gamePhase]);

    if (gamePhase !== GAME_PHASES.INTRO) return null;

    const line =
        PHASE_LINES[Math.min(intro.phase ?? 0, PHASE_LINES.length - 1)];
    const dots = '.'.repeat((tick % 4) + 1);
    const blinkOn = tick % 2 === 0;

    const visibleMessages =
        intro.currentMessage >= 0
            ? INTRO_MESSAGES.slice(0, intro.currentMessage + 1)
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

            {/* Chat bubbles (narrative) */}
            <div style={styles.chatContainer}>
                {visibleMessages.map((msg, i) => (
                    <ChatMessage key={i} sender={msg.sender} text={msg.text} />
                ))}
            </div>

            {/* Bottom terminal line (HUD chrome) — hidden once chat starts */}
            {intro.currentMessage < 0 && (
                <div style={styles.lineRow}>
                    <GlitchLine
                        text={`// ${line.text}${line.dots ? dots : ''}`}
                        blink={line.blink ? blinkOn : true}
                        accent={line.accent}
                    />
                </div>
            )}

            {/* Telemetry */}
            <div style={styles.telemetry}>
                <div>SYS · NEURONET v3.41</div>
                <div>
                    UPLINK · {Math.min(100, (intro.phase ?? 0) * 33 + 1)}%
                </div>
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

function GlitchLine({ text, blink, accent }) {
    const color = accent ? '#00ffff' : '#ff0080';
    return (
        <div
            style={{
                ...styles.line,
                color,
                opacity: blink ? 1 : 0.35,
                textShadow: `0 0 8px ${color}, 0 0 16px ${color}80, 2px 0 0 #ff008055, -2px 0 0 #00ffff55`,
            }}
        >
            {text}
        </div>
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
        transition: 'opacity 0.4s ease-out',
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
    lineRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: '8%',
        display: 'flex',
        justifyContent: 'center',
    },
    line: {
        fontSize: 'clamp(12px, 2vw, 18px)',
        fontWeight: 700,
        padding: '5px 12px',
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(0,255,255,0.25)',
        backdropFilter: 'blur(2px)',
        transition: 'opacity 0.18s linear, color 0.3s',
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
};
