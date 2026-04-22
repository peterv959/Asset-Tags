/**
 * ZPL (Zebra Programming Language) generator for asset tag labels
 * Configuration is loaded from label-config.json - see that file to adjust label layout
 * Label dimensions: 1.5" x 0.5" (304 x 102 dots at 203 DPI)
 */

import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export interface LabelData {
    assetTag: string;
    serialNumber?: string;
}

interface LabelConfig {
    labelDimensions: {
        width: number;
        height: number;
    };
    elements: {
        serialNumber: {
            enabled: boolean;
            position: { x: number; y: number };
            fieldBlock: { width: number; height: number; maxLines: number; alignment: string; overflow: number };
            font: { family: string; height: number; width: number };
            rotation: number;
        };
        heading: {
            text: string;
            position: { x: number; y: number };
            fieldBlock: { width: number; height: number; maxLines: number; alignment: string; overflow: number };
            font: { family: string; height: number; width: number };
            rotation: number;
        };
        barcode: {
            type: string;
            position: { x: number; y: number };
            fieldBlock: { width: number; height: number };
            height: number;
            printHumanReadable: boolean;
        };
        assetTagLabel: {
            position: { x: number; y: number };
            fieldBlock: { width: number; height: number; maxLines: number; alignment: string; overflow: number };
            font: { family: string; height: number; width: number };
            rotation: number;
        };
    };
}

let cachedConfig: LabelConfig | null = null;

/**
 * Load label configuration from label-config.json
 * Handles both development and packaged exe scenarios
 * Also checks user preferences for custom config path
 */
function loadLabelConfig(): LabelConfig {
    if (cachedConfig) return cachedConfig;

    const appPath = app.getAppPath();
    const resourcesPath = process.resourcesPath;
    const userDataPath = app.getPath('userData');

    // Try to load custom path from preferences
    let customConfigPath: string | null = null;
    try {
        const prefsPath = path.join(userDataPath, 'preferences.json');
        if (fs.existsSync(prefsPath)) {
            const prefsData = fs.readFileSync(prefsPath, 'utf-8');
            const prefs = JSON.parse(prefsData);
            if (prefs.labelConfigPath && fs.existsSync(prefs.labelConfigPath)) {
                customConfigPath = prefs.labelConfigPath;
            }
        }
    } catch (err) {
        console.error('Could not load preferences:', err);
    }

    // Try multiple paths to find label-config.json
    const paths = [
        customConfigPath,                                     // User-configured path
        path.join(appPath, 'label-config.json'),           // App root (packaged exe)
        path.join(appPath, 'dist/label-config.json'),      // Development dist folder
        path.join(resourcesPath || '', 'label-config.json'), // electron-builder resources
        path.join(resourcesPath || '', 'dist/label-config.json'),
    ].filter(p => p && p.length > 0); // Remove empty paths

    for (const configPath of paths) {
        try {
            if (configPath && fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf-8');
                cachedConfig = JSON.parse(content);
                console.log(`✓ Loaded label config from: ${configPath}`);
                return cachedConfig;
            }
        } catch (err) {
            console.error(`Could not load config from ${configPath}:`, err);
        }
    }

    // If all paths fail, throw error with debug info
    console.error('Label config search paths:', paths);
    console.error('app.getAppPath():', appPath);
    console.error('process.resourcesPath:', resourcesPath);
    throw new Error(`label-config.json not found in any expected location`);
}

/**
 * Generate ZPL commands for a Zebra printer label
 * Configuration is parameter-driven from label-config.json
 * Uses Field Block (^FB) for perfect text centering
 */
export function generateZPL(data: LabelData): string {
    const { assetTag, serialNumber } = data;

    // Validate that asset tag contains only numbers (Code 128C requirement)
    if (!/^\d+$/.test(assetTag)) {
        throw new Error('Asset tag must contain only numeric digits for Code 128C barcode');
    }

    // Validate serial number if provided (should also be numeric)
    if (serialNumber && !/^\d*$/.test(serialNumber)) {
        throw new Error('Serial number must contain only numeric digits');
    }

    const config = loadLabelConfig();
    const { labelDimensions, elements } = config;

    let zpl = '^XA\n'; // Start format
    zpl += `^LL${labelDimensions.height}\n`; // Label length
    zpl += `^PW${labelDimensions.width}\n`; // Label width

    // Serial number (if enabled and present)
    if (elements.serialNumber.enabled && serialNumber && serialNumber.trim()) {
        const sn = elements.serialNumber;
        const rotChar = getRotationChar(sn.rotation);
        const fb = sn.fieldBlock;

        zpl += `^FO${sn.position.x},${sn.position.y}\n`;
        zpl += `^FB${fb.width},${fb.height},${fb.maxLines},${fb.alignment},${fb.overflow}\n`;
        zpl += `^${sn.font.family}0${rotChar},${sn.font.height},${sn.font.width}\n`;
        zpl += `^FD${serialNumber}^FS\n`;
    }

    // Heading
    const heading = elements.heading;
    const headingRotChar = getRotationChar(heading.rotation);
    const headingFb = heading.fieldBlock;

    zpl += `^FO${heading.position.x},${heading.position.y}\n`;
    zpl += `^FB${headingFb.width},${headingFb.height},${headingFb.maxLines},${headingFb.alignment},${headingFb.overflow}\n`;
    zpl += `^${heading.font.family}0${headingRotChar},${heading.font.height},${heading.font.width}\n`;
    zpl += `^FD${heading.text}^FS\n`;

    // Barcode - Note: Field Block with barcode needs special handling
    // Some printers support ^FB with barcodes, others don't - we'll position the barcode directly
    const barcode = elements.barcode;
    const barcodeBlockWidth = barcode.fieldBlock.width;
    // Center the barcode field origin: left edge + (block width / 2)
    const barcodeCenterX = barcode.position.x + (barcodeBlockWidth / 2);

    zpl += `^FO${Math.round(barcodeCenterX)},${barcode.position.y}\n`;
    // For barcode, use TA (center align) since ^FB with barcodes may not work on all printers
    zpl += '^TA\n';
    const hrChar = barcode.printHumanReadable ? 'Y' : 'N';
    zpl += `^${barcode.type},Y,${barcode.height},Y,${hrChar}\n`;
    zpl += `^FD${assetTag}^FS\n`;

    zpl += '^XZ\n'; // End format

    return zpl;
}

/**
 * Convert rotation angle (0, 1, 2, 3) to ZPL rotation character
 */
function getRotationChar(rotation: number): string {
    const chars = ['N', 'R', 'I', 'B']; // N=0°, R=90°, I=180°, B=270°
    return chars[rotation % 4] || 'N';
}

/**
 * Get the current label configuration (used by preview and printing)
 */
export function getLabelConfig(): LabelConfig {
    return loadLabelConfig();
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
