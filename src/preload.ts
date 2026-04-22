import { contextBridge, ipcRenderer } from 'electron';

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

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
        send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
        on: (channel: string, func: (event: unknown, ...args: unknown[]) => void) =>
            ipcRenderer.on(channel, func),
        once: (channel: string, func: (event: unknown, ...args: unknown[]) => void) =>
            ipcRenderer.once(channel, func),
        removeListener: (channel: string, func: (event: unknown, ...args: unknown[]) => void) =>
            ipcRenderer.removeListener(channel, func),
    },
    label: {
        generateZPL: (labelData: LabelData) =>
            ipcRenderer.invoke('generate-zpl', labelData),
        printLabel: (labelData: LabelData, printerConfig: PrinterConfig) =>
            ipcRenderer.invoke('print-label', labelData, printerConfig),
        testPrinter: (printerConfig: PrinterConfig) =>
            ipcRenderer.invoke('test-printer', printerConfig),
        loadPrinters: () =>
            ipcRenderer.invoke('load-printers'),
        saveSelectedPrinter: (printerName: string) =>
            ipcRenderer.invoke('save-selected-printer', printerName),
        loadConfig: (configName?: string) =>
            ipcRenderer.invoke('load-label-config', configName),
        getAvailableConfigs: () =>
            ipcRenderer.invoke('get-available-configs'),
    },
    preferences: {
        load: () =>
            ipcRenderer.invoke('load-preferences'),
        save: (prefs: AppPreferences) =>
            ipcRenderer.invoke('save-preferences', prefs),
    },
    appDefaults: {
        load: () =>
            ipcRenderer.invoke('load-app-defaults'),
        save: (defaults: AppDefaults) =>
            ipcRenderer.invoke('save-app-defaults', defaults),
    },
});
