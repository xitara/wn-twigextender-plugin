import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { WebpackAssetsManifest } from 'webpack-assets-manifest';
import { StatsWriterPlugin } from 'webpack-stats-plugin';

const enabled = (value) => value === true || value === 'true';

export const production = (config, build) => ({
    devtool: false,
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                extractComments: false,
                terserOptions: {
                    mangle: { reserved: config.reserveFunctions },
                    compress: {
                        pure_funcs:
                            enabled(build.env.removeFunctions) || enabled(build.env.rf)
                                ? config.removeFunctions
                                : [],
                    },
                },
            }),
            new CssMinimizerPlugin(),
        ],
    },
    plugins: [
        new StatsWriterPlugin({ fields: null, filename: 'stats.json' }),
        new WebpackAssetsManifest({ output: 'assets-manifest.json' }),
    ],
});
