export interface LabelData {
    assetTag: string;
    serialNumber?: string;
}

export interface PrinterConfig {
    host: string;
    port?: number;
    timeout?: number;
}

export interface Printer {
    name: string;
    host: string;
    port?: number;
}

export interface AppPreferences {
    printerConfigPath?: string;
    labelConfigPath?: string;
}

export interface AppDefaults {
    lastSelectedConfigName?: string;
    lastSelectedPrinterName?: string;
}

export interface ElectronAPI {
    ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
        send: (channel: string, ...args: unknown[]) => void;
        on: (channel: string, func: (event: unknown, ...args: unknown[]) => void) => void;
        once: (channel: string, func: (event: unknown, ...args: unknown[]) => void) => void;
        removeListener: (channel: string, func: (event: unknown, ...args: unknown[]) => void) => void;
    };
    label: {
        generateZPL: (labelData: LabelData) => Promise<{ success: boolean; zpl?: string; error?: string }>;
        printLabel: (labelData: LabelData, printerConfig: PrinterConfig) => Promise<{ success: boolean; message: string }>;
        testPrinter: (printerConfig: PrinterConfig) => Promise<{ success: boolean; message: string }>;
        loadPrinters: () => Promise<{ printers: Printer[]; selectedPrinterName: string | null }>;
        saveSelectedPrinter: (printerName: string) => Promise<{ success: boolean; message?: string }>;
        loadConfig: (configName?: string) => Promise<{ success: boolean; config?: unknown; availableConfigs?: unknown[]; message?: string }>;
        getAvailableConfigs: () => Promise<{ success: boolean; configs?: Array<{ name: string }>; message?: string }>;
    };
    preferences: {
        load: () => Promise<AppPreferences>;
        save: (prefs: AppPreferences) => Promise<{ success: boolean; message?: string }>;
    };
    appDefaults: {
        load: () => Promise<{ success: boolean; defaults?: AppDefaults; message?: string }>;
        save: (defaults: AppDefaults) => Promise<{ success: boolean; message?: string }>;
    };
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export { };
