# Asset Tags - UI Components Package

React UI components for the Asset Tags application.

## Components

- `App` - Main application component
- `ConfigSelector` - Label configuration selector
- `ConsecutivePrintDialog` - Consecutive printing dialog
- `LabelForm` - Label data input form
- `LabelPreview` - Label preview display
- `Preferences` - Preferences/settings panel
- `PrinterDialog` - Printer configuration dialog
- `PrinterSelectionDialog` - Printer selection dialog
- `TemplateSelector` - Template/configuration selector
- `ZPLPreviewModal` - ZPL preview modal

## Usage

```typescript
import { App, LabelForm } from '@asset-tags/ui';

export function MyApp() {
  return <App />;
}
```

## Styles

Each component has an associated `.css` file. CSS is imported alongside the component file.
