import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
// import webpack from 'webpack';

// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const TerserPlugin = require('terser-webpack-plugin');

export const development = (process) => {
    return {
        output: {
            // filename: '[name].js',
            // path: path.resolve(__dirname, 'dist'),
            devtoolModuleFilenameTemplate: '[resource-path]',
        },
        optimization: {
            minimize: false,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        format: {
                            beautify: true, // Beibehaltung der ursprünglichen Formatierung
                        },
                        mangle: {
                            reserved: ['slShowCB', 'slHideCB', 'initFormConversion'],
                        },
                        // compress: {
                        // drop_console: true
                        // },
                    },
                    parallel: true,
                    extractComments: false,
                }),
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: 'index.html',
            }),
            // new webpack.SourceMapDevToolPlugin({
            //     filename: '[file].map',  // Erzeugt separate .map-Dateien
            //     moduleFilenameTemplate: '[resource-path]',
            //     fallbackModuleFilenameTemplate: '[resource-path]?[hash]',
            //     sourceRoot: 'webpack:///',
            // }),
        ],
        // devtool: false,
        // devtool: 'inline-source-map',
        devtool: 'source-map',
        // devtool: 'cheap-module-source-map',
        // devtool: 'eval-source-map',
        // devtool: 'nosources-source-map',
    };
};
