import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    const isDev = process.env.NODE_ENV === 'development';

    // Load from dist/public since that's where the build output goes
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
const createApplicationMenu = () => {
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    },
                },
            ],
        },
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
};

app.on('ready', () => {
    createWindow();
    createApplicationMenu();
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

// IPC: Save label configuration
ipcMain.handle('save-label-config', async (_event, configData: unknown) => {
    try {
        const userDataPath = app.getPath('userData');
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
        }

        const configPath = path.join(userDataPath, 'label-designs.json');
        const configs = fs.existsSync(configPath)
            ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
            : { designs: [] };

        // Add or update design
        if (Array.isArray(configs.designs)) {
            configs.designs.push(configData);
        } else {
            configs.designs = [configData];
        }

        fs.writeFileSync(configPath, JSON.stringify(configs, null, 2), 'utf-8');
        return { success: true, message: 'Design saved' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to save design',
        };
    }
});

// IPC: Load label configurations
ipcMain.handle('load-label-configs', async () => {
    try {
        const userDataPath = app.getPath('userData');
        const configPath = path.join(userDataPath, 'label-designs.json');

        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8');
            return { success: true, configs: JSON.parse(data) };
        }

        return { success: true, configs: { designs: [] } };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to load configs',
        };
    }
});

// IPC: Export label configuration as JSON
ipcMain.handle('export-label-config', async (_event, configData: unknown, fileName: string) => {
    try {
        const userDataPath = app.getPath('userData');
        const designsPath = path.join(userDataPath, 'exports');
        if (!fs.existsSync(designsPath)) {
            fs.mkdirSync(designsPath, { recursive: true });
        }

        const filePath = path.join(designsPath, `${fileName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(configData, null, 2), 'utf-8');

        return { success: true, message: `Exported to ${filePath}`, path: filePath };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Export failed',
        };
    }
});
