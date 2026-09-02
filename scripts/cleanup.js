#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const generatedPaths = [
    'assets',
    '.cache',
    '.docs',
    'dist',
    'config',
    'favicon.ico',
    'index.html',
    'robots.txt',
    'yarn.lock',
    'composer.lock',
    'yarn-error.log',
    'vendor',
    'node_modules',
];

for (const generatedPath of generatedPaths) {
    const resolvedPath = path.resolve(generatedPath);

    if (!fs.existsSync(resolvedPath)) {
        continue;
    }

    fs.rmSync(resolvedPath, { force: true, recursive: true });
    console.log(`Removed ${generatedPath}`);
}

// console.log('Lockfiles and installed dependencies were preserved.');
