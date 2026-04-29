import React from 'react';
import './PrinterSelectionDialog.css';

interface Printer {
    name: string;
    host: string;
    port?: number;
}

interface TestResult {
    type: 'success' | 'error' | null;
    message: string;
}

interface PrinterSelectionDialogProps {
    printers: Printer[];
    selectedPrinterId: number | null;
    isLoading: boolean;
    isTesting: boolean;
    testResult: TestResult;
    onSelectPrinter: (index: number) => void;
    onTest: () => void;
    onClose: () => void;
}

export const PrinterSelectionDialog: React.FC<PrinterSelectionDialogProps> = ({
    printers,
    selectedPrinterId,
    isLoading,
    isTesting,
    testResult,
    onSelectPrinter,
    onTest,
    onClose,
}) => {
    return (
        <div className="printer-dialog-overlay" onClick={onClose}>
            <div className="printer-dialog-content" onClick={(e) => e.stopPropagation()}>
                <div className="dialog-header">
                    <h2>Printer Settings</h2>
                    <button className="close-button" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="dialog-body">
                    <label htmlFor="printer-select">Select Printer:</label>
                    <div className="printer-select-group">
                        <select
                            id="printer-select"
                            value={selectedPrinterId ?? ''}
                            onChange={(e) => onSelectPrinter(parseInt(e.currentTarget.value))}
                            disabled={isLoading || isTesting || printers.length === 0}
                            className="printer-select-dialog"
                        >
                            {printers.length === 0 ? (
                                <option value="">No printers configured</option>
                            ) : (
                                [
                                    <option value="" key="placeholder">
                                        Choose a printer...
                                    </option>,
                                    ...printers.map((printer, index) => (
                                        <option key={index} value={index}>
                                            {printer.name}
                                        </option>
                                    )),
                                ]
                            )}
                        </select>
                        <button
                            onClick={onTest}
                            disabled={isLoading || isTesting || selectedPrinterId === null}
                            className="btn-test-printer"
                        >
                            {isTesting ? 'Testing...' : 'Test Connection'}
                        </button>
                    </div>

                    {testResult.type && (
                        <div className={`test-result status-${testResult.type}`}>
                            {testResult.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
