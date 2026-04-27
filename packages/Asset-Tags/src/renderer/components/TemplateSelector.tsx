import React, { useState, useEffect } from 'react';
import './TemplateSelector.css';

interface Config {
    name: string;
    description?: string;
}

interface TemplateSelectorProps {
    onSelect: (configName: string) => void;
    onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, onClose }) => {
    const [configs, setConfigs] = useState<Config[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadConfigs = async () => {
            try {
                const result = await window.electron.label.getAvailableConfigs();
                if (result.success && result.configs) {
                    setConfigs(result.configs);
                    if (result.configs.length > 0) {
                        setSelectedConfig(result.configs[0].name);
                    }
                } else {
                    setError(result.message || 'Failed to load templates');
                }
            } catch (err) {
                console.error('Error loading templates:', err);
                setError('Error loading templates');
            } finally {
                setLoading(false);
            }
        };

        loadConfigs();
    }, []);

    const handleSelect = () => {
        if (selectedConfig) {
            onSelect(selectedConfig);
        }
    };

    return (
        <div className="template-selector-overlay" onClick={onClose}>
            <div className="template-selector-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="dialog-header">
                    <h2>Select Label Template</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                <div className="dialog-body">
                    {loading ? (
                        <div className="loading">Loading templates...</div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : (
                        <div className="template-list">
                            {configs.map((config) => (
                                <div
                                    key={config.name}
                                    className={`template-item ${selectedConfig === config.name ? 'selected' : ''}`}
                                    onClick={() => setSelectedConfig(config.name)}
                                >
                                    <div className="template-name">{config.name}</div>
                                    {config.description && (
                                        <div className="template-description">{config.description}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="dialog-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-primary"
                        onClick={handleSelect}
                        disabled={!selectedConfig || loading}
                    >
                        Select
                    </button>
                </div>
            </div>
        </div>
    );
};
