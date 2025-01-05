import WebpackAssetsManifest from 'webpack-assets-manifest';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CssoWebpackPlugin from 'csso-webpack-plugin';
import { StatsWriterPlugin } from 'webpack-stats-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
// import BrotliPlugin from 'brotli-webpack-plugin';
// import PurgeCssPlugin from 'purgecss-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
// import { paths } from './paths.js';
// import { glob } from 'glob';

export const production = (process) => {
    // console.log('Remove console: ', process.env.NO_CL);

    const removeFunctions = [];
    if (process.env.NO_CL === 'true') {
        removeFunctions.push('console.log');
        removeFunctions.push('console.warn');
        removeFunctions.push('console.debug');
        // removeFunctions.push('console.error');
    }

    console.log('Remove functions: ', removeFunctions);
    // export const production = {

    return {
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        mangle: {
                            reserved: ['showCB', 'hideCB', 'initFormConversion'],
                        },
                        compress: {
                            // drop_console: true,
                            // drop_console: process.env.NO_CL == 'true' ? true : false,
                            pure_funcs: removeFunctions,
                            // pure_funcs: ['console.log', 'console.warn', 'console.debug'],
                        },
                    },
                }),
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: 'index.html',
                minify: {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    keepClosingSlash: true,
                },
            }),
            new StatsWriterPlugin({ fields: null, filename: 'stats.json' }),
            new WebpackAssetsManifest(),
            new MiniCssExtractPlugin({
                filename: 'assets/css/[name].css',
                chunkFilename: 'assets/css/[id].css',
            }),
            new CssoWebpackPlugin.default(),
            new CompressionPlugin({
                exclude: /\.yaml/,
            }),
            // new BrotliPlugin({
            //     asset: '[path].br[query]',
            //     test: /\.(js|css|html|svg)$/,
            //     threshold: 10240,
            //     minRatio: 0.8
            // }),
            // new PurgeCssPlugin({
            // paths: glob.sync(`${paths.src}{/**/*.htm,/**/*}`, { nodir: true }),
            // }),
        ],
        // devtool: 'source-map',
    };
};
