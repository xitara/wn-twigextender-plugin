#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execFileSync, spawnSync } from 'node:child_process';
import { globSync } from 'glob';

import { STORAGE, FILE, TARGET, VERSION } from './config.cjs';

function formatDate(date) {
    const pad = (value) => String(value).padStart(2, '0');

    return (
        [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-') +
        '_' +
        [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join('')
    );
}

function expandStorageItem(item) {
    if (!item.includes('*')) {
        return [item];
    }

    const matches = globSync(item, {
        dot: false,
        nodir: false,
    });

    return matches.length > 0 ? matches : [item];
}

const yarnExecutable = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';

execFileSync(yarnExecutable, ['build'], { stdio: 'inherit' });

const myDate = formatDate(new Date());
const file = `${FILE}_${VERSION}_${myDate}`;
const distPath = path.join(TARGET, 'dist');
const targetPath = path.join(distPath, file);

// if (fs.existsSync(targetPath)) {
//     fs.renameSync(targetPath, `${targetPath}_${myDate}`);
// }

fs.mkdirSync(targetPath, { recursive: true });

STORAGE.forEach((item) => {
    expandStorageItem(item).forEach((storageItem) => {
        console.log(storageItem);

        if (!fs.existsSync(storageItem)) {
            return;
        }

        const destinationPath = path.join(targetPath, storageItem);
        const destinationDir = path.dirname(destinationPath);

        fs.mkdirSync(destinationDir, { recursive: true });
        fs.cpSync(storageItem, destinationPath, { recursive: true });
    });
});

execFileSync('composer', ['install', '--no-dev', '--optimize-autoloader'], {
    cwd: targetPath,
    stdio: 'inherit',
});

const zipFile = `${file}.zip`;
const zipPath = path.join(distPath, zipFile);
const zipCheck = spawnSync('zip', ['-v'], { stdio: 'ignore' });

if (zipCheck.error || zipCheck.status !== 0) {
    console.error('Error: "zip" ist auf diesem System nicht installiert oder nicht ausführbar.');
    process.exit(1);
}

if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
}

execFileSync('zip', ['-qr', zipFile, file], {
    cwd: distPath,
    stdio: 'inherit',
});
