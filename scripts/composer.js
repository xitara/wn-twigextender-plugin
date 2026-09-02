#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

if (!fs.existsSync('composer.json')) {
    console.log('No composer.json found.');
    process.exit(0);
}

console.log('Installing Composer dependencies.');
execFileSync('composer', ['install'], { stdio: 'inherit' });
