import React, { useState, useEffect } from 'react';
import './PrinterDialog.css';

interface Printer {
    name: string;
    host: string;
    port?: number;
}

interface PrinterDialogProps {
    labelData: {
        assetTag: string;
        serialNumber?: string;
    };
    onClose: () => void;
}

export const PrinterDialog: React.FC<PrinterDialogProps> = ({ labelData, onClose }) => {
    const [printers, setPrinters] = useState<Printer[]>([]);
    const [selectedPrinterId, setSelectedPrinterId] = useState<number | null>(null);
    const [printerHost, setPrinterHost] = useState('');
    const [printerPort, setPrinterPort] = useState('9100');
    const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(
        null
    );
    const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load printers from config on mount
    useEffect(() => {
        const loadPrinters = async () => {
            try {
                const loadedPrinters = await window.electron.label.loadPrinters();
                setPrinters(loadedPrinters);
            } catch (error) {
                console.error('Failed to load printers:', error);
            }
        };
        loadPrinters();
    }, []);

    // Update host and port when selected printer changes
    const handlePrinterSelect = (id: number) => {
        setSelectedPrinterId(id);
        setTestResult(null);
        setStatus(null);
        const printer = printers[id];
        if (printer) {
            setPrinterHost(printer.host);
            setPrinterPort(String(printer.port || 9100));
        }
    };

    const selectedPrinter = selectedPrinterId !== null ? printers[selectedPrinterId] : null;

    const handleTestConnection = async () => {
        setTestResult(null);
        setIsLoading(true);
        try {
            const result = await window.electron.label.testPrinter({
                host: printerHost,
                port: parseInt(printerPort) || 9100,
            });

            setTestResult({
                type: result.success ? 'success' : 'error',
                message: result.message,
            });
        } catch (error) {
            setTestResult({
                type: 'error',
                message: error instanceof Error ? error.message : 'Connection failed',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = async () => {
        if (!printerHost.trim()) {
            setStatus({ type: 'error', message: 'Please enter printer IP or hostname' });
            return;
        }

        setIsLoading(true);
        try {
            const result = await window.electron.label.printLabel(labelData, {
                host: printerHost,
                port: parseInt(printerPort) || 9100,
            });

            setStatus({
                type: result.success ? 'success' : 'error',
                message: result.message,
            });

            if (result.success) {
                setTimeout(() => onClose(), 2000);
            }
        } catch (error) {
            setStatus({
                type: 'error',
                message: error instanceof Error ? error.message : 'Print failed',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="printer-dialog-overlay">
            <div className="printer-dialog">
                <h2>Send to Zebra Printer</h2>

                <div className="dialog-content">
                    {/* Printer Selection */}
                    <div className="form-group">
                        <label htmlFor="printerSelect">Select Printer *</label>
                        <select
                            id="printerSelect"
                            value={selectedPrinterId ?? ''}
                            onChange={(e) => handlePrinterSelect(parseInt(e.target.value))}
                            disabled={isLoading || printers.length === 0}
                        >
                            <option value="">
                                {printers.length === 0 ? 'No printers configured' : 'Choose a printer...'}
                            </option>
                            {printers.map((printer, index) => (
                                <option key={index} value={index}>
                                    {printer.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Selected Printer Display or Legend */}
                    {selectedPrinter ? (
                        <div className="printer-info">
                            <p>
                                <strong>{selectedPrinter.name}</strong>
                            </p>
                            <p className="printer-details">
                                {selectedPrinter.host}:{selectedPrinter.port || 9100}
                            </p>
                        </div>
                    ) : (
                        <div className="printer-info placeholder">
                            <p>No printer selected</p>
                        </div>
                    )}

                    {/* Test Connection Button and Result */}
                    {selectedPrinter && (
                        <div className="test-connection-group">
                            <button
                                onClick={handleTestConnection}
                                disabled={isLoading || !selectedPrinter}
                                className="btn-test"
                            >
                                {isLoading ? 'Testing...' : 'Test Connection'}
                            </button>
                            {testResult && (
                                <div className={`test-result status-${testResult.type}`}>
                                    {testResult.message}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status Messages */}
                    {status && (
                        <div className={`status-message status-${status.type}`}>
                            {status.message}
                        </div>
                    )}

                    {/* Label Summary */}
                    <div className="summary">
                        <h4>Label Summary:</h4>
                        <p>Asset Tag: <strong>{labelData.assetTag}</strong></p>
                        {labelData.serialNumber && <p>Serial: <strong>{labelData.serialNumber}</strong></p>}
                    </div>
                </div>

                <div className="dialog-actions">
                    <button
                        onClick={handlePrint}
                        disabled={isLoading || !selectedPrinter}
                        className="btn-primary"
                    >
                        {isLoading ? 'Printing...' : 'Send to Printer'}
                    </button>
                    <button onClick={onClose} disabled={isLoading} className="btn-cancel">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
