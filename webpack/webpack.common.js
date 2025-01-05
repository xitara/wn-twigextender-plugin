// Aufruf: yarn build --env v=sl no-cl
// Parameter optional.
// v -> Export-Prefix
// no-cl -> alle console.log() entfernen

import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import TailwindCSS from 'tailwindcss';
import TerserPlugin from 'terser-webpack-plugin';
import { paths } from './paths.js';
// const glob = require('glob');

// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const CopyWebpackPlugin = require('copy-webpack-plugin');
// const TailwindCSS = require('tailwindcss');
// const TerserPlugin = require('terser-webpack-plugin');
// const paths = require('./paths');
// const glob = require('glob');

// module.exports = {
// module.exports = (mode, v = false) => {
export const commonConfig = (process) => {
    console.log('Mode: ', process.env.NODE_ENV);
    console.log('Var: ', process.env.VAR);
    console.log('Remove console: ', process.env.NO_CL);

    return {
        context: paths.src,
        entry: {
            // 'shoplytics_datalayer-builder': './ts/datalayer-builder/app.ts',
            'shoplytics_datalayer-builder-modified': './ts/datalayer-builder/modified.ts',
            // 'shoplytics_datalayer-builder-xt-commerce': './ts/datalayer-builder/xt-commerce.ts',
            // 'shoplytics_datalayer-builder-joomla': './ts/datalayer-builder/joomla.ts',
            // 'shoplytics_datalayer-builder-shopware': './ts/datalayer-builder/shopware.ts',
            // 'shoplytics_datalayer-builder-woocommerce': './ts/datalayer-builder/woocommerce.ts',
            // 'shoplytics_datalayer-builder-plentymarkets': './ts/datalayer-builder/plentymarkets.ts',
            // 'shoplytics_datalayer-builder-shopify': './ts/datalayer-builder/shopify.ts',
            // 'shoplytics_datalayer-builder-thaigutschein': './ts/datalayer-builder/thaigutschein.ts',
            // shoplytics_consent_banner: './ts/shoplytics-consent-banner/app.ts',
            // shoplytics_form_autotracking: './js/shoplytics_form_autotracking.js',
            // pushDataLayer: './js/pushDataLayer.js',
            // customPixel: './ts/customPixel.ts',
            // app: `./js/app.js`,
            // app_ts: `./ts/app.ts`,
            // print: `./scss/print.scss`,
            // breakpoints: `./scss/breakpoints.scss`,
        },
        output: {
            filename: `assets/js/[name]${process.env.NODE_ENV == 'development' ? '.debug' : ''}.js`,
            // devtoolModuleFilenameTemplate: '[resource-path]',
            path: paths.build,
            // Example:
            // export const initFormConversion = () => {}
            // Call: sl.initFormConversion();
            // library: undefined,
            library:
                process.env.VAR !== 'undefined'
                    ? {
                          name: process.env.VAR,
                          //   name: 'sl',
                          type: 'var',
                      }
                    : undefined,
        },
        resolve: {
            symlinks: false,
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        cache: {
            type: 'memory',
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    styles: {
                        name: 'styles',
                        test: /\.css$/,
                        chunks: 'all',
                        enforce: true,
                    },
                },
            },
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                },
                {
                    test: /\.ts?$/,
                    exclude: /node_modules/,
                    use: 'ts-loader',
                },
                {
                    test: /\.(sa|sc|c)ss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 2,
                                url: false,
                                sourceMap: true,
                            },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    sourceMap: true,
                                    plugins: [
                                        // require('tailwindcss'),
                                        // require('autoprefixer'),
                                        // import 'postcss-flexbugs-fixes',
                                        // require('tailwindcss'),
                                        // require('autoprefixer'),
                                        // require('postcss-flexbugs-fixes'),
                                    ],
                                    // postCss: [
                                    // TailwindCSS('tailwind.config.js'),
                                    // ],
                                    processCssUrls: false,
                                },
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true,
                            },
                        },
                    ],
                },
                {
                    test: /\.html$/,
                    use: 'html-loader',
                },
                {
                    test: /\.(woff2?|eot|ttf|otf)$/,
                    use: {
                        loader: 'file-loader',
                        options: {
                            publicPath: 'assets/fonts',
                            outputPath: 'assets',
                            name: '[path][name].[ext]',
                            esModule: false,
                        },
                    },
                },
                {
                    test: /\.(gif|ico|jpe?g|png|svg|webp)$/,
                    use: {
                        loader: 'file-loader',
                        options: {
                            publicPath: 'assets/images',
                            outputPath: 'assets',
                            name: '[path][name].[ext]',
                            esModule: false,
                        },
                    },
                },
            ],
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: 'assets/css/[name].css',
                chunkFilename: 'assets/css/[name].[id].css',
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: paths.static,
                        noErrorOnMissing: true,
                        globOptions: {
                            dot: true,
                            gitignore: false,
                            ignore: ['**/README.md'],
                        },
                    },
                ],
            }),
        ],
    };
};
