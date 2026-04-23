import React, { useEffect, useState } from 'react';

interface Config {
    name: string;
    description?: string;
}

interface ConfigSelectorProps {
    onConfigChange: (configName: string) => void;
}

export const ConfigSelector: React.FC<ConfigSelectorProps> = ({ onConfigChange }) => {
    const [configs, setConfigs] = useState<Config[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<string>('BAR Ringscanner');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load available configs on mount
        const loadConfigs = async () => {
            try {
                const result = await window.electron.label.getAvailableConfigs();
                if (result.success && result.configs) {
                    setConfigs(result.configs);
                    // Set default to first config or BAR Ringscanner
                    const defaultConfig = result.configs.find((c: Config) => c.name === 'BAR Ring Scanner') || result.configs[0];
                    if (defaultConfig) {
                        setSelectedConfig(defaultConfig.name);
                    }
                } else {
                    setError(result.message || 'Failed to load configs');
                }
            } catch (err) {
                console.error('Error loading configs:', err);
                setError('Error loading label configurations');
            } finally {
                setLoading(false);
            }
        };

        loadConfigs();
    }, []);

    const handleConfigChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const configName = event.target.value;
        setSelectedConfig(configName);

        // Load the new config
        try {
            const result = await window.electron.label.loadConfig(configName);
            if (result.success) {
                onConfigChange(configName);
            } else {
                setError(result.message || 'Failed to load config');
            }
        } catch (err) {
            console.error('Error loading config:', err);
            setError('Error loading label configuration');
        }
    };

    if (loading) {
        return <div className="config-selector">Loading configurations...</div>;
    }

    return (
        <div className="config-selector">
            <label htmlFor="config-select">Label Template:</label>
            <select
                id="config-select"
                value={selectedConfig}
                onChange={handleConfigChange}
                className="config-select"
            >
                {configs.map((config) => (
                    <option key={config.name} value={config.name}>
                        {config.name}
                    </option>
                ))}
            </select>
            {error && <div className="config-error">{error}</div>}
        </div>
    );
};
