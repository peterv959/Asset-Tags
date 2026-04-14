/**
 * ZPL (Zebra Programming Language) generator for asset tag labels
 * Label dimensions: 1.5" x 0.5" (304 x 102 dots at 203 DPI)
 */

export interface LabelData {
    assetTag: string;
    serialNumber?: string;
}

/**
 * Generate ZPL commands for a Zebra printer label
 * Label layout:
 * - Serial number (if present) rotated 90° on left side
 * - "Property of DHL" heading at top
 * - Barcode (Code 128C) of asset tag
 * - Human readable asset tag number at bottom
 */
export function generateZPL(data: LabelData): string {
    const { assetTag, serialNumber } = data;

    // Label size in dots (203 DPI): 1.5" x 0.5"
    const labelWidth = 304;
    const labelHeight = 102;

    let zpl = '^XA\n'; // Start format
    zpl += '^LL102\n'; // Label length 102 dots (0.5")
    zpl += '^PW304\n'; // Label width 304 dots (1.5")

    // If serial number present, add it rotated 90° on the left side (centered vertically)
    if (serialNumber && serialNumber.trim()) {
        // Serial number rotated 90° (rotation 2 = 90°), centered vertically
        zpl += '^FO10,51\n'; // Field origin left side, vertically centered
        zpl += '^A0R,30,22\n'; // Font A, rotation 2 (90°), height 30, width 22
        zpl += '^TA\n'; // Center align
        zpl += `^FD${serialNumber}^FS\n`;
    }

    // "Property of DHL" heading at top (centered)
    zpl += '^FO152,5\n'; // Field origin centered horizontally
    zpl += '^TA\n'; // Center align
    zpl += '^A0N,16,14\n'; // Normal font, height 16, width 14
    zpl += '^FDProperty of DHL^FS\n';

    // Code 128C barcode of asset tag (centered)
    zpl += '^FO152,24\n'; // Field origin centered horizontally
    zpl += '^TA\n'; // Center align
    zpl += `^B1C,Y,50,Y,Y\n`; // Code 128C barcode, height 50, print human readable
    zpl += `^FD${assetTag}^FS\n`;

    // Human readable asset tag number below barcode (centered)
    zpl += '^FO152,78\n'; // Field origin centered horizontally
    zpl += '^TA\n'; // Center align
    zpl += '^A0N,14,12\n'; // Smaller font for legend
    zpl += `^FD${assetTag}^FS\n`;

    zpl += '^XZ\n'; // End format

    return zpl;
}

/**
 * Format asset tag as Code 128C compatible format
 * Code 128C requires digits in pairs, so ensure even length
 */
export function formatAssetTagForCode128C(assetTag: string): string {
    // Remove non-digits
    const digits = assetTag.replace(/\D/g, '');

    // Code 128C works with digit pairs
    // If odd length, we might need to pad or handle differently
    return digits.length % 2 === 0 ? digits : '0' + digits;
}

/**
 * Validate asset tag format
 */
export function validateAssetTag(assetTag: string): boolean {
    return assetTag.trim().length > 0;
}

/**
 * Validate serial number format (optional, max 4 digits)
 */
export function validateSerialNumber(serialNumber: string): boolean {
    if (!serialNumber) return true; // Optional field
    const digits = serialNumber.replace(/\D/g, '');
    return digits.length <= 4;
}
