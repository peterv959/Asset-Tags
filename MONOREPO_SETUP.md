# Asset Tags Monorepo - Setup Complete! ✅

Your workspace has been successfully converted into a monorepo structure using npm workspaces.

## New Workspace Structure

```
Asset Tags/
├── packages/
│   ├── app/                 # Electron main application
│   │   ├── src/
│   │   │   ├── main.ts      # Electron main process
│   │   │   ├── preload.ts   # IPC bridge
│   │   │   ├── renderer/    # React UI components
│   │   │   ├── utils/       # App utilities
│   │   │   ├── label-config.json
│   │   │   └── printers.json
│   │   ├── dist/            # Build output
│   │   └── package.json
│   │
│   ├── shared/              # Shared utilities (future expansion)
│   │   ├── src/
│   │   │   └── index.ts     # Public API
│   │   └── package.json
│   │
│   └── ui/                  # UI components library (future expansion)
│       ├── src/
│       │   └── index.ts     # Public API
│       └── package.json
│
├── package.json             # Root workspace config
├── tsconfig.json            # Shared TypeScript config
├── build.js                 # Build script (updated for monorepo)
└── MONOREPO.md              # Monorepo documentation
```

## Key Features

### ✅ Npm Workspaces
- Centralized dependency management
- Single `node_modules` at root
- Efficient dependency resolution
- No separate installs needed per package

### ✅ Path Mappings
TypeScript is configured with path aliases:
```typescript
import { generateZPL } from '@asset-tags/shared';
import { App } from '@asset-tags/ui';
```

### ✅ Individual Package Configuration
Each package has:
- Own `package.json` with specific dependencies
- Own `tsconfig.json` extending root config
- Own build and test scripts
- Clear separation of concerns

## Quick Start

### Install Dependencies
```bash
npm install  # Installs for all workspaces
```

### Development

```bash
# Build and run the app
npm run dev

# Build only
npm run build

# Build with watch mode
npm run watch

# Run just the Electron app
npm run start
```

### Scripts (Root Level)

All scripts are configured in the root `package.json`:
- `npm run build` - Builds all packages
- `npm run dev` - Dev build + run Electron app
- `npm run watch` - Watch mode for all packages
- `npm run start` - Run Electron app
- `npm run clean` - Clean all build artifacts

### Running Scripts in Specific Packages

```bash
# Run a script in a specific workspace
npm --workspace=packages/app run build
npm --workspace=packages/shared run build
npm --workspace=packages/ui run build
```

## File Migration Summary

**Moved from `src/` to `packages/app/src/`:**
- ✅ `main.ts` - Electron main process
- ✅ `preload.ts` - IPC bridge
- ✅ `electron.d.ts` - Type definitions
- ✅ `utils/` - All utility files
- ✅ `renderer/` - React UI with components
- ✅ `label-config.json` - Label configuration
- ✅ `printers.json` - Printer configuration

**Created:**
- ✅ `packages/shared/` - For future shared utilities
- ✅ `packages/ui/` - For future UI component library
- ✅ Index files for exports
- ✅ Package-specific README files
- ✅ Updated `build.js` for monorepo paths

## Next Steps (Optional Future Refactoring)

### 1. Extract Shared Utilities
Move truly shared code to `packages/shared/`:
- ZPL generation (currently needs Electron refactoring)
- Printer communication utilities
- Demo mode utilities

### 2. Build UI Component Library
Convert `packages/ui/` into a reusable component library:
- Export components with proper storybook docs
- Create a component library with build output
- Enable other apps to use these components

### 3. Add Testing
```bash
npm install --save-dev jest @testing-library/react --workspaces
```

### 4. Set Up Linting & Formatting
```bash
npm install --save-dev eslint prettier --workspaces
```

## Monorepo Benefits

1. **Single Source of Truth** - Shared dependencies version controlled centrally
2. **Reduced Disk Space** - Dependencies stored once, used by all packages
3. **Easier Refactoring** - Move code between packages without changing imports
4. **Type Safety** - TypeScript paths make cross-package imports explicit
5. **Scalability** - Easy to add new packages (utils, CLI, web version, etc.)

## Troubleshooting

### Build fails with module not found
Check that imports use the path aliases defined in `tsconfig.json`.

### Dependencies not installing
Run `npm install` from the root directory (not individual packages).

### TypeScript errors in cross-package imports
Ensure the imported package has proper `exports` in its `package.json`.

## More Information

See [MONOREPO.md](./MONOREPO.md) for additional technical details.
