const esbuild = require('esbuild');

console.log('Starting build process...');

const watchMode = process.argv.includes('--watch');

async function build() {
    try {
        const ctx = await esbuild.context({
            entryPoints: ['src/main.ts'],
            bundle: true,
            outfile: 'main.js',
            platform: 'node',
            target: 'es6',
            external: ['obsidian'],
            sourcemap: true,
        });

        if (watchMode) {
            console.log('Watching for changes...');
            await ctx.watch();
        } else {
            console.log('Build completed.');
            await ctx.rebuild();
            await ctx.dispose();
        }
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();