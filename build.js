#!/usr/bin/env node

import esbuild from 'esbuild';
import fs from 'fs';

const isWatch = process.argv.includes('--watch');

// Load .env.local if it exists
let appMode = 'production';
if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    const match = envContent.match(/VITE_APP_MODE\s*=\s*(.+)/);
    if (match) {
        appMode = match[1].trim();
    }
}

const mainConfig = {
    entryPoints: ['packages/Asset-Tags/src/main.ts'],
    outfile: 'packages/Asset-Tags/dist/main.cjs',
    bundle: true,
    platform: 'node',
    target: 'es2020',
    format: 'cjs',
    sourcemap: true,
    minify: false,
    external: ['electron', 'net'],
    define: {
        'process.env.VITE_APP_MODE': `"${appMode}"`,
    },
};

const preloadConfig = {
    entryPoints: ['packages/Asset-Tags/src/preload.ts'],
    outfile: 'packages/Asset-Tags/dist/preload.cjs',
    bundle: true,
    platform: 'node',
    target: 'es2020',
    format: 'cjs',
    sourcemap: true,
    minify: false,
    external: ['electron'],
    define: {
        'process.env.VITE_APP_MODE': `"${appMode}"`,
    },
};

const rendererConfig = {
    entryPoints: ['packages/Asset-Tags/src/renderer/index.tsx'],
    outfile: 'packages/Asset-Tags/dist/renderer/bundle.js',
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
    minify: false,
    external: [],
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    define: {
        'process.env.NODE_ENV': '"development"',
        'process.env.VITE_APP_MODE': `"${appMode}"`,
    },
};

async function build() {
    try {
        console.log('Building main process and renderer...');

        // Ensure dist directories exist
        fs.mkdirSync('packages/Asset-Tags/dist', { recursive: true });
        fs.mkdirSync('packages/Asset-Tags/dist/renderer', { recursive: true });

        // Build main process and preload
        await esbuild.build(mainConfig);
        console.log('✓ Main process built');

        await esbuild.build(preloadConfig);
        console.log('✓ Preload built');

        // Build renderer
        await esbuild.build(rendererConfig);
        console.log('✓ Renderer built');

        // Copy static files
        if (!fs.existsSync('packages/Asset-Tags/dist/public')) {
            fs.mkdirSync('packages/Asset-Tags/dist/public', { recursive: true });
        }

        const indexHtml = fs.readFileSync('public/index.html', 'utf-8');
        const updatedHtml = indexHtml
            .replace(
                'href="./renderer/bundle.css"',
                'href="../renderer/bundle.css"'
            )
            .replace(
                'src="./renderer/bundle.js"',
                'src="../renderer/bundle.js"'
            );
        fs.writeFileSync('packages/Asset-Tags/dist/public/index.html', updatedHtml);
        console.log('✓ HTML copied and updated');

        // Copy printers.json config
        if (fs.existsSync('packages/Asset-Tags/src/printers.json')) {
            fs.copyFileSync('packages/Asset-Tags/src/printers.json', 'packages/Asset-Tags/dist/printers.json');
            console.log('✓ Printers config copied');
        }

        // Copy label-config.json
        if (fs.existsSync('packages/Asset-Tags/src/label-config.json')) {
            fs.copyFileSync('packages/Asset-Tags/src/label-config.json', 'packages/Asset-Tags/dist/label-config.json');
            console.log('✓ Label config copied');
        }

        console.log('\n✓ Build complete!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

async function watch() {
    try {
        console.log('Watching for changes...');

        const mainCtx = await esbuild.context(mainConfig);
        const preloadCtx = await esbuild.context(preloadConfig);
        const rendererCtx = await esbuild.context(rendererConfig);

        await Promise.all([mainCtx.watch(), preloadCtx.watch(), rendererCtx.watch()]);
        console.log('✓ Watching for changes');
    } catch (error) {
        console.error('Watch failed:', error);
        process.exit(1);
    }
}

if (isWatch) {
    watch();
} else {
    build();
}
