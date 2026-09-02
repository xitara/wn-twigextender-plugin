#!/usr/bin/env node

import { spawn } from 'node:child_process';

const url = process.argv[2];

if (!url) {
    console.error('Pass the URL or file you want to open.');
    process.exit(1);
}

let command;
let args;

if (process.env.BROWSER) {
    command = process.env.BROWSER;
    args = [url];
} else if (process.platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', url];
} else if (process.platform === 'darwin') {
    command = 'open';
    args = [url];
} else {
    command = 'xdg-open';
    args = [url];
}

const browser = spawn(command, args, { detached: true, stdio: 'ignore' });

browser.on('error', (error) => {
    console.error(`Could not open the browser: ${error.message}`);
    process.exitCode = 1;
});
browser.unref();
