/**
 * Outro dialogue messages — the mission debrief that plays after the boss
 * dies and before the VICTORY modal appears. Mirrors introMessages.js
 * structure so OutroUI can reuse the IntroUI chat-bubble layout.
 *
 * Beats are tuned to OutroManager phases (DIALOGUE 2.0–9.0s).
 */

export const OUTRO_MESSAGES = [
    {
        time: 2.4,
        sender: 'operator',
        text: 'Cyberpsycho terminated. Confirmed kill.',
    },
    {
        time: 4.2,
        sender: 'operator',
        text: 'Excellent work, agent.',
    },
    {
        time: 6.0,
        sender: 'agent',
        text: 'Initiating extraction.',
    },
    {
        time: 7.8,
        sender: 'operator',
        text: 'Copy that. See you on the other side.',
    },
];
