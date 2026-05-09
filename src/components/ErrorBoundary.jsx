/**
 * ErrorBoundary
 * Catches render errors in the React tree and shows a fallback UI
 * instead of a white screen. Wrap around <Canvas /> and other risky subtrees.
 */

import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // eslint-disable-next-line no-console
        console.error('[ErrorBoundary]', error, info?.componentStack);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        if (this.props.fallback) return this.props.fallback;

        return (
            <div style={styles.wrap}>
                <div style={styles.box}>
                    <div style={styles.title}>SYSTEM FAILURE</div>
                    <div style={styles.subtitle}>
                        Si è verificato un errore inatteso.
                    </div>
                    {this.state.error?.message && (
                        <pre style={styles.pre}>
                            {String(this.state.error.message)}
                        </pre>
                    )}
                    <button style={styles.btn} onClick={this.handleReload}>
                        REBOOT
                    </button>
                </div>
            </div>
        );
    }
}

const styles = {
    wrap: {
        position: 'fixed',
        inset: 0,
        background: '#0a0a12',
        color: '#00ffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        zIndex: 9999,
    },
    box: {
        maxWidth: 480,
        padding: 24,
        border: '1px solid #ff0080',
        boxShadow: '0 0 30px rgba(255,0,128,0.4)',
        background: 'rgba(0,0,0,0.6)',
    },
    title: {
        fontSize: 22,
        letterSpacing: 2,
        color: '#ff0080',
        marginBottom: 8,
    },
    subtitle: { fontSize: 14, marginBottom: 12, opacity: 0.8 },
    pre: {
        fontSize: 12,
        background: '#000',
        padding: 8,
        overflow: 'auto',
        maxHeight: 160,
        color: '#aaffff',
    },
    btn: {
        marginTop: 12,
        padding: '8px 16px',
        background: 'transparent',
        color: '#00ffff',
        border: '1px solid #00ffff',
        cursor: 'pointer',
        letterSpacing: 1,
        fontFamily: 'inherit',
    },
};
