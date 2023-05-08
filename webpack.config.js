const path = require('path')
const webpackbar = require('webpackbar')
const HtmlWebpackPlugin = require('html-webpack-plugin')

// 抽离css为单独模块
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
// 压缩css
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')

const isProd = process.env.NODE_ENV == 'production'

module.exports = {
  mode: isProd ? 'production' : 'development', // development
  devtool: 'eval-cheap-module-source-map', 
  entry: './src/main.js', // 单入口
  // 多入口
  // entry: {
  //   app: './app.js',
  //   main: './main.js',
  // }
  output: {
    filename: 'js/[name]_[contenthash:8].js',
    path: path.resolve(__dirname, './dist'),
    clean: true, //  清除打包目录文件 取代 clean-webpack-plugin
    assetModuleFilename: '[name]_[contenthash:8][ext]', // 静态文件名称
  },
  // 缓存配置
  cache: {
    type: isProd ? 'filesystem' : 'memory',
  },
  // 解析配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    extensions: ['.js','.vue','.json'],
  },
  module: {
    // 忽略不需要解析的文件
    noParse: /^(vue|vue-router|vuex|vuex-router-sync)$/,
    rules: [
      {
        test:/\.js$/, 
        exclude:/node_modules/,
        // js兼容性处理 babel-loader @babel/core 
        // 只能转换基本语法 @babel/preset-env 
        // 所有js兼容性处理 @babel/polyfill 但是将所有兼容性代码全部引入，体积太大了
        // 最佳，按需加载处理 useBuiltIns: "usage"
        use:[
          {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    // 按需加载
                    useBuiltIns: "usage", 
                    // 指定core-js版本
                    corejs: 2,
                    // 指定兼容性浏览器版本
                    // targets: {
                    //   chrome: "60",
                    //   firefox: "60",
                    //   ie: "10",
                    //   safari: "10",
                    //   edge: "17",
                    // },
                  },
                ],
              ],
              // 缓存
              cacheDirectory: true,
            }
          }
        ],
      },
      {
        test: /\.css$/i,
        use: [isProd ?  MiniCssExtractPlugin.loader : 'style-loader', "css-loader", 'postcss-loader'],
      },
      {
        test: /\.less$/i,
        use: [
          // "style-loader", // 将样式通过 style 标签注入 开发模式使用，自带热更新
          // MiniCssExtractPlugin.loader // 取代 style-loader，将css抽离单独的css模块
         isProd ?  MiniCssExtractPlugin.loader : 'style-loader', 
          "css-loader", 
          'postcss-loader', // 配合 postcss-preset-env -> postcss.config.js  使用
             // module.exports = {
             //   plugins: [
             //     //使用postcss插件
             //     require("postcss-preset-env"),
             //   ],
             // }
          'less-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset', // 取代 file-loader和url-loader
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024 // 小于10kb，转为base64
          }
        },
        generator: {
          // output已经配置静态资源名称 assetModuleFilename，此处只需配置路径即可
          // filename: 'images/[name]_[hash:8][ext][query]', 
          outputPath: isProd ? 'images' : ''
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
        type: 'asset', // 取代 file-loader和url-loader
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024 // 小于10kb，转为base64
          }
        },
        generator: {
          // output已经配置静态资源名称 assetModuleFilename，此处只需配置路径即可
          // filename: 'images/[name]_[hash:8][ext][query]', 
          outputPath: isProd ? 'media' : ''
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset', // 取代 file-loader和url-loader
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024 // 小于10kb，转为base64
          }
        },
        generator: {
          // output已经配置静态资源名称 assetModuleFilename，此处只需配置路径即可
          // filename: 'images/[name]_[hash:8][ext][query]', 
          outputPath: isProd ? 'fonts' : ''
        }
      }
    ]
  },
  plugins:[
    new webpackbar(),
    new HtmlWebpackPlugin({
      template: './index.html',
      minify: {
        collapseWhitespace: true,  // 删除空格
        removeComments: true, // 删除注释
      },
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name]_[contenthash:8].css'
    }),
    new CssMinimizerWebpackPlugin(),
  ],
  // 优化配置
  // minimizer 压缩配置
  // splitChunks -> SplitChunckPlugin 代码分割配置
  optimization: {
    minimize: true,
    minimizer: [
      new TerserWebpackPlugin({
        // TODO
      })
    ],
    splitChunks: {
      chunks: 'all', // all处理所有，async处理异步 和 initial处理同步
      minSize: 30000, // 大于30k 才拆分
      minRemainingSize: 0,
      minChunks: 2, // 被引用2次 拆分
      maxAsyncRequests: 30, // 按需加载时的最大并行请求数
      maxInitialRequests: 30, // 初始并行请求数
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  // 本地服务配置
  devServer: {
    hot: true,
    compress: false, 
    port: 3002,
    host: "localhost",
    open: true,
    // 代理
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        pathRewrite: {
          "^/api": "",
        },
      },
    },
  },
}