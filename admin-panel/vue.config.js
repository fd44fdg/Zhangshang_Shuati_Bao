const path = require('path')
const CompressionWebpackPlugin = require('compression-webpack-plugin')

module.exports = {
  // 基础路径
  publicPath: process.env.NODE_ENV === 'production' ? '/admin/' : '/',
  
  // 输出目录
  outputDir: 'dist',
  
  // 静态资源目录
  assetsDir: 'static',
  
  // 生产环境配置
  productionSourceMap: false, // 生产环境不生成 source map
  
  // 开发服务器配置
  devServer: {
    port: 8081,
    host: '0.0.0.0',
    https: true, // 启用HTTPS以支持ngrok HTTPS隧道
    hot: true,
    allowedHosts: 'all', // 允许所有主机访问
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/api': '/api'
        }
      }
    }
  },
  
  // 构建优化
  configureWebpack: config => {
    // 生产环境优化
    if (process.env.NODE_ENV === 'production') {
      // Gzip 压缩
      config.plugins.push(
        new CompressionWebpackPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8
        })
      )
      
      // 代码分割优化
      config.optimization = {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            libs: {
              name: 'chunk-libs',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              chunks: 'initial'
            },
            elementUI: {
              name: 'chunk-elementUI',
              priority: 20,
              test: /[\\/]node_modules[\\/]_?element-plus(.*)/
            },
            commons: {
              name: 'chunk-commons',
              test: path.resolve(__dirname, 'src/components'),
              minChunks: 3,
              priority: 5,
              reuseExistingChunk: true
            }
          }
        }
      }
    }
    
    // 别名配置
    config.resolve.alias = {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'api': path.resolve(__dirname, 'src/api'),
      'utils': path.resolve(__dirname, 'src/utils'),
      'assets': path.resolve(__dirname, 'src/assets')
    }
  },
  
  // CSS 优化
  css: {
    extract: process.env.NODE_ENV === 'production',
    sourceMap: false,
    loaderOptions: {
      scss: {
        // additionalData: `@use "@/styles/variables.scss" as *;`
      }
    }
  },
  
  // 链式操作配置
  chainWebpack: config => {
    // 移除 prefetch 插件
    config.plugins.delete('prefetch')
    
    // 移除 preload 插件
    config.plugins.delete('preload')
    
    // SVG 图标处理
    config.module
      .rule('svg')
      .exclude.add(path.resolve(__dirname, 'src/icons'))
      .end()
    
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(path.resolve(__dirname, 'src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()
    
    // 图片压缩
    config.module
      .rule('images')
      .use('image-webpack-loader')
      .loader('image-webpack-loader')
      .options({
        mozjpeg: { progressive: true, quality: 65 },
        optipng: { enabled: false },
        pngquant: { quality: [0.65, 0.90], speed: 4 },
        gifsicle: { interlaced: false },
        webp: { quality: 75 }
      })
      .end()
    
    // 生产环境优化
    if (process.env.NODE_ENV === 'production') {
      // 移除 console
      config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true
      config.optimization.minimizer[0].options.terserOptions.compress.drop_debugger = true
    }
  },
  
  // 并行处理
  parallel: require('os').cpus().length > 1,
  
  // 第三方插件选项
  pluginOptions: {
    // Element Plus 自动导入
    'element-plus': {
      useSource: true
    }
  }
}