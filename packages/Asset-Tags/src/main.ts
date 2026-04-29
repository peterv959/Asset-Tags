import { app, BrowserWindow, ipcMain, Menu, MenuItem } from 'electron';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { generateZPL } from './utils/zplGenerator';
import type { LabelData } from './utils/zplGenerator';
import { sendToZebraPrinter, testPrinterConnection } from './utils/printerCommunication';
import type { PrinterConfig } from './utils/printerCommunication';
import { isInDemoMode } from './utils/demoMode';

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

const loadEnvLocal = (): void => {
    const candidatePaths: string[] = [
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(__dirname, '../.env.local'),
        path.resolve(__dirname, '../../.env.local'),
        path.resolve(__dirname, '../../../.env.local'),
    ];

    try {
        candidatePaths.push(path.join(app.getAppPath(), '.env.local'));
    } catch {
        // Ignore app path resolution errors in early startup
    }

    const uniquePaths = [...new Set(candidatePaths)];

    for (const envPath of uniquePaths) {
        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath, override: false });
            console.log(`[ENV] Loaded .env.local from: ${envPath}`);
            return;
        }
    }
};

loadEnvLocal();

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

const isZplDumpEnabled = (): boolean => {
    const value = (process.env.ZPL_DUMP_ENABLED || '').trim().toLowerCase();
    return value === '1' || value === 'true' || value === 'yes' || value === 'on';
};

const getZplDumpDir = (): string => {
    const configuredPath = (process.env.ZPL_DUMP_DIR || '').trim();
    if (configuredPath.length > 0) {
        return configuredPath;
    }
    return path.join(app.getPath('userData'), 'zpl-dumps');
};

const sanitizeForFilename = (value: string): string => {
    return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
};

const dumpZplToFile = (zpl: string, labelData: LabelData, source: 'generate' | 'print'): void => {
    if (!isZplDumpEnabled()) {
        return;
    }

    try {
        const dumpDir = getZplDumpDir();
        fs.mkdirSync(dumpDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const assetTagPart = sanitizeForFilename(labelData.assetTag || 'unknown');
        const serialPart = labelData.serialNumber
            ? `_sn-${sanitizeForFilename(labelData.serialNumber)}`
            : '';
        const fileName = `${timestamp}_${source}_asset-${assetTagPart}${serialPart}.zpl`;
        const filePath = path.join(dumpDir, fileName);

        fs.writeFileSync(filePath, zpl, 'utf-8');
        console.log(`[ZPL DUMP] Wrote ${filePath}`);
    } catch (error) {
        console.error('[ZPL DUMP] Failed to write ZPL file:', error);
    }
};

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 840,
        height: 420,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
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
        ...(mainWindow ? { parent: mainWindow } : {}),
        modal: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
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
const buildApplicationMenu = () => {
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: 'Templates',
            submenu: [
                {
                    label: 'Loading templates...',
                    enabled: false,
                },
            ],
        },
        {
            label: 'Printing',
            submenu: [
                {
                    label: 'Print Consecutive Labels...',
                    accelerator: 'CmdOrCtrl+Shift+P',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('open-consecutive-print-dialog');
                        }
                    },
                },
                { type: 'separator' },
                {
                    label: 'Printer Settings...',
                    accelerator: 'CmdOrCtrl+Shift+I',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('open-printer-dialog');
                        }
                    },
                },
            ],
        },
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
};

// Update templates menu dynamically
const updateTemplatesMenu = () => {
    try {
        const { getAvailableConfigs } = require('./utils/zplGenerator');
        const configs = getAvailableConfigs();

        if (configs.length === 0) {
            return;
        }

        const templateMenuItems: Electron.MenuItemConstructorOptions[] = [];

        // Add up to 9 templates
        for (let i = 0; i < Math.min(configs.length, 9); i++) {
            const config = configs[i];
            templateMenuItems.push({
                label: config.name,
                accelerator: i < 9 ? `CmdOrCtrl+${i + 1}` : undefined,
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('select-template', config.name);
                    }
                },
            });
        }

        // Add "More..." if there are more than 9 templates
        if (configs.length > 9) {
            templateMenuItems.push({ type: 'separator' });
            templateMenuItems.push({
                label: 'More Templates...',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('open-template-selector');
                    }
                },
            });
        }

        const menu = Menu.getApplicationMenu();
        if (menu) {
            const templatesMenu = menu.items.find(item => item.label === 'Templates');
            if (templatesMenu && templatesMenu.submenu) {
                templatesMenu.submenu.clear();
                templateMenuItems.forEach(item => {
                    templatesMenu.submenu!.append(new MenuItem(item));
                });
            }
        }
    } catch (err) {
        console.error('Failed to update templates menu:', err);
    }
};

Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
        label: 'Templates',
        submenu: [
            {
                label: 'Loading templates...',
                enabled: false,
            },
        ],
    },
    {
        label: 'Printing',
        submenu: [
            {
                label: 'Print Consecutive Labels...',
                accelerator: 'CmdOrCtrl+Shift+P',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('open-consecutive-print-dialog');
                    }
                },
            },
            { type: 'separator' },
            {
                label: 'Printer Settings...',
                accelerator: 'CmdOrCtrl+Shift+I',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('open-printer-dialog');
                    }
                },
            },
        ],
    },
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
]));

app.on('ready', () => {
    createWindow();
    updateTemplatesMenu();
});

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
        dumpZplToFile(zpl, labelData, 'generate');
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
            dumpZplToFile(zpl, labelData, 'print');

            // In demo mode, just return the ZPL for display
            if (isInDemoMode()) {
                return {
                    success: true,
                    message: 'Demo mode: ZPL generated successfully',
                    zpl: zpl,
                    isDemo: true,
                };
            }

            // In production mode, send to printer
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
