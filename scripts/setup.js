#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve('scripts/config.sample.cjs');
const target = path.resolve('scripts/config.cjs');

if (fs.existsSync(target)) {
    console.log('scripts/config.cjs already exists.');
} else {
    fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
    console.log('Created scripts/config.cjs from the sample configuration.');
}
