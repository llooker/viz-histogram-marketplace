var webpackConfig = {
    mode: 'production',
    entry: {
        histogram: './src/histogram.js'
    },
    output: {
        filename: '[name].js',
        path: __dirname,
        library: '[name]',
        libraryTarget: 'umd',
    },
    resolve: {
        extensions: ['.js'],
        modules: ['node_modules'],
    },
};

module.exports = webpackConfig;