import React from 'react';
import './ZPLPreviewModal.css';

interface ZPLPreviewModalProps {
    zpl: string | string[];
    onClose: () => void;
    count?: number;
}

export const ZPLPreviewModal: React.FC<ZPLPreviewModalProps> = ({ zpl, onClose, count }) => {
    const isMultiple = Array.isArray(zpl);
    const zpls = Array.isArray(zpl) ? zpl : [zpl];

    const handleCopy = () => {
        const textToCopy = isMultiple ? zpls.join('\n\n---\n\n') : zpl as string;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert(`${isMultiple ? 'All ZPL' : 'ZPL'} copied to clipboard!`);
        });
    };

    return (
        <div className="zpl-modal-overlay" onClick={onClose}>
            <div className="zpl-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="zpl-modal-header">
                    <h2>📋 ZPL Preview {isMultiple && `(${count} Labels)`}</h2>
                    <button className="zpl-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="zpl-modal-body">
                    <p className="zpl-demo-notice">
                        🔧 Demo mode is enabled. This ZPL would be sent to the printer in production mode.
                    </p>
                    {isMultiple ? (
                        <div className="zpl-multiple">
                            {zpls.map((zplCode, index) => (
                                <div key={index} className="zpl-label-block">
                                    <div className="zpl-label-number">Label {index + 1}</div>
                                    <div className="zpl-code">
                                        <pre>{zplCode}</pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="zpl-code">
                            <pre>{zpl}</pre>
                        </div>
                    )}
                </div>
                <div className="zpl-modal-footer">
                    <button className="btn-primary" onClick={handleCopy}>Copy All ZPL</button>
                    <button className="btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};
