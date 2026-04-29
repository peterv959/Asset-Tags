#!/usr/bin/env node

import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const isWatch = process.argv.includes('--watch');

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(scriptDir, 'packages', 'Asset-Tags');
const srcDir = path.join(appDir, 'src');
const distDir = path.join(appDir, 'dist');
const rootPublicIndex = path.join(scriptDir, 'public', 'index.html');
const appPublicIndex = path.join(appDir, 'public', 'index.html');
const envFile = path.join(scriptDir, '.env.local');

// Load .env.local if it exists
let appMode = 'production';
if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf-8');
    const match = envContent.match(/VITE_APP_MODE\s*=\s*(.+)/);
    if (match) {
        appMode = match[1].trim();
    }
}

const mainConfig = {
    entryPoints: [path.join(srcDir, 'main.ts')],
    outfile: path.join(distDir, 'main.cjs'),
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
    entryPoints: [path.join(srcDir, 'preload.ts')],
    outfile: path.join(distDir, 'preload.cjs'),
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
    entryPoints: [path.join(srcDir, 'renderer', 'index.tsx')],
    outfile: path.join(distDir, 'renderer', 'bundle.js'),
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
        fs.mkdirSync(distDir, { recursive: true });
        fs.mkdirSync(path.join(distDir, 'renderer'), { recursive: true });

        // Build main process and preload
        await esbuild.build(mainConfig);
        console.log('✓ Main process built');

        await esbuild.build(preloadConfig);
        console.log('✓ Preload built');

        // Build renderer
        await esbuild.build(rendererConfig);
        console.log('✓ Renderer built');

        // Copy static files
        const distPublicDir = path.join(distDir, 'public');
        if (!fs.existsSync(distPublicDir)) {
            fs.mkdirSync(distPublicDir, { recursive: true });
        }

        const indexHtmlPath = fs.existsSync(appPublicIndex) ? appPublicIndex : rootPublicIndex;
        const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
        const updatedHtml = indexHtml
            .replace(
                'href="./renderer/bundle.css"',
                'href="../renderer/bundle.css"'
            )
            .replace(
                'src="./renderer/bundle.js"',
                'src="../renderer/bundle.js"'
            );
        fs.writeFileSync(path.join(distPublicDir, 'index.html'), updatedHtml);
        console.log('✓ HTML copied and updated');

        // Copy printers.json config
        const printersConfigPath = path.join(srcDir, 'printers.json');
        if (fs.existsSync(printersConfigPath)) {
            fs.copyFileSync(printersConfigPath, path.join(distDir, 'printers.json'));
            console.log('✓ Printers config copied');
        }

        // Copy label-config.json
        const labelConfigPath = path.join(srcDir, 'label-config.json');
        if (fs.existsSync(labelConfigPath)) {
            fs.copyFileSync(labelConfigPath, path.join(distDir, 'label-config.json'));
            console.log('✓ Label config copied');
        }

        console.log('\n✓ Build complete!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

function copyStaticFiles() {
    const distPublicDir = path.join(distDir, 'public');
    fs.mkdirSync(distPublicDir, { recursive: true });

    const indexHtmlPath = fs.existsSync(appPublicIndex) ? appPublicIndex : rootPublicIndex;
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
    const updatedHtml = indexHtml
        .replace('href="./renderer/bundle.css"', 'href="../renderer/bundle.css"')
        .replace('src="./renderer/bundle.js"', 'src="../renderer/bundle.js"');
    fs.writeFileSync(path.join(distPublicDir, 'index.html'), updatedHtml);

    const printersConfigPath = path.join(srcDir, 'printers.json');
    if (fs.existsSync(printersConfigPath)) {
        fs.copyFileSync(printersConfigPath, path.join(distDir, 'printers.json'));
    }
    const labelConfigPath = path.join(srcDir, 'label-config.json');
    if (fs.existsSync(labelConfigPath)) {
        fs.copyFileSync(labelConfigPath, path.join(distDir, 'label-config.json'));
    }
}

async function watch() {
    try {
        console.log('Watching for changes...');

        // Ensure dist directories exist and do initial static file copy
        fs.mkdirSync(distDir, { recursive: true });
        fs.mkdirSync(path.join(distDir, 'renderer'), { recursive: true });
        copyStaticFiles();
        console.log('✓ Static files copied');

        // Re-copy index.html after each renderer rebuild
        const htmlCopyPlugin = {
            name: 'copy-html',
            setup(build) {
                build.onEnd(() => {
                    try {
                        copyStaticFiles();
                        console.log('✓ index.html updated');
                    } catch (e) {
                        console.error('Failed to update index.html:', e.message);
                    }
                });
            },
        };

        const mainCtx = await esbuild.context(mainConfig);
        const preloadCtx = await esbuild.context(preloadConfig);
        const rendererCtx = await esbuild.context({
            ...rendererConfig,
            plugins: [...(rendererConfig.plugins ?? []), htmlCopyPlugin],
        });

        // Also watch the source index.html for changes
        const htmlSource = fs.existsSync(appPublicIndex) ? appPublicIndex : rootPublicIndex;
        fs.watch(htmlSource, () => {
            console.log('index.html changed, re-copying...');
            try { copyStaticFiles(); } catch (e) { console.error(e.message); }
        });

        await Promise.all([mainCtx.watch(), preloadCtx.watch(), rendererCtx.watch()]);
        console.log('✓ Watching for changes (including index.html)');
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
