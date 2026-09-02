export const development = () => ({
    devtool: 'source-map',
    optimization: {
        minimize: false,
    },
    devServer: {
        devMiddleware: {
            writeToDisk: true,
        },
        hot: false,
    },
});
