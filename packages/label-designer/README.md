# DHL Label Designer

A visual label design tool for creating and configuring asset tag labels. Designed to work alongside the Asset Tags application.

## Features

- 🎨 Visual label editor with drag-and-drop interface
- 📝 Add text, barcodes, QR codes, and images to labels
- 💾 Save and export label designs as JSON configurations
- 📐 Configure label dimensions and element positioning
- 🔄 Import designs into the Asset Tags application

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+

### Installation

```bash
npm install
```

### Development

```bash
# Build and run in development mode
npm run dev

# Build only
npm run build

# Watch mode (rebuild on file changes)
npm run watch
```

### Building for Distribution

```bash
# Create installers
npm run dist
```

## Project Structure

```
Label-Designer/
├── src/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # IPC bridge
│   ├── renderer/
│   │   ├── App.tsx          # Main React component
│   │   ├── App.css          # Styles
│   │   └── index.tsx        # React entry point
│   └── ...
├── public/
│   └── index.html           # HTML template
├── dist/                    # Build output
├── build.js                 # Build script
├── package.json
└── tsconfig.json
```

## Usage

### Creating a New Label Design

1. Click "Create New Design"
2. Configure label dimensions (width/height in dots at 203 DPI)
3. Add elements (text, barcode, QR code, or image)
4. Position and configure each element
5. Save the design

### Element Types

- **Text**: Static or variable text fields
- **Barcode**: Code 128 barcodes
- **QR Code**: QR codes for quick scanning
- **Image**: Static images/logos

### Exporting Designs

Designs can be exported as JSON files and imported into:
- Asset Tags application for printing
- Other label design tools
- Custom label generation scripts

## Configuration

Label designs are saved to `~/.config/Label-Designer/label-designs.json` (or equivalent on your OS).

Exports are saved to `~/.config/Label-Designer/exports/`.

## Integration with Asset Tags

Export a label design from Label Designer and use it in the Asset Tags application:

1. Export the design as JSON
2. Place the JSON file in the Asset Tags configuration directory
3. Reference it in the `label-config.json` file

## License

ISC

## Author

Peter R. Vermilye
