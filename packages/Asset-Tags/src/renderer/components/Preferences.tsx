import React, { useState, useEffect } from 'react';
import '../Preferences.css';

interface AppPreferences {
    printerConfigPath?: string;
    labelConfigPath?: string;
}

declare global {
    interface Window {
        electron: {
            preferences: {
                load: () => Promise<AppPreferences>;
                save: (prefs: AppPreferences) => Promise<{ success: boolean; message?: string }>;
            };
        };
    }
}

export function Preferences() {
    const [printerConfigPath, setPrinterConfigPath] = useState('');
    const [labelConfigPath, setLabelConfigPath] = useState('');
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const prefs = await window.electron.preferences.load();
            setPrinterConfigPath(prefs.printerConfigPath || '');
            setLabelConfigPath(prefs.labelConfigPath || '');
        } catch (error) {
            console.error('Error loading preferences:', error);
            setMessage('Error loading preferences');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');

        try {
            const result = await window.electron.preferences.save({
                printerConfigPath: printerConfigPath.trim() || undefined,
                labelConfigPath: labelConfigPath.trim() || undefined,
            });

            if (result.success) {
                setMessage('✓ Preferences saved successfully. Restart the app to apply changes.');
            } else {
                setMessage(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            setMessage('Error saving preferences');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = async () => {
        if (window.confirm('Clear all preferences and use default paths?')) {
            setIsSaving(true);
            try {
                const result = await window.electron.preferences.save({});
                if (result.success) {
                    setPrinterConfigPath('');
                    setLabelConfigPath('');
                    setMessage('✓ Preferences reset. App will use bundled config files.');
                } else {
                    setMessage(`Error: ${result.message}`);
                }
            } catch (error) {
                console.error('Error resetting preferences:', error);
                setMessage('Error resetting preferences');
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="preferences-container">
            <h1>Preferences</h1>

            <div className="preferences-section">
                <h2>Configuration File Paths</h2>
                <p className="info">
                    Enter network paths or local file paths to use custom configuration files.
                    Leave empty to use the bundled defaults.
                </p>

                <div className="form-group">
                    <label htmlFor="printerConfig">Printer Configuration Path (printers.json)</label>
                    <input
                        id="printerConfig"
                        type="text"
                        placeholder="e.g., \\server\shared\configs\printers.json or C:\path\to\printers.json"
                        value={printerConfigPath}
                        onChange={(e) => setPrinterConfigPath(e.target.value)}
                        disabled={isSaving}
                    />
                    <small>Location of printers.json file with printer configurations</small>
                </div>

                <div className="form-group">
                    <label htmlFor="labelConfig">Label Configuration Path (label-config.json)</label>
                    <input
                        id="labelConfig"
                        type="text"
                        placeholder="e.g., \\server\shared\configs\label-config.json or C:\path\to\label-config.json"
                        value={labelConfigPath}
                        onChange={(e) => setLabelConfigPath(e.target.value)}
                        disabled={isSaving}
                    />
                    <small>Location of label-config.json file with label layout settings</small>
                </div>
            </div>

            {message && (
                <div className={`message ${message.startsWith('✓') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="button-group">
                <button onClick={handleSave} disabled={isSaving} className="btn-save">
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
                <button onClick={handleReset} disabled={isSaving} className="btn-reset">
                    Reset to Defaults
                </button>
            </div>

            <div className="preferences-section info-box">
                <h3>Network Path Examples</h3>
                <ul>
                    <li><code>\\companyserver\shared\dhl-configs\printers.json</code></li>
                    <li><code>\\192.168.1.50\configs\label-config.json</code></li>
                </ul>
                <p>
                    <strong>Note:</strong> Changes take effect after restarting the application.
                    The app will check custom paths first, then fall back to bundled defaults if files are not found.
                </p>
            </div>
        </div>
    );
}
