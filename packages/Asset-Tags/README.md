# Asset Tags - Electron App

Main Electron application for DHL Asset Tag generation and printing.

## Features

- Generate QR and barcode labels for asset tracking
- Print to Zebra network printers
- Multiple label templates
- Printer configuration management
- Demo mode for testing

## Building

```bash
npm run build    # Build the application
npm run dev      # Build and run in development
npm run start    # Run the packaged app
npm run dist     # Build installer
```

## Project Structure

- `src/main.ts` - Electron main process
- `src/preload.ts` - IPC bridge
- `src/renderer/` - React UI
- `src/utils/` - Utilities
