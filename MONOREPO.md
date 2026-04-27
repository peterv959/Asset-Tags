# Root monorepo workspace

## Package Management
- Managed by npm workspaces
- Each package has its own package.json

## Packages

### @asset-tags/app
Electron main application. Handles:
- Main process (Electron)
- Window management
- IPC communication
- Printer communication
- Label generation

### @asset-tags/shared
Shared utilities (utilities that depend on Node.js or are used across packages):
- ZPL label generation
- Printer communication
- Demo mode utilities

### @asset-tags/ui
React UI components library:
- Label form
- Printer dialogs
- Template selectors
- ZPL preview
- Other UI components

## Building

```bash
npm run build          # Build all packages
npm --workspace=packages/app run dev    # Development with file watching
npm --workspace=packages/app run start  # Run Electron app
```

## Development

The monorepo structure allows:
- Shared code across packages (see import paths in tsconfig.json)
- Independent testing and building per package
- Clear separation of concerns

## Path Mappings

See root tsconfig.json for workspace path mappings:
- `@asset-tags/shared` → `packages/shared/src`
- `@asset-tags/ui` → `packages/ui/src`
- `@asset-tags/app` → `packages/app/src`
