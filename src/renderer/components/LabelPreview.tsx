import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import './LabelPreview.css';

interface LabelPreviewProps {
    assetTag: string;
    serialNumber?: string;
    onPrint?: () => void;
    isLoading?: boolean;
    printButtonRef?: React.Ref<HTMLButtonElement>;
}

export const LabelPreview: React.FC<LabelPreviewProps> = ({
    assetTag,
    serialNumber,
    onPrint,
    isLoading = false,
    printButtonRef,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const barcodeRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

        const padding = 10;

        // Draw serial number rotated 90° on the left side (if present)
        if (serialNumber && serialNumber.trim()) {
            ctx.save();
            ctx.translate(15, canvas.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(serialNumber, 0, 0);
            ctx.restore();
        }

        // Draw "Property of DHL" at top
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Property of DHL', canvas.width / 2, padding + 12);

        // Draw human readable asset tag below barcode area (or placeholder)
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        const displayText = assetTag || '(No asset tag)';
        ctx.fillText(displayText, canvas.width / 2, canvas.height - 5);
    }, [assetTag, serialNumber]);

    // Generate barcode in SVG element
    useEffect(() => {
        if (barcodeRef.current && assetTag && assetTag.trim()) {
            try {
                JsBarcode(barcodeRef.current, assetTag, {
                    format: 'CODE128',
                    width: 2,
                    height: 60,
                    displayValue: false,
                    margin: 0,
                });
            } catch (error) {
                console.error('Barcode generation error:', error);
            }
        } else if (barcodeRef.current) {
            // Clear barcode if no asset tag
            barcodeRef.current.innerHTML = '';
        }
    }, [assetTag]);

    return (
        <div className="label-preview-container">
            <div className="preview-header">
                <h3>Label Preview (1.5" × 0.5")</h3>
                <button
                    ref={printButtonRef}
                    onClick={onPrint}
                    disabled={isLoading || !assetTag.trim()}
                    className="btn-print-inline"
                >
                    {isLoading ? 'Printing...' : 'Print'}
                </button>
            </div>
            <div className="label-preview-wrapper">
                <canvas
                    ref={canvasRef}
                    width={304}
                    height={102}
                    className="label-canvas"
                />
                <svg
                    ref={barcodeRef}
                    className="label-barcode"
                />
            </div>
            <div className="preview-info">
                <p>Asset Tag: <strong>{assetTag || '(Enter to display)'}</strong></p>
                {serialNumber && <p>Serial Number: <strong>{serialNumber}</strong></p>}
            </div>
        </div>
    );
};
