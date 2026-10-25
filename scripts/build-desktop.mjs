import { build } from 'vite';
import {build as bundle} from 'esbuild';
import {writeFile} from 'node:fs/promises';
// Explicit public settings: never inherit a temporary tunnel or an admin token.
// The owner chose the existing local database for this first desktop acceptance build.
const cloud = process.argv.includes('--cloud');
const integration = process.argv.includes('--integration');
process.env.VITE_BACKEND_WORLDS = 'true';
process.env.VITE_SPACETIMEDB_HOST = integration ? 'ws://127.0.0.1:3011' : cloud ? 'wss://maincloud.spacetimedb.com' : 'ws://127.0.0.1:3011';
process.env.VITE_SPACETIMEDB_DB_NAME = integration ? 'mirrorville-demo-integrated' : cloud ? 'mirrorville-yw9299-worlds' : 'mirrorville-demo-integrated';
process.env.VITE_SPACETIMEAUTH_CLIENT_ID = integration ? '' : 'client_034leYri7AY0CJTanClndG';
process.env.VITE_SPACETIMEAUTH_AUTHORITY = 'https://auth.spacetimedb.com/oidc';
process.env.VITE_SPACETIMEAUTH_REDIRECT_URI = 'http://127.0.0.1:17431/callback';
await writeFile('desktop/app/runtime-config.json',JSON.stringify({endpoint:process.env.VITE_SPACETIMEDB_HOST,database:process.env.VITE_SPACETIMEDB_DB_NAME}));
await bundle({entryPoints:['desktop/app/model-client.ts'],outfile:'desktop/app/model-client.cjs',platform:'node',format:'cjs',bundle:true,external:['bufferutil','utf-8-validate']});
await build({ base: '/', build: { outDir: 'dist-desktop' } });
