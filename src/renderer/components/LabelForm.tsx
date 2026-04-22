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
    const serialNumberRef = useRef<HTMLInputElement>(null);

    const handleAssetTagBlur = () => {
        onBlur({ assetTag, serialNumber });
        // Move focus to serial number
        serialNumberRef.current?.focus();
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
                    onChange={(e) => setAssetTag(e.target.value)}
                    onBlur={handleAssetTagBlur}
                    placeholder="Enter asset tag number"
                    disabled={isLoading}
                    autoFocus
                />
            </div>

            <div className="form-group">
                <label htmlFor="serialNumber">Serial Number (optional)</label>
                <input
                    ref={serialNumberRef}
                    id="serialNumber"
                    type="text"
                    value={serialNumber}
                    onChange={(e) => {
                        const val = e.target.value.slice(0, 4);
                        setSerialNumber(val);
                    }}
                    onBlur={handleSerialNumberBlur}
                    placeholder="Up to 4 digits"
                    disabled={isLoading}
                    maxLength={4}
                />
            </div>
        </form>
    );
};
