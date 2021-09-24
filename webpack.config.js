var webpackConfig = {
  mode: "production",
  entry: {
    simple_hist: "./src/simple_hist_entry.js",
    scatter_hist: "./src/scatter_heatmap_entry.js",
  },
  output: {
    filename: "[name].js",
    path: __dirname,
    library: "[name]",
    libraryTarget: "umd",
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        loader: ["style-loader", "css-loader"],
      },
      {
        test: /\.(woff|woff2|ttf|otf)$/,
        loader: "url-loader",
      },
    ],
  },
  resolve: {
    extensions: [".js"],
    modules: ["node_modules"],
  },
};

module.exports = webpackConfig;
