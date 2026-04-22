import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { generateZPL, LabelData } from './utils/zplGenerator';
import { sendToZebraPrinter, testPrinterConnection, PrinterConfig } from './utils/printerCommunication';

interface Printer {
    name: string;
    host: string;
    port?: number;
}

interface AppPreferences {
    printerConfigPath?: string;
    labelConfigPath?: string;
}

interface AppDefaults {
    lastSelectedConfigName?: string;
    lastSelectedPrinterName?: string;
}

let mainWindow: BrowserWindow | null = null;
let preferencesWindow: BrowserWindow | null = null;

// Get preferences file path (stored in userData, outside app bundle)
const getPreferencesFilePath = (): string => {
    return path.join(app.getPath('userData'), 'preferences.json');
};

// Get app defaults file path (stores last selected printer/config per device)
const getAppDefaultsFilePath = (): string => {
    return path.join(app.getPath('userData'), 'app-defaults.json');
};

// Load app defaults from userData
const loadAppDefaults = (): AppDefaults => {
    const defaultsPath = getAppDefaultsFilePath();
    try {
        if (fs.existsSync(defaultsPath)) {
            const content = fs.readFileSync(defaultsPath, 'utf-8');
            return JSON.parse(content);
        }
    } catch (err) {
        console.error('Error loading app defaults:', err);
    }
    return {};
};

