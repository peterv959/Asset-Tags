# Quick Start Guide

## 1. Install Dependencies (First Time Only)
```bash
npm install
```

## 2. Build and Run
```bash
npm run dev
```

This will:
- Compile TypeScript files
- Bundle React components
- Launch the Electron app with DevTools open

## 3. Create a Label

1. In the app form, enter:
   - **Asset Tag**: e.g., `AST-001234`
   - **Serial Number** (optional): e.g., `5678`

2. Click **Generate Preview** to see the label

3. Click **Send to Printer**

4. Enter your printer's network address:
   - **IP Address**: e.g., `192.168.1.100`
   - **Port**: Usually `9100` (leave as default for Zebra)

5. Click **Test Connection** to verify printer is reachable

6. Click **Print Label** to send the label

## Finding Your Printer's IP

**On the printer:**
1. Press Menu/Settings
2. Find Network or TCP/IP Settings
3. Look for IP Address (example: 192.168.1.100)

**From your computer:**
- Check your router's connected devices list
- Use your printer's web interface: `http://192.168.1.100`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection timeout" | Check if printer is on and IP address is correct |
| Printer not found | Try pinging: `ping 192.168.1.100` |
| Port 9100 blocked | Printer may use different port (check printer settings) |
| Nothing prints | Ensure printer isn't in sleep mode; test with printer's panel |

## Common Tasks

### Development Mode (with auto-reload)
```bash
npm run watch
```

### Production Build
```bash
npm run build
npm start
```

### Check Build Output
Output files will be in the `dist/` directory:
- `dist/main.js` - Electron main process
- `dist/preload.js` - Preload script
- `dist/renderer/bundle.js` - React app bundle
- `dist/public/index.html` - HTML file

## What Gets Printed

The label includes:
- ✓ "Property of DHL" header
- ✓ Code 128C barcode of asset tag
- ✓ Human-readable asset tag number
- ✓ Serial number (rotated 90°, if provided)

**Label Size**: 1.5" wide × 0.5" tall

## Next Steps

See [README.md](./README.md) for:
- Detailed feature documentation
- Project structure
- Zebra printer compatibility
- Development guidelines
