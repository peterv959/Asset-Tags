/**
 * Demo mode utilities for displaying ZPL without sending to printer
 */

export function isInDemoMode(): boolean {
    // This is set during build from .env.local
    return (process.env.VITE_APP_MODE || 'production') === 'demo';
}

export function getDemoModeMessage(): string {
    return '🔧 DEMO MODE ENABLED - ZPL will be displayed instead of sent to printer';
}
