// const fs = require('fs');
// const path = require('path');

import fs from 'fs';
import path from 'path';

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

export const paths = {
    src: resolveApp('src'),
    build: resolveApp(''),
    static: resolveApp('static'),
};
