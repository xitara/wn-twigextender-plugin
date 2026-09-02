#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { globSync } from 'glob';

const requestedFiles = process.argv.slice(2);
const discoveredFiles = globSync('**/*.php', {
    absolute: true,
    dot: true,
    ignore: ['.docs/**', 'assets/**', 'dist/**', 'node_modules/**', 'static/**', 'vendor/**'],
    nodir: true,
});

const phpFiles =
    requestedFiles.length > 0
        ? requestedFiles
              .filter((file) => file.endsWith('.php') && fs.existsSync(file))
              .map((file) => path.resolve(file))
        : discoveredFiles;

const uniqueFiles = [...new Set(phpFiles)].sort();

if (uniqueFiles.length === 0) {
    console.log('No PHP files found.');
    process.exit(0);
}

let failed = false;

for (const file of uniqueFiles) {
    const result = spawnSync(process.env.PHP_BINARY ?? 'php', ['-l', file], {
        encoding: 'utf8',
    });

    if (result.error) {
        console.error(`PHP linter could not be started: ${result.error.message}`);
        process.exit(1);
    }

    if (result.status !== 0) {
        failed = true;
        console.error(result.stderr.trim() || result.stdout.trim());
    }
}

if (failed) {
    process.exit(1);
}

console.log(`PHP syntax check passed for ${uniqueFiles.length} file(s).`);
