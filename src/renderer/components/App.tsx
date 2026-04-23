import React, { useState, useEffect } from 'react';
import { LabelForm, FormData } from './LabelForm';
import { LabelPreview } from './LabelPreview';
import { Preferences } from './Preferences';
import './App.css';

interface PreviewData {
    assetTag: string;
    serialNumber: string;
}

interface Printer {
    name: string;
    host: string;
    port?: number;
}

interface ErrorState {
    show: boolean;
    message: string;
}

interface TestResult {
    type: 'success' | 'error' | null;
    message: string;
}

export const App: React.FC = () => {
    const [formData, setFormData] = React.useState<FormData>({ assetTag: '', serialNumber: '' });
    const [printers, setPrinters] = React.useState<Printer[]>([]);
    const [selectedPrinterId, setSelectedPrinterId] = React.useState<number | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isTesting, setIsTesting] = React.useState(false);
    const [error, setError] = React.useState<ErrorState>({ show: false, message: '' });
    const [testResult, setTestResult] = React.useState<TestResult>({ type: null, message: '' });
    const [currentPage, setCurrentPage] = React.useState<'main' | 'preferences'>('main');
    const [configName, setConfigName] = React.useState<string>('BAR Ring Scanner');

    const assetTagInputRef = React.useRef<HTMLInputElement>(null);
    const printButtonRef = React.useRef<HTMLButtonElement>(null);

    // Handle hash-based routing for preferences
    React.useEffect(() => {
        const handleHashChange = () => {
            if (window.location.hash === '#preferences') {
                setCurrentPage('preferences');
            } else {
                setCurrentPage('main');
            }
        };

        handleHashChange(); // Check initial hash
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Load app defaults on mount
    React.useEffect(() => {
        const loadDefaults = async () => {
            try {
                const result = await (window.electron as any).appDefaults.load();
                if (result.success && result.defaults) {
                    // Use saved defaults for initial state
                    if (result.defaults.lastSelectedConfigName) {
                        setConfigName(result.defaults.lastSelectedConfigName);
                    }
                }
            } catch (err) {
                console.error('Failed to load app defaults:', err);
            }
        };
        loadDefaults();
    }, []);

    // Load printers on mount
    React.useEffect(() => {
        const loadPrinters = async () => {
            try {
                const result = await window.electron.label.loadPrinters();
                setPrinters(result.printers);

                // Find printer by name from config/defaults
                if (result.printers.length > 0) {
                    if (result.selectedPrinterName) {
                        const index = result.printers.findIndex(
                            (p) => p.name === result.selectedPrinterName
                        );
                        setSelectedPrinterId(index !== -1 ? index : 0);
                    } else {
                        setSelectedPrinterId(0);
                    }
                }
            } catch (err) {
                console.error('Failed to load printers:', err);
            }
        };
        loadPrinters();
    }, []);

    // Load available configs on mount and set default with fallback
    React.useEffect(() => {
        const loadAvailableConfigs = async () => {
            try {
                const result = await window.electron.label.getAvailableConfigs();
                if (result.success && result.configs && result.configs.length > 0) {
                    // Check if the hardcoded default exists, otherwise use first config
                    const defaultConfigName = 'BAR Ring Scanner';
                    const configExists = result.configs.some((c: any) => c.name === defaultConfigName);
                    const selectedName = configExists ? defaultConfigName : result.configs[0].name;
                    setConfigName(selectedName);
                }
            } catch (err) {
                console.error('Failed to load available configs:', err);
            }
        };
        loadAvailableConfigs();
    }, []);

    const handleFormBlur = (data: FormData) => {
        setFormData(data);
        setTestResult({ type: null, message: '' }); // Clear test results when inputs change
    };

    const handleConfigChange = (newConfigName: string) => {
        setConfigName(newConfigName);
        // Save to app defaults
        const saveConfig = async () => {
            try {
                const result = await (window.electron as any).appDefaults.load();
                const defaults = result.defaults || {};
                defaults.lastSelectedConfigName = newConfigName;
                await (window.electron as any).appDefaults.save(defaults);
            } catch (err) {
                console.error('Failed to save config default:', err);
            }
        };
        saveConfig();
    };

    // Save selected printer to config when it changes
    React.useEffect(() => {
        if (selectedPrinterId !== null && printers.length > 0) {
            const selectedPrinter = printers[selectedPrinterId];
            if (selectedPrinter) {
                window.electron.label.saveSelectedPrinter(selectedPrinter.name).catch((err) => {
                    console.error('Failed to save selected printer:', err);
                });
            }
        }
    }, [selectedPrinterId, printers]);

    const handlePrint = async () => {
        if (!formData.assetTag.trim() || selectedPrinterId === null) return;

        const printer = printers[selectedPrinterId];
        if (!printer) return;

        setIsLoading(true);
        try {
            const result = await window.electron.label.printLabel(formData, {
                host: printer.host,
                port: printer.port || 9100,
            });

            if (!result.success) {
                setError({ show: true, message: result.message });
            } else {
                // Focus back to asset tag input and select all text
                if (assetTagInputRef.current) {
                    assetTagInputRef.current.focus();
                    assetTagInputRef.current.select();
                }
            }
        } catch (err) {
            setError({
                show: true,
                message: err instanceof Error ? err.message : 'Failed to print label',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestConnection = async () => {
        if (!selectedPrinter) return;

        setIsTesting(true);
        try {
            const result = await window.electron.label.testPrinter({
                host: selectedPrinter.host,
                port: selectedPrinter.port || 9100,
            });

            setTestResult({
                type: result.success ? 'success' : 'error',
                message: result.message,
            });
        } catch (err) {
            setTestResult({
                type: 'error',
                message: err instanceof Error ? err.message : 'Connection test failed',
            });
        } finally {
            setIsTesting(false);
        }
    };

    const selectedPrinter = selectedPrinterId !== null ? printers[selectedPrinterId] : null;

    // Render preferences page if requested
    if (currentPage === 'preferences') {
        return React.createElement(
            'div',
            { className: 'app' },
            React.createElement(Preferences)
        );
    }

    return React.createElement(
        'div',
        { className: 'app' },
        React.createElement(
            'header',
            { className: 'app-header' },
            React.createElement('h1', null, 'Asset Tag Label Generator'),
            React.createElement('p', null, 'Generate and print property labels for DHL assets')
        ),
        React.createElement(
            'main',
            { className: 'app-main' },
            React.createElement(
                'div',
                { className: 'form-section' },
                React.createElement(LabelForm, {
                    onBlur: handleFormBlur,
                    onConfigChange: handleConfigChange,
                    isLoading,
                    assetTagRef: assetTagInputRef,
                })
            ),
            React.createElement(
                'div',
                { className: 'preview-section' },
                React.createElement(LabelPreview, {
                    assetTag: formData.assetTag,
                    serialNumber: formData.serialNumber,
                    configName,
                    onPrint: handlePrint,
                    isLoading,
                    printButtonRef,
                })
            )
        ),
        React.createElement(
            'div',
            { className: 'fixed-printer-panel' },
            React.createElement(
                'div',
                { className: 'printer-panel-content' },
                React.createElement(
                    'select',
                    {
                        id: 'printer-select-fixed',
                        value: selectedPrinterId ?? '',
                        onChange: (e) => setSelectedPrinterId(parseInt(e.currentTarget.value)),
                        disabled: (isLoading || isTesting) || printers.length === 0,
                        className: 'printer-select-fixed',
                    },
                    printers.length === 0
                        ? React.createElement('option', { value: '' }, 'No printers configured')
                        : [
                            React.createElement('option', { value: '', key: 'placeholder' }, 'Choose a printer...'),
                            ...printers.map((printer, index) =>
                                React.createElement(
                                    'option',
                                    { key: index, value: index },
                                    printer.name
                                )
                            ),
                        ]
                ),
                React.createElement(
                    'button',
                    {
                        onClick: handleTestConnection,
                        disabled: (isLoading || isTesting) || !selectedPrinter,
                        className: 'btn-test-connection',
                    },
                    isTesting ? 'Testing...' : 'Test'
                )
            ),
            testResult.type &&
            React.createElement(
                'div',
                { className: `test-result-display status-${testResult.type}` },
                testResult.message
            )
        ),
        error.show
            ? React.createElement(
                'div',
                { className: 'error-modal-overlay', onClick: () => setError({ ...error, show: false }) },
                React.createElement(
                    'div',
                    { className: 'error-modal', onClick: (e) => e.stopPropagation() },
                    React.createElement('h3', null, 'Print Error'),
                    React.createElement('p', null, error.message),
                    React.createElement(
                        'button',
                        { onClick: () => setError({ ...error, show: false }), className: 'btn-close' },
                        'Close'
                    )
                )
            )
            : null
    );
};
