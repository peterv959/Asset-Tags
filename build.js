#!/usr/bin/env node

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const isWatch = process.argv.includes('--watch');

const mainConfig = {
    entryPoints: ['src/main.ts'],
    outfile: 'dist/main.js',
    bundle: true,
    platform: 'node',
    target: 'es2020',
    format: 'cjs',
    sourcemap: true,
    minify: false,
    external: ['electron', 'net'],
};

const preloadConfig = {
    entryPoints: ['src/preload.ts'],
    outfile: 'dist/preload.js',
    bundle: true,
    platform: 'node',
    target: 'es2020',
    format: 'cjs',
    sourcemap: true,
    minify: false,
    external: ['electron'],
};

const rendererConfig = {
    entryPoints: ['src/renderer/index.tsx'],
    outfile: 'dist/renderer/bundle.js',
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
    },
};

async function build() {
    try {
        console.log('Building main process and renderer...');

        // Ensure dist directories exist
        fs.mkdirSync('dist', { recursive: true });
        fs.mkdirSync('dist/renderer', { recursive: true });

        // Build main process and preload
        await esbuild.build(mainConfig);
        console.log('✓ Main process built');

        await esbuild.build(preloadConfig);
        console.log('✓ Preload built');

        // Build renderer
        await esbuild.build(rendererConfig);
        console.log('✓ Renderer built');

        // Copy static files
        if (!fs.existsSync('dist/public')) {
            fs.mkdirSync('dist/public', { recursive: true });
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
        fs.writeFileSync('dist/public/index.html', updatedHtml);
        console.log('✓ HTML copied and updated');

        // Copy printers.json config
        if (fs.existsSync('printers.json')) {
            fs.copyFileSync('printers.json', 'dist/printers.json');
            console.log('✓ Printers config copied');
        }

        // Copy label-config.json
        if (fs.existsSync('src/label-config.json')) {
            fs.copyFileSync('src/label-config.json', 'dist/label-config.json');
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
