import React, { useState } from 'react';
import './ConsecutivePrintDialog.css';

interface ConsecutivePrintDialogProps {
    onPrint: (count: number) => void;
    onClose: () => void;
    isLoading: boolean;
    serialNumber?: string;
}

export const ConsecutivePrintDialog: React.FC<ConsecutivePrintDialogProps> = ({
    onPrint,
    onClose,
    isLoading,
    serialNumber = '',
}) => {
    const [count, setCount] = useState('1');
    const [error, setError] = useState('');
    const hasSerialNumber = serialNumber.trim().length > 0;

    const handlePrint = () => {
        if (hasSerialNumber) {
            setError('Serial numbers cannot be included on consecutive labels. Please clear the Serial Number field first.');
            return;
        }

        const parsed = parseInt(count);
        if (isNaN(parsed) || parsed < 1 || parsed > 100) {
            setError('Please enter a number between 1 and 100');
            return;
        }
        onPrint(parsed);
    };

    const handleCountChange = (value: string) => {
        const numericOnly = value.replace(/[^0-9]/g, '');
        setCount(numericOnly || '1');
        setError('');
    };

    return (
        <div className="consecutive-print-overlay" onClick={onClose}>
            <div className="consecutive-print-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="dialog-header">
                    <h2>Print Consecutive Labels</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                <div className="dialog-body">
                    {hasSerialNumber && (
                        <div className="warning-message">
                            ⚠️ Serial Number Conflict
                            <p>Serial numbers cannot be included on consecutive labels. To print multiple labels with different serial numbers, print them individually.</p>
                        </div>
                    )}
                    <p>How many labels would you like to print?</p>
                    <div className="input-group">
                        <input
                            type="text"
                            value={count}
                            onChange={(e) => handleCountChange(e.target.value)}
                            placeholder="Enter number (1-100)"
                            disabled={isLoading}
                            autoFocus
                        />
                        <span className="input-hint">(1-100)</span>
                    </div>
                    {error && <div className="error-message">{error}</div>}
                </div>
                <div className="dialog-footer">
                    <button
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handlePrint}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Printing...' : 'Print'}
                    </button>
                </div>
            </div>
        </div>
    );
};
