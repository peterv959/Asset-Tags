import net from 'net';

export interface PrinterConfig {
    host: string;
    port?: number;
    timeout?: number;
}

const DEFAULT_ZEBRA_PORT = 9100;
const DEFAULT_TIMEOUT = 5000;

/**
 * Send ZPL command to a Zebra printer on the network
 * Uses raw socket connection (port 9100) - no Windows drivers needed
 */
export async function sendToZebraPrinter(
    zplCommand: string,
    config: PrinterConfig
): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
        const host = config.host;
        const port = config.port || DEFAULT_ZEBRA_PORT;
        const timeout = config.timeout || DEFAULT_TIMEOUT;

        const socket = net.createConnection({ port, host });
        let timeoutHandle: NodeJS.Timeout;

        socket.on('connect', () => {
            clearTimeout(timeoutHandle);
            // Send ZPL command
            socket.write(zplCommand, 'utf-8', (error) => {
                if (error) {
                    socket.destroy();
                    resolve({
                        success: false,
                        message: `Failed to send to printer: ${error.message}`,
                    });
                } else {
                    // Wait a bit for printer to process, then close
                    setTimeout(() => {
                        socket.end();
                        resolve({
                            success: true,
                            message: `Label sent to ${host}:${port} successfully`,
                        });
                    }, 500);
                }
            });
        });

        socket.on('error', (error) => {
            clearTimeout(timeoutHandle);
            socket.destroy();
            resolve({
                success: false,
                message: `Connection error: ${error.message}. Check printer IP and ensure port ${port} is open.`,
            });
        });

        // Set timeout
        timeoutHandle = setTimeout(() => {
            socket.destroy();
            resolve({
                success: false,
                message: `Connection timeout after ${timeout}ms. Printer may be offline.`,
            });
        }, timeout);

        socket.setTimeout(timeout);
    });
}

/**
 * Test connectivity to Zebra printer
 */
export async function testPrinterConnection(
    config: PrinterConfig
): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
        const host = config.host;
        const port = config.port || DEFAULT_ZEBRA_PORT;
        const timeout = config.timeout || DEFAULT_TIMEOUT;

        const socket = net.createConnection({ port, host });
        let timeoutHandle: NodeJS.Timeout;

        socket.on('connect', () => {
            clearTimeout(timeoutHandle);
            socket.end();
            resolve({
                success: true,
                message: `Successfully connected to printer at ${host}:${port}`,
            });
        });

        socket.on('error', (error) => {
            clearTimeout(timeoutHandle);
            socket.destroy();
            resolve({
                success: false,
                message: `Failed to connect: ${error.message}`,
            });
        });

        timeoutHandle = setTimeout(() => {
            socket.destroy();
            resolve({
                success: false,
                message: `Connection timeout after ${timeout}ms`,
            });
        }, timeout);

        socket.setTimeout(timeout);
    });
}
