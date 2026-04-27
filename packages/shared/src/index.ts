// Shared utilities for Asset Tags monorepo

// ZPL Generation
export {
    generateZPL,
    getAvailableConfigs,
    loadLabelConfigByName,
    getLabelConfig,
    formatAssetTagForBarcode,
    formatAssetTagForCode128C,
    validateAssetTag,
    validateSerialNumber,
} from './zplGenerator';

export type { LabelData } from './zplGenerator';

// Printer Communication
export {
    sendToZebraPrinter,
    testPrinterConnection,
} from './printerCommunication';

export type { PrinterConfig } from './printerCommunication';

// Demo Mode
export {
    isInDemoMode,
    getDemoModeMessage,
} from './demoMode';
