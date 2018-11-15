const { join } = require('path')
const webpack = require('webpack')
const os = require('os')
const HappyPack = require('happypack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length - 1 })

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  context: process.cwd(),

  entry: './playground/index.tsx',

  mode: 'development',

  devtool: 'cheap-module-source-map',

  devServer: {
    port: 8000
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },

  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        loader: 'happypack/loader?id=sourcemap',
        enforce: 'pre',
        include: [join(process.cwd(), './src')]
      },
      {
        test: /\.tsx?$/,
        use: 'happypack/loader?id=ts',
        exclude: /node_modules/
      }
    ]
  },

  plugins: [
    new webpack.NamedModulesPlugin(),

    new webpack.HotModuleReplacementPlugin(),

    new HappyPack({
      id: 'sourcemap',
      loaders: ['source-map-loader'],
      threadPool: happyThreadPool
    }),

    new HappyPack({
      id: 'ts',
      loaders: [
        {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            happyPackMode: true,
            configFile: join(process.cwd(), 'tsconfig.json')
          }
        }
      ],
      threadPool: happyThreadPool
    }),

    new HtmlWebpackPlugin({
      template: join(process.cwd(), 'index.html'),
      inject: true
    }),

    new ForkTsCheckerWebpackPlugin()
  ]
}
