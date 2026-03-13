import { execFileSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(resolve(__dirname, 'speed-reader-app'));

const viteBin = resolve(__dirname, 'speed-reader-app/node_modules/vite/bin/vite.js');
execFileSync('node', [viteBin, '--host'], { stdio: 'inherit' });
