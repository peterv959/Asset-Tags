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

let mainWindow: BrowserWindow | null = null;

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

// Create a minimal menu with Edit options for keyboard shortcuts
const template: Electron.MenuItemConstructorOptions[] = [
    {
        label: 'Edit',
        submenu: [
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
        // Try to load from the dist directory first (packaged app)
        let configPath = path.join(__dirname, 'printers.json');

        // If not found, try the app root (development)
        if (!fs.existsSync(configPath)) {
            configPath = path.join(app.getAppPath(), 'printers.json');
        }

        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8');
            const config = JSON.parse(data);
            return {
                printers: config.printers || [],
                selectedPrinterName: config.selectedPrinterName || null,
            };
        }
        return { printers: [], selectedPrinterName: null };
    } catch (error) {
        console.error('Failed to load printers config:', error);
        return { printers: [], selectedPrinterName: null };
    }
});

// IPC: Save selected printer to config file
ipcMain.handle('save-selected-printer', async (_event, printerName: string) => {
    try {
        let configPath = path.join(__dirname, 'printers.json');

        if (!fs.existsSync(configPath)) {
            configPath = path.join(app.getAppPath(), 'printers.json');
        }

        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8');
            const config = JSON.parse(data);
            config.selectedPrinterName = printerName;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf-8');
            return { success: true };
        }
        return { success: false, message: 'Config file not found' };
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
