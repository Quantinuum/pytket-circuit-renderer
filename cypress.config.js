const { defineConfig } = require('cypress')
const webpack = require('webpack')

module.exports = defineConfig({
  // These tests assert that content clipped by the circuit viewport is hidden.
  visibilityStrategy: 'legacy',
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'webpack',
      webpackConfig: () => {
        const config = require('@vue/cli-service/webpack.config.js')
        config.plugins.push(
          new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer']
          })
        )
        config.resolve.fallback = {
          ...config.resolve.fallback,
          assert: require.resolve('assert/'),
          stream: require.resolve('stream-browserify'),
          zlib: require.resolve('browserify-zlib'),
          path: require.resolve('path-browserify'),
          buffer: require.resolve('buffer/')
        }
        return config
      }
    }
  }
})
