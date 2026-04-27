import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods for label designer
contextBridge.exposeInMainWorld('electronAPI', {
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
    labelDesigner: {
        saveLabelConfig: (configData: unknown) =>
            ipcRenderer.invoke('save-label-config', configData),
        loadLabelConfigs: () =>
            ipcRenderer.invoke('load-label-configs'),
        exportLabelConfig: (configData: unknown, fileName: string) =>
            ipcRenderer.invoke('export-label-config', configData, fileName),
    },
});

declare global {
    interface Window {
        electronAPI: {
            ipcRenderer: {
                invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
                send: (channel: string, ...args: unknown[]) => void;
                on: (channel: string, func: (event: unknown, ...args: unknown[]) => void) => void;
                once: (
                    channel: string,
                    func: (event: unknown, ...args: unknown[]) => void
                ) => void;
                removeListener: (
                    channel: string,
                    func: (event: unknown, ...args: unknown[]) => void
                ) => void;
            };
            labelDesigner: {
                saveLabelConfig: (configData: unknown) => Promise<unknown>;
                loadLabelConfigs: () => Promise<unknown>;
                exportLabelConfig: (configData: unknown, fileName: string) => Promise<unknown>;
            };
        };
    }
}
