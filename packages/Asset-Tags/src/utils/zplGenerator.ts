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
    name: string;
    description?: string;
    labelDimensions: {
        width: number;
        height: number;
        description?: string;
    };
    elements: Record<string, any>;
}

interface LabelConfigFile {
    configs: LabelConfig[];
    defaultConfig: string;
    notes?: string;
}

let cachedConfigFile: LabelConfigFile | null = null;
let cachedSelectedConfig: LabelConfig | null = null;
let selectedConfigName: string | null = null;

/**
 * Load the entire label config file (contains array of configs)
 * Handles both development and packaged exe scenarios
 */
function loadLabelConfigFile(): LabelConfigFile {
    if (cachedConfigFile) return cachedConfigFile;

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
    // Priority: preferences > default network path > bundled defaults
    const defaultNetworkPath = 'P:\\dhl-configs\\label-config.json';
    const paths = [
        customConfigPath,                                     // User-configured path (from preferences)
        defaultNetworkPath,                                   // Default network location
        path.join(appPath, 'label-config.json'),             // App root (packaged exe)
        path.join(appPath, 'dist/label-config.json'),        // Development dist folder
        path.join(resourcesPath || '', 'label-config.json'), // electron-builder resources
        path.join(resourcesPath || '', 'dist/label-config.json'),
    ].filter(p => p && p.length > 0);

    for (const configPath of paths) {
        try {
            if (configPath && fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf-8');
                cachedConfigFile = JSON.parse(content);
                console.log(`[OK] Loaded label config file from: ${configPath}`);
                return cachedConfigFile;
            }
        } catch (err) {
            console.error(`Could not load config from ${configPath}:`, err);
        }
    }

    console.error('Label config search paths:', paths);
    throw new Error(`label-config.json not found in any expected location`);
}

/**
 * Get list of available label configurations
 */
export function getAvailableConfigs(): { name: string; description?: string }[] {
    const configFile = loadLabelConfigFile();
    return configFile.configs.map(cfg => ({
        name: cfg.name,
        description: cfg.description,
    }));
}

/**
 * Load a specific label configuration by name
 */
export function loadLabelConfigByName(configName: string): LabelConfig {
    const configFile = loadLabelConfigFile();
    const config = configFile.configs.find(cfg => cfg.name === configName);

    if (!config) {
        throw new Error(`Label config not found: ${configName}`);
    }

    selectedConfigName = configName;
    cachedSelectedConfig = config;
    return config;
}

/**
 * Format asset tag for Code 128 barcode encoding
 * Code 128C encodes digit pairs. For odd-digit numbers:
 * - Encode first digit with Code 128A
 * - Switch to Code 128C for remaining pairs
 *
 * Example: 12345 → {A1{C2345
 * This encodes as: 1 (Code A), then 23 and 45 (Code C)
 */
export function formatAssetTagForBarcode(assetTag: string): string {
    const digits = assetTag.replace(/\D/g, ''); // Remove non-digits

    if (digits.length % 2 === 0) {
        // Even number of digits - all Code 128C
        return digits;
    } else {
        // Odd number of digits - Code 128A for first digit, then Code 128C for pairs
        const firstDigit = digits[0];
        const remainingPairs = digits.substring(1);
        return `{A${firstDigit}{C${remainingPairs}`;
    }
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

    // Load the selected config, or default if none selected
    let config: LabelConfig;
    if (cachedSelectedConfig && selectedConfigName) {
        config = cachedSelectedConfig;
    } else {
        const configFile = loadLabelConfigFile();
        const defaultName = configFile.defaultConfig;
        config = loadLabelConfigByName(defaultName);
    }

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
    // Format asset tag for proper Code 128 encoding (handles odd-digit numbers)
    const formattedAssetTag = formatAssetTagForBarcode(assetTag);
    zpl += `^FD${formattedAssetTag}^FS\n`;

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
    if (cachedSelectedConfig && selectedConfigName) {
        return cachedSelectedConfig;
    }
    // Load default config
    const configFile = loadLabelConfigFile();
    const defaultName = configFile.defaultConfig;
    return loadLabelConfigByName(defaultName);
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
