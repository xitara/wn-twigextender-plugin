import { merge } from 'webpack-merge';
import { commonConfig } from './webpack/webpack.common.js';
import { production } from './webpack/webpack.production.js';
import { development } from './webpack/webpack.development.js';

// const { merge } = require('webpack-merge');
// const commonConfig = require('./webpack/webpack.common');

export default (env, argv) => {
    if (!argv.mode) {
        throw new Error('You must pass an --mode flag into your build for webpack to work!');
    }

    // console.log(argv);

    const config = {
        production: production,
        development: development,
    };

    process.env.BABEL_ENV = argv.mode;
    process.env.NODE_ENV = argv.mode;
    process.env.NO_CL = argv.env['no-cl'] === true ? true : false;
    process.env.VAR = argv.env['v'];
    // process.env.EXPORT_VAR = (argv.env['v'] !== '') ? argv.env['v'] : false;

    const envConfig = config[argv.mode](process);

    // console.log(argv.mode);
    // console.log(config[argv.mode]);
    // console.log(global);
    // console.log(this[argv.mode]);
    // console.log(envConfig);

    return merge(commonConfig(process), envConfig);
    // return merge(commonConfig(argv.mode, argv.env['v']), envConfig);
};
