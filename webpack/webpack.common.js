import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'node:path';
import postcssFlexbugsFixes from 'postcss-flexbugs-fixes';
import RemoveEmptyScriptsPlugin from 'webpack-remove-empty-scripts';

import { createEntryFilename, isVersionedEntryAsset } from './entrypoints.js';

const postcssOptions = (withTailwind = false) => ({
    plugins: [...(withTailwind ? [tailwindcss()] : []), postcssFlexbugsFixes, autoprefixer],
});

export const commonConfig = (config, build) => {
    const projectRoot = process.cwd();
    const resolveApp = (relativePath) => path.resolve(projectRoot, relativePath);
    const isDevelopment = build.mode === 'development';
    const entryVersions = config.entryVersions ?? {};
    const developmentSuffix = isDevelopment ? '.debug' : '';

    return {
        context: resolveApp(config.sourceDir),
        entry: config.entrypoints,
        output: {
            filename: createEntryFilename({
                directory: 'js',
                extension: 'js',
                entryVersions,
                suffix: developmentSuffix,
            }),
            path: resolveApp(config.outputDir),
            clean: {
                /**
                 * Alte Dateien versionierter Entries werden bewusst behalten.
                 * So können beispielsweise app-1.0.0.js und app-2.0.0.js
                 * gleichzeitig im Ausgabeordner verfügbar sein.
                 */
                keep: (asset) => isVersionedEntryAsset(asset, entryVersions),
            },
            devtoolModuleFilenameTemplate: 'webpack://[namespace]/[resource-path]?[loaders]',
            library: config.library
                ? {
                      name: config.library,
                      type: 'var',
                  }
                : undefined,
            assetModuleFilename: 'media/[name][ext][query]',
        },
        cache: {
            type: 'filesystem',
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx', '...'],
            extensionAlias: {
                '.js': ['.ts', '.js'],
                '.mjs': ['.mts', '.mjs'],
                '.cjs': ['.cts', '.cjs'],
            },
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: 'babel-loader',
                },
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: 'ts-loader',
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: { importLoaders: 2, sourceMap: isDevelopment },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                sourceMap: isDevelopment,
                                postcssOptions: postcssOptions(),
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: isDevelopment,
                                sassOptions: {
                                    loadPaths: [resolveApp('node_modules')],
                                    quietDeps: true,
                                    silenceDeprecations: ['import'],
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.css$/i,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: { importLoaders: 1, sourceMap: isDevelopment },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                sourceMap: isDevelopment,
                                postcssOptions: postcssOptions(true),
                            },
                        },
                    ],
                },
                {
                    test: /\.html$/i,
                    use: 'html-loader',
                },
                {
                    test: /\.(woff2?|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                    generator: { filename: 'fonts/[name][ext][query]' },
                },
                {
                    test: /\.(gif|ico|jpe?g|png|svg|webp)$/i,
                    type: 'asset/resource',
                    generator: { filename: 'images/[name][ext][query]' },
                },
            ],
        },
        plugins: [
            new RemoveEmptyScriptsPlugin(),
            new MiniCssExtractPlugin({
                filename: createEntryFilename({
                    directory: 'css',
                    extension: 'css',
                    entryVersions,
                }),
                chunkFilename: 'css/[name].[id].css',
            }),
            new HtmlWebpackPlugin({ template: 'index.html' }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: resolveApp(config.staticDir),
                        to: resolveApp('.'),
                        globOptions: {
                            dot: true,
                            ignore: ['**/README.md'],
                        },
                    },
                ],
            }),
        ],
    };
};
