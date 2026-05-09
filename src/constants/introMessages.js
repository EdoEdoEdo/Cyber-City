/**
 * Intro dialogue messages — extracted from IntroManager so both the manager
 * (lazy-loaded into the Canvas) and the IntroUI overlay can share them
 * without forcing IntroManager into the main bundle.
 *
 * Beats start AFTER the player materializes (~12.5s) so the dialogue
 * accompanies the agent on screen, not the empty street.
 */

export const INTRO_MESSAGES = [
    {
        time: 11.0,
        sender: 'operator',
        text: 'Our intel says the Cyberpsycho is nearby.',
    },
    {
        time: 12.7,
        sender: 'agent',
        text: 'Roger. I can see the traces of his passage.',
    },
    {
        time: 14.4,
        sender: 'operator',
        text: 'Be careful. He’s a butcher...',
    },
    {
        time: 16.1,
        sender: 'agent',
        text: 'Just another Tuesday.',
    },
];
