import {build} from 'esbuild';
import {execSync} from 'node:child_process';
import 'dotenv/config';

build({
    bundle: true,
    define: {
        'process.env.APPLICATION_ID': JSON.stringify(process.env.APPLICATION_ID),
        'process.env.TOKEN'         : JSON.stringify(process.env.TOKEN),
        // 'process.env.MINECRAFT_INSTANCE': JSON.stringify(process.env.MINECRAFT_INSTANCE),
        // 'process.env.FACTORIO_INSTANCE': JSON.stringify(process.env.FACTORIO_INSTANCE),
        // 'process.env.GRUG_INSTANCE': JSON.stringify(process.env.GRUG_INSTANCE),
    },
    entryPoints      : ['src/index.ts'],
    format           : 'cjs',
    keepNames        : true,
    logLevel         : 'info',
    minifyIdentifiers: false,
    minifySyntax     : true,
    minifyWhitespace : true,
    outdir           : 'dist',
    platform         : 'node',
    sourcemap        : true,
    sourcesContent   : false,
    target           : 'node22.12',
}).catch(() => process.exit(1));

// execSync('cd dist && tar -czvf ../berry.tar.gz *', {cwd: process.cwd()});
