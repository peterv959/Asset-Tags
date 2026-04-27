# Demo Mode Configuration Guide

## Overview

The Asset Tags application now supports a **Demo Mode** that displays ZPL (Zebra Programming Language) output in a popup instead of sending it to a physical printer. This is perfect for development and testing at home when you don't have a Zebra printer available.

## How to Enable Demo Mode

### 1. Set Up Your Local Environment File

Create or edit the `.env.local` file in the project root (this file is git-ignored):

```bash
# .env.local
VITE_APP_MODE=demo
```

### 2. Rebuild the Application

After changing `.env.local`, rebuild the application:

```bash
npm run build
```

### 3. Run the Application

```bash
npm run dev
# or just
npm start
```

## Using Demo Mode

### Visual Indicator
- When demo mode is enabled, an orange banner appears at the bottom of the window: **"🔧 DEMO MODE - ZPL will be displayed instead of sent to printer"**

### Printing a Label
1. Fill in the Asset Tag and Serial Number as normal
2. Click the **Print** button
3. Instead of sending ZPL to the printer, a popup dialog appears showing the generated ZPL code
4. The popup has two buttons:
   - **Copy ZPL** - Copies the ZPL code to your clipboard for testing/validation
   - **Close** - Closes the popup and returns focus to the form

## Switching Back to Production Mode

To switch back to sending labels to physical printers:

### 1. Update `.env.local`

```bash
# .env.local
VITE_APP_MODE=production
```

### 2. Rebuild and Run

```bash
npm run build
npm start
```

## Configuration Options

| Setting | Value | Behavior |
|---------|-------|----------|
| `VITE_APP_MODE` | `demo` | ZPL displayed in popup, no printer connection needed |
| `VITE_APP_MODE` | `production` | ZPL sent to configured Zebra printer (default) |

## File Locations

- **Configuration File**: `.env.local` (automatically git-ignored)
- **Demo Mode Utilities**: `src/utils/demoMode.ts`
- **ZPL Preview Component**: `src/renderer/components/ZPLPreviewModal.tsx`
- **Build Configuration**: `build.js` (reads `.env.local` and passes mode to renderer)

## Why Use Demo Mode?

✅ **Development at Home** - Test the application without a physical printer
✅ **No Network Dependencies** - No need to connect to printer IP address
✅ **Debugging** - Review the exact ZPL being generated
✅ **Testing** - Verify label configurations before printing
✅ **Clipboard Integration** - Easily copy ZPL for external testing tools

## Technical Details

The demo mode configuration works as follows:

1. **`.env.local` file** - You create this file to specify which mode you want
2. **`build.js`** - Reads your `.env.local` and passes `VITE_APP_MODE` to the renderer during build
3. **Main Process** - The `print-label` IPC handler checks demo mode and either:
   - Returns the ZPL for display (demo mode)
   - Sends to printer via socket connection (production mode)
4. **Renderer UI** - Shows the ZPL preview modal when in demo mode

## Troubleshooting

**Q: I changed `.env.local` but the mode didn't change**
A: You need to rebuild the project after changing `.env.local`:
```bash
npm run build
npm start
```

**Q: The banner doesn't show up**
A: Make sure you rebuilt after changing `.env.local`. Also check that your `.env.local` file is in the project root (not in `src/`).

**Q: I want to test both modes without rebuilding**
A: Currently, you need to rebuild to switch modes. You could modify `build.js` to read from an environment variable instead: `process.env.VITE_APP_MODE || 'production'`
