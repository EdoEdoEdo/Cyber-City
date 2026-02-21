/**
 * IntroUI Component
 * Cyberpunk-style chat dialogue during intro
 */

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, selectIntro, selectGamePhase } from '../store/gameStore';
import { GAME_PHASES } from '../constants/gameplayConstants';
import { INTRO_MESSAGES } from './IntroManager';

export function IntroUI() {
    const intro = useGameStore(selectIntro);
    const gamePhase = useGameStore(selectGamePhase);
    const [visibleMessages, setVisibleMessages] = useState([]);
    const [fadeOut, setFadeOut] = useState(false);

    const notificationRef = useRef(null);
    const lastMessageCountRef = useRef(0);

    // Inizializza audio
    useEffect(() => {
        notificationRef.current = new Audio('audio/notification.mp3');
        notificationRef.current.volume = 0.5;
    }, []);

    useEffect(() => {
        if (gamePhase !== GAME_PHASES.INTRO) {
            setVisibleMessages([]);
            setFadeOut(false);
            lastMessageCountRef.current = 0;
            return;
        }

        if (intro.currentMessage >= 0) {
            const messagesToShow = INTRO_MESSAGES.slice(
                0,
                intro.currentMessage + 1,
            );

            // Riproduci suono se c'è un nuovo messaggio
            if (messagesToShow.length > lastMessageCountRef.current) {
                if (notificationRef.current) {
                    notificationRef.current.currentTime = 0;
                    notificationRef.current.play().catch(() => {});
                }
            }

            lastMessageCountRef.current = messagesToShow.length;
            setVisibleMessages(messagesToShow);
        }

        // Fade out prima dello zoom
        if (intro.progress > 0.85) {
            setFadeOut(true);
        }
    }, [intro.currentMessage, intro.progress, gamePhase]);

    if (gamePhase !== GAME_PHASES.INTRO || visibleMessages.length === 0) {
        return null;
    }

    return (
        <div
            style={{
                ...styles.container,
                opacity: fadeOut ? 0 : 1,
                transition: 'opacity 0.5s ease-out',
            }}
        >
            <div style={styles.chatContainer}>
                {visibleMessages.map((msg, index) => (
                    <ChatMessage
                        key={index}
                        sender={msg.sender}
                        text={msg.text}
                        isNew={index === visibleMessages.length - 1}
                    />
                ))}
            </div>
        </div>
    );
}

function ChatMessage({ sender, text, isNew }) {
    const isOperator = sender === 'operator';
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            style={{
                ...styles.messageRow,
                justifyContent: isOperator ? 'flex-start' : 'flex-end',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(10px)',
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
    container: {
        position: 'fixed',
        bottom: '80px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 150,
    },

    chatContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '500px',
        width: '90%',
        padding: '0 20px',
    },

    messageRow: {
        display: 'flex',
        width: '100%',
    },

    messageBubble: {
        maxWidth: '85%',
        padding: '12px 16px',
        border: '1px solid',
        borderRadius: '4px',
        backdropFilter: 'blur(10px)',
    },

    senderLabel: {
        fontSize: '10px',
        fontFamily: "'Courier New', monospace",
        letterSpacing: '2px',
        marginBottom: '4px',
        fontWeight: 'bold',
    },

    messageText: {
        fontSize: '14px',
        fontFamily: "'Courier New', monospace",
        lineHeight: '1.4',
        letterSpacing: '0.5px',
    },
};
