import {build} from 'esbuild';
import {execSync} from 'node:child_process';
import 'dotenv/config';

build({
    entryPoints: ['src/index.ts'],
    outdir: 'dist',
    format: 'cjs',
    platform: 'node',
    target: 'node22.12',
    bundle: true,
    minifySyntax: true,
    minifyWhitespace: true,
    minifyIdentifiers: true,
    keepNames: true,
    sourcemap: true,
    sourcesContent: false,
    logLevel: 'info',
    define: {
        'process.env.TOKEN': JSON.stringify(process.env.TOKEN),
        'process.env.APPLICATION_ID': JSON.stringify(process.env.APPLICATION_ID),
        // 'process.env.MINECRAFT_INSTANCE': JSON.stringify(process.env.MINECRAFT_INSTANCE),
        // 'process.env.FACTORIO_INSTANCE': JSON.stringify(process.env.FACTORIO_INSTANCE),
        // 'process.env.GRUG_INSTANCE': JSON.stringify(process.env.GRUG_INSTANCE),
    }
}).catch(() => process.exit(1));

execSync('cd dist && tar -czvf ../berry.tar.gz *', {cwd: process.cwd()});