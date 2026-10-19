const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  // Thread workers cannot read the virtual modules used by Storybook and Cypress.
  parallel: false,
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        options.compilerOptions = {
          ...options.compilerOptions,
          delimiters: ['[[#', '#]]']
        }
        return options
      })
  }
})