// Save app defaults to userData
const saveAppDefaults = (defaults: AppDefaults): void => {
    const defaultsPath = getAppDefaultsFilePath();
    try {
        fs.writeFileSync(defaultsPath, JSON.stringify(defaults, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error saving app defaults:', err);
    }
};

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    const isDev = process.env.NODE_ENV === 'development';

    // Always load from dist/public since that's where the build output goes
    const htmlPath = path.join(__dirname, 'public/index.html');

    mainWindow.loadFile(htmlPath);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

// Load preferences from userData
const loadPreferences = (): AppPreferences => {
    try {
        const prefsPath = getPreferencesFilePath();
        if (fs.existsSync(prefsPath)) {
            const data = fs.readFileSync(prefsPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
    return {};
};

// Save preferences to userData
const savePreferences = (prefs: AppPreferences): void => {
    try {
        const userDataPath = app.getPath('userData');
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
        }
        const prefsPath = getPreferencesFilePath();
        fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 4), 'utf-8');
    } catch (error) {
        console.error('Error saving preferences:', error);
    }
};

// Create preferences window
const createPreferencesWindow = () => {
    if (preferencesWindow) {
        preferencesWindow.focus();
        return;
    }

    preferencesWindow = new BrowserWindow({
        width: 600,
        height: 400,
        parent: mainWindow || undefined,
        modal: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    const htmlPath = path.join(__dirname, 'public/index.html');
    preferencesWindow.loadFile(htmlPath, { hash: 'preferences' });

    preferencesWindow.on('closed', () => {
        preferencesWindow = null;
    });
};

// Create a minimal menu with Edit options for keyboard shortcuts
const template: Electron.MenuItemConstructorOptions[] = [
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Preferences',
                accelerator: 'CmdOrCtrl+,',
                click: () => {
                    createPreferencesWindow();
                },
            },
            { type: 'separator' },
            {
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo',
            },
            {
                label: 'Redo',
                accelerator: 'CmdOrCtrl+Shift+Z',
                role: 'redo',
            },
            { type: 'separator' },
            {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                role: 'cut',
            },
            {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy',
            },
            {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                role: 'paste',
            },
            { type: 'separator' },
            {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                role: 'selectAll',
            },
        ],
    },
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC: Load printers from config file
ipcMain.handle('load-printers', async () => {
    try {
        const prefs = loadPreferences();
        const appDefaults = loadAppDefaults();
        let configPath: string | null = null;

        // Priority: user preferences > default network path > bundled
        if (prefs.printerConfigPath && fs.existsSync(prefs.printerConfigPath)) {
            configPath = prefs.printerConfigPath;
        } else {
            // Try default network location
            const defaultNetworkPath = 'P:\\dhl-configs\\printers.json';
            if (fs.existsSync(defaultNetworkPath)) {
                configPath = defaultNetworkPath;
            } else {
                // Fall back to bundled paths
                configPath = path.join(__dirname, 'printers.json');
                if (!fs.existsSync(configPath)) {
                    configPath = path.join(app.getAppPath(), 'printers.json');
                }
            }
        }

        if (configPath && fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8');
            const config = JSON.parse(data);
            return {
                printers: config.printers || [],
                selectedPrinterName: appDefaults.lastSelectedPrinterName || config.selectedPrinterName || null,
            };
        }
        return { printers: [], selectedPrinterName: null };
    } catch (error) {
        console.error('Failed to load printers config:', error);
        return { printers: [], selectedPrinterName: null };
    }
});

// IPC: Save selected printer to config and app defaults
ipcMain.handle('save-selected-printer', async (_event, printerName: string) => {
    try {
        const prefs = loadPreferences();
        let configPath: string | null = null;

        // Priority: user preferences > default network path > bundled
        if (prefs.printerConfigPath && fs.existsSync(prefs.printerConfigPath)) {
            configPath = prefs.printerConfigPath;
        } else {
            // Try default network location
            const defaultNetworkPath = 'P:\\dhl-configs\\printers.json';
            if (fs.existsSync(defaultNetworkPath)) {
                configPath = defaultNetworkPath;
            } else {
                // Fall back to bundled paths
                configPath = path.join(__dirname, 'printers.json');
                if (!fs.existsSync(configPath)) {
                    configPath = path.join(app.getAppPath(), 'printers.json');
                }
            }
        }

        // Save to config file if writable
        if (configPath && fs.existsSync(configPath)) {
            try {
                const data = fs.readFileSync(configPath, 'utf-8');
                const config = JSON.parse(data);
                config.selectedPrinterName = printerName;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf-8');
            } catch (err) {
                console.error('Could not save to config file, will save to local defaults:', err);
            }
        }

        // Always save to local app defaults
        const defaults = loadAppDefaults();
        defaults.lastSelectedPrinterName = printerName;
        saveAppDefaults(defaults);

        return { success: true };
    } catch (error) {
        console.error('Failed to save selected printer:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
});

// IPC: Generate ZPL for preview
ipcMain.handle('generate-zpl', async (_event, labelData: LabelData) => {
    try {
        const zpl = generateZPL(labelData);
        return { success: true, zpl };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
});

// IPC: Send label to printer
ipcMain.handle(
    'print-label',
    async (_event, labelData: LabelData, printerConfig: PrinterConfig) => {
        try {
            const zpl = generateZPL(labelData);
            const result = await sendToZebraPrinter(zpl, printerConfig);
            return result;
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
);

// IPC: Test printer connection
ipcMain.handle('test-printer', async (_event, printerConfig: PrinterConfig) => {
    try {
        const result = await testPrinterConnection(printerConfig);
        return result;
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
});

// IPC: Load preferences
ipcMain.handle('load-preferences', async () => {
    return loadPreferences();
});

// IPC: Save preferences
ipcMain.handle('save-preferences', async (_event, prefs: AppPreferences) => {
    try {
        savePreferences(prefs);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
});

// IPC: Load app defaults (last selected printer/config)
ipcMain.handle('load-app-defaults', async () => {
    try {
        const defaults = loadAppDefaults();
        return { success: true, defaults };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
});

// IPC: Save app defaults (last selected printer/config)
ipcMain.handle('save-app-defaults', async (_event, defaults: AppDefaults) => {
    try {
        saveAppDefaults(defaults);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
});

// IPC: Load label config (for preview positioning)
ipcMain.handle('load-label-config', async (event, configName?: string) => {
    try {
        const { loadLabelConfigByName, getAvailableConfigs } = await import('./utils/zplGenerator');

        if (configName) {
            // Load specific config by name
            const config = loadLabelConfigByName(configName);
            return { success: true, config, availableConfigs: getAvailableConfigs() };
        } else {
            // Load default config
            const { getLabelConfig } = await import('./utils/zplGenerator');
            const config = getLabelConfig();
            return { success: true, config, availableConfigs: getAvailableConfigs() };
        }
    } catch (error) {
        console.error('Error loading label config:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to load config',
        };
    }
});

// IPC: Get available label configurations
ipcMain.handle('get-available-configs', async () => {
    try {
        const { getAvailableConfigs } = await import('./utils/zplGenerator');
        const configs = getAvailableConfigs();
        return { success: true, configs };
    } catch (error) {
        console.error('Error getting available configs:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to get configs',
        };
    }
});
