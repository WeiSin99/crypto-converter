const path = require('path');
const { merge } = require('webpack-merge');
const modeConfig = (mode) => require(`./webpack.${mode}`)(mode);
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env) => {
  return merge(
    {
      entry: {
        index: './src/javascript/main.js',
      },
      output: {
        path: path.resolve(__dirname, 'dist'),
        clean: true,
      },
      module: {
        rules: [
          {
            test: /\.html$/i,
            loader: 'html-loader',
          },

          {
            test: /\.css$/i,
            use: [MiniCssExtractPlugin.loader, 'css-loader'],
          },
          {
            test: /\.(scss)$/,
            use: [
              {
                loader: MiniCssExtractPlugin.loader,
              },
              {
                // translates CSS into CommonJS modules
                loader: 'css-loader',
              },
              {
                // Run postcss actions
                loader: 'postcss-loader',
                options: {
                  // `postcssOptions` is needed for postcss 8.x;
                  // if you use postcss 7.x skip the key
                  postcssOptions: {
                    // postcss plugins, can be exported to postcss.config.js
                    plugins: function () {
                      return [require('autoprefixer')];
                    },
                  },
                },
              },
              {
                // compiles Sass to CSS
                loader: 'sass-loader',
              },
            ],
          },
        ],
      },
      plugins: [
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin({
          template: path.join(__dirname, 'src', 'index.html'),
        }),
      ],
      optimization: {
        splitChunks: {
          chunks: 'all',
        },
      },
    },
    modeConfig(env.mode)
  );
};
