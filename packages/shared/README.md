# Asset Tags - Shared Utilities Package

Shared utilities and helpers for the Asset Tags monorepo.

## Exports

### ZPL Generation
- `generateZPL()` - Generate ZPL commands for Zebra printers
- `getAvailableConfigs()` - Get list of available label configurations
- `loadLabelConfigByName()` - Load specific label configuration
- `getLabelConfig()` - Get current label configuration
- `formatAssetTagForBarcode()` - Format asset tag for barcode encoding
- `formatAssetTagForCode128C()` - Format asset tag for Code 128C

### Printer Communication
- `sendToZebraPrinter()` - Send ZPL to network printer
- `testPrinterConnection()` - Test printer connectivity

### Demo Mode
- `isInDemoMode()` - Check if running in demo mode
- `getDemoModeMessage()` - Get demo mode message

## Usage

```typescript
import { generateZPL, sendToZebraPrinter } from '@asset-tags/shared';

const zpl = generateZPL({ assetTag: '12345' });
await sendToZebraPrinter(zpl, { host: '192.168.1.100' });
```
