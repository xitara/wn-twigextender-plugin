#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const localBinaries = ['vendor/bin/phpdoc', 'vendor/bin/phpDocumentor'];
const localBinary = localBinaries.find((candidate) => fs.existsSync(candidate));
const command = localBinary ? path.resolve(localBinary) : 'phpDocumentor';
const result = spawnSync(command, [], { stdio: 'inherit' });

if (result.error) {
    console.error(
        'phpDocumentor was not found. Install it with Composer or make phpDocumentor available in PATH.'
    );
    process.exit(1);
}

process.exit(result.status ?? 1);
