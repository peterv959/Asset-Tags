import React, { useRef } from 'react';
import './LabelForm.css';

export interface FormData {
    assetTag: string;
    serialNumber: string;
}

interface LabelFormProps {
    onBlur: (data: FormData) => void;
    isLoading?: boolean;
    assetTagRef?: React.Ref<HTMLInputElement>;
}

export const LabelForm: React.FC<LabelFormProps> = ({ onBlur, isLoading = false, assetTagRef }) => {
    const [assetTag, setAssetTag] = React.useState('');
    const [serialNumber, setSerialNumber] = React.useState('');
    const [assetTagError, setAssetTagError] = React.useState('');
    const [serialNumberError, setSerialNumberError] = React.useState('');
    const serialNumberRef = useRef<HTMLInputElement>(null);

    const handleAssetTagChange = (value: string) => {
        // Only allow numeric characters
        const numericOnly = value.replace(/[^0-9]/g, '');
        setAssetTag(numericOnly);

        if (value !== numericOnly && value.length > 0) {
            setAssetTagError('Asset tag must contain only numbers');
        } else {
            setAssetTagError('');
        }
    };

    const handleSerialNumberChange = (value: string) => {
        // Only allow numeric characters and limit to 4
        const numericOnly = value.replace(/[^0-9]/g, '').slice(0, 4);
        setSerialNumber(numericOnly);

        if (value !== numericOnly && value.length > 0) {
            setSerialNumberError('Serial number must contain only numbers');
        } else {
            setSerialNumberError('');
        }
    };

    const handleAssetTagBlur = () => {
        if (assetTag) {
            onBlur({ assetTag, serialNumber });
            // Move focus to serial number
            serialNumberRef.current?.focus();
        }
    };

    const handleSerialNumberBlur = () => {
        onBlur({ assetTag, serialNumber });
    };

    return (
        <form className="label-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
                <label htmlFor="assetTag">Asset Tag *</label>
                <input
                    ref={assetTagRef}
                    id="assetTag"
                    type="text"
                    value={assetTag}
                    onChange={(e) => handleAssetTagChange(e.target.value)}
                    onBlur={handleAssetTagBlur}
                    placeholder="Enter asset tag number (numbers only)"
                    disabled={isLoading}
                    autoFocus
                />
                {assetTagError && <span className="error">{assetTagError}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="serialNumber">Serial Number (optional)</label>
                <input
                    ref={serialNumberRef}
                    id="serialNumber"
                    type="text"
                    value={serialNumber}
                    onChange={(e) => handleSerialNumberChange(e.target.value)}
                    onBlur={handleSerialNumberBlur}
                    placeholder="Up to 4 digits"
                    disabled={isLoading}
                />
                {serialNumberError && <span className="error">{serialNumberError}</span>}
            </div>
        </form>
    );
};
