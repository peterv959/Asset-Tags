# Asset Tag Label Generator

An Electron + TypeScript application for generating and printing property labels for DHL assets directly to Zebra printers on your network.

## Features

- **Asset Tag Input**: Enter asset tag number and optional 4-digit serial number
- **Live Preview**: See label layout before printing (1.5" × 0.5")
- **Code 128C Barcode**: Automatic barcode generation from asset tag
- **Serial Number Support**: Optional serial number displayed rotated 90° on the left side
- **DHL Branding**: "Property of DHL" heading on each label
- **Network Printing**: Send labels directly to Zebra printers via network (no Windows drivers needed)
- **Printer Testing**: Test connection to printer before sending labels

## System Requirements

- Node.js 18+ and npm
- Electron 41.2+
- Windows, macOS, or Linux
- Zebra printer connected to your network (ZPL-compatible)

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Application**
   ```bash
   npm run build
   ```

3. **Start Development Mode** (with hot reload)
   ```bash
   npm run dev
   ```

## Usage

### Basic Workflow

1. **Enter Asset Information**
   - **Asset Tag**: Required. Enter the asset identification number (will be encoded in barcode)
   - **Serial Number**: Optional. Enter up to 4 digits (will be rotated 90° on left side of label)

2. **Generate Preview**
   - Click "Generate Preview" to see how the label will look
   - Preview shows 1:1 scale of the 1.5" × 0.5" label

3. **Send to Printer**
   - Click "Send to Printer" when preview looks correct
   - Enter printer IP address or hostname (e.g., `192.168.1.100` or `printer.local`)
   - Port is typically `9100` for Zebra printers (default)
   - Click "Test Connection" to verify printer is reachable
   - Click "Print Label" to send the label

## Finding Your Zebra Printer's IP Address

### From Printer Menu
1. Press the Menu button on the printer
2. Navigate to: **Network** → **TCP/IP Settings** (or similar)
3. Look for "IP Address" or "IPv4 Address"

### From Your Network
1. **Windows**: Use Advanced IP Scanner or look in your router's connected devices
2. **macOS/Linux**: Use `arp-scan` or check router admin panel
3. **Test**: Ping the printer: `ping 192.168.1.100` (replace with your printer's IP)

## Printing Details

### Label Format
- **Size**: 1.5" wide × 0.5" tall (304 × 102 dots at 203 DPI)
- **Content Layout**:
  - Top: "Property of DHL" heading
  - Center: Code 128C barcode of asset tag
  - Bottom: Human-readable asset tag number
  - Left side (if serial number provided): Rotated 90° serial number

### Barcode
- **Format**: Code 128C (supports digits)
- **Data**: Asset tag number
- **Human Readable**: Automatically printed below barcode

### Zebra Printer Connection
- Uses **ZPL (Zebra Programming Language)** commands
- **No Windows drivers needed** - connects directly via TCP socket
- **Default Port**: 9100 (raw TCP print port)
- Network communication is secure within local network

## Zebra Printer Compatibility

This application works with:
- Zebra ZD420 series
- Zebra ZD620 series
- Zebra ZD888 series
- Most modern Zebra desktop/mobile printers
- Other ZPL-compatible printers

Ensure your printer supports ZPL and has network connectivity (Ethernet or WiFi).

## Build Scripts

- `npm run build` - Build main process and renderer bundle
- `npm run dev` - Build and start the Electron app with DevTools
- `npm run start` - Run the built app (must build first)
- `npm run watch` - Watch source files and rebuild on changes
- `npm test` - Run tests (placeholder)

## Project Structure

```
.
├── src/
│   ├── main.ts                 # Electron main process
│   ├── preload.ts              # Preload script for context isolation
│   ├── electron.d.ts           # TypeScript type definitions
│   ├── utils/
│   │   ├── zplGenerator.ts     # ZPL command generation
│   │   └── printerCommunication.ts  # Printer network communication
│   └── renderer/
│       ├── index.tsx           # React entry point
│       ├── index.css           # Global styles
│       └── components/
│           ├── App.tsx         # Main app component
│           ├── LabelForm.tsx   # Input form
│           ├── LabelPreview.tsx # Canvas preview
│           └── PrinterDialog.tsx # Printer settings dialog
├── public/
│   └── index.html              # HTML template
├── dist/                       # Build output (auto-generated)
├── build.js                    # Build script (esbuild)
├── package.json
├── tsconfig.json
└── .gitignore
```

## Troubleshooting

### "Connection timeout" Error
- **Cause**: Printer is offline or unreachable
- **Solution**:
  1. Verify printer is powered on and connected to network
  2. Check printer's IP address
  3. Try pinging the printer: `ping 192.168.1.100`
  4. Ensure firewall isn't blocking port 9100

### "Check printer IP and ensure port 9100 is open"
- Printer may use a different port (check printer settings)
- Network may be blocking the port
- Try connecting via different network if available

### Build Errors
- Ensure Node.js 18+ is installed: `node --version`
- Delete `node_modules` and reinstall: `rm -r node_modules && npm install`
- Clear build cache: `rm -r dist && npm run build`

### React Component Not Rendering
- Check browser DevTools (F12) in Electron for JavaScript errors
- Verify `dist/renderer/bundle.js` exists after build
- Ensure `public/index.html` has `<div id="root"></div>`

## Development

### Modifying Label Layout
Edit `src/utils/zplGenerator.ts` - `generateZPL()` function contains ZPL commands for label positioning and content.

### Adding New Fields
1. Add field to `LabelData` interface in `src/utils/zplGenerator.ts`
2. Add form input to `src/renderer/components/LabelForm.tsx`
3. Update preview in `src/renderer/components/LabelPreview.tsx`
4. Update ZPL generation in `generateZPL()` function

### Testing Printer Commands
Use a TCP client to send ZPL directly to printer:
```bash
# Linux/macOS
echo "^XA^FO100,50^A0N,30,20^FDTest^FS^XZ" | nc 192.168.1.100 9100

# Windows (PowerShell)
$client = New-Object Net.Sockets.TcpClient
$client.Connect('192.168.1.100', 9100)
# ... send command
```

## License

ISC

## Support

For Zebra printer support: https://www.zebra.com/support
For ZPL documentation: https://www.zebra.com/content/dam/zebra_new_ia/en-us/solutions-vertical-category/enterprise/computer-printers/software/zpl-programmer-guide.pdf
