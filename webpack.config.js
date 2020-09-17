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
    optimization: {
        minimize: false
    },
    module: {
        rules: [
            { test: /\.(js)$/, exclude: /node_modules/, use: 'babel-loader' },
            { test: /\.css$/, loader: ['to-string-loader', 'css-loader'] },
        ],
    },
};

module.exports = webpackConfig;