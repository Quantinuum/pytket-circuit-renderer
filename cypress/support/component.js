/* global Cypress */
import './commands'
import { mount } from '@cypress/vue'
import 'vue/dist/vue.esm-bundler.js' // Required for mounting storybook components
import * as globalStorybookConfig from '../../.storybook/preview' // path of your preview.js file
import { setProjectAnnotations } from '@storybook/vue3'

setProjectAnnotations(globalStorybookConfig)

Cypress.Commands.add('mount', (component, ...args) => {
  args.global = args.global || {}
  args.global.config = {
    ...args.global.config,
    unwrapInjectedRef: true
  }
  return mount(component, args)
})
