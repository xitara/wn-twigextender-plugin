#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const expectedFiles = ['assets/assets-manifest.json', 'assets/index.html', 'assets/stats.json'];

for (const filename of expectedFiles) {
    const stats = fs.statSync(path.resolve(filename));

    if (!stats.isFile() || stats.size === 0) {
        throw new Error(`Missing or empty build artifact: ${filename}`);
    }
}

const manifest = JSON.parse(fs.readFileSync('assets/assets-manifest.json', 'utf8'));
if (Object.values(manifest).some((filename) => /\.(?:css|js)$/.test(filename))) {
    throw new Error('TwigExtender unexpectedly emitted unused runtime CSS or JavaScript.');
}

console.log('Build artifacts look complete.');
