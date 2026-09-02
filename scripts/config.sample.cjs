#!/usr/bin/env node

// config.js

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const STORAGE = [
    '*.php',
    'assets',
    'backend',
    'behaviors',
    'classes',
    'components',
    'config',
    'console',
    'controllers',
    'factories',
    'lang',
    'models',
    'partials',
    'plugin.yaml',
    'reportwidgets',
    'traits',
    'updates',
    'views',
    '*manifest.json*',
    'content',
    'favicon.ico*',
    'layouts',
    'meta',
    'pages',
    'robots.txt',
    'theme.yaml',
    'version.yaml',
    'composer.json',
    'composer.lock',
];

const FILE = packageJson.name;
const VERSION = packageJson.version;

const TARGET = path.resolve(__dirname, '..');

const UPLOAD_TYPE = 'files'; // files, archive, both

const UPLOAD = {
    protocol: 'scp', // ftp, sftp, scp, ftps
    host: '',
    port: '',
    user: '',
    pass: '',
    key: '',
    path: '',
    rename: '',
    backupExisting: '',
    chown: '',
    postRun: '',
};

module.exports = {
    STORAGE,
    FILE,
    VERSION,
    TARGET,
    UPLOAD_TYPE,
    UPLOAD,
};
