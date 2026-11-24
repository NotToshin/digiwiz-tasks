import { spawn } from 'node:child_process';
const child=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','63477','--strictPort'],{stdio:'inherit',env:{...process.env,VITE_DATA_SOURCE:'sample'}});
child.on('exit',code=>process.exit(code || 0));
