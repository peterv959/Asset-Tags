import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import './LabelPreview.css';

interface LabelPreviewProps {
    assetTag: string;
    serialNumber?: string;
    configName?: string;
    onPrint?: () => void;
    isLoading?: boolean;
    printButtonRef?: React.Ref<HTMLButtonElement>;
}

interface LabelConfig {
    name: string;
    description?: string;
    labelDimensions: {
        width: number;
        height: number;
    };
    elements: {
        serialNumber?: {
            enabled: boolean;
            position: { x: number; y: number };
            font: { height: number; width: number };
        };
        heading: {
            text: string;
            position: { x: number; y: number };
            fieldBlock: { width: number; height: number };
            font: { height: number; width: number };
        };
        barcode: {
            position: { x: number; y: number };
            height: number;
        };
        qrcode?: {
            position: { x: number; y: number };
            fieldBlock: { width: number; height: number };
        };
        assetTag?: {
            position: { x: number; y: number };
            font: { height: number; width: number };
        };
    };
}

export const LabelPreview: React.FC<LabelPreviewProps> = ({
    assetTag,
    serialNumber,
    configName,
    onPrint,
    isLoading = false,
    printButtonRef,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const barcodeRef = useRef<SVGSVGElement>(null);
    const [labelConfig, setLabelConfig] = useState<LabelConfig | null>(null);

    // Load label config from backend
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const result = await window.electron.label.loadConfig(configName);
                if (result.success) {
                    setLabelConfig(result.config);
                }
            } catch (error) {
                console.error('Error loading label config:', error);
            }
        };
        loadConfig();
    }, [configName]);

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

        // Draw serial number rotated 90° on the left side (if present)
        if (serialNumber && serialNumber.trim()) {
            ctx.save();
            // Position from config, or default
            const snX = labelConfig?.elements.serialNumber.position.x ?? 10;
            const snY = labelConfig?.elements.serialNumber.position.y ?? 51;
            ctx.translate(snX, snY);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(serialNumber, 0, 0);
            ctx.restore();
        }

        // Draw "Property of DHL" at top using config position
        const heading = labelConfig?.elements.heading;
        if (heading) {
            const headingX = heading.position.x + (heading.fieldBlock.width / 2);
            const headingY = heading.position.y + heading.font.height - 2;
            ctx.fillStyle = '#000';
            ctx.font = `bold ${heading.font.height}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(heading.text, headingX, headingY);
        }
    }, [assetTag, serialNumber, labelConfig]);

    // Generate barcode in SVG element
    useEffect(() => {
        if (barcodeRef.current && assetTag && assetTag.trim()) {
            try {
                const barcodeHeight = labelConfig?.elements.barcode.height ?? 50;
                JsBarcode(barcodeRef.current, assetTag, {
                    format: 'CODE128',
                    width: 2,
                    height: barcodeHeight,
                    displayValue: true,
                    margin: 0,
                });
            } catch (error) {
                console.error('Barcode generation error:', error);
            }
        } else if (barcodeRef.current) {
            // Clear barcode if no asset tag
            barcodeRef.current.innerHTML = '';
        }
    }, [assetTag, labelConfig]);

    return (
        <div className="label-preview-container">
            <div className="preview-header">
                <div className="preview-title-section">
                    <h3>Label Preview</h3>
                    {labelConfig?.description && (
                        <p className="preview-description">{labelConfig.description}</p>
                    )}
                </div>
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
                    style={{
                        left: labelConfig ? `${labelConfig.elements.barcode.position.x + labelConfig.elements.barcode.fieldBlock.width / 2}px` : '152px',
                        top: labelConfig ? `${labelConfig.elements.barcode.position.y}px` : '28px',
                        height: labelConfig ? `${labelConfig.elements.barcode.height}px` : '50px',
                        transform: 'translateX(-50%)',
                    }}
                />
            </div>
            <div className="preview-info">
                <p>Asset Tag: <strong>{assetTag || '(Enter to display)'}</strong></p>
                {serialNumber && <p>Serial Number: <strong>{serialNumber}</strong></p>}
            </div>
        </div>
    );
};
