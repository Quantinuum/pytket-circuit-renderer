/* global Cypress, cy, it, describe, expect */
import { composeStories } from '@storybook/vue3'
import * as stories from './circuitDisplayContainer.stories.js'
import { PNG } from 'pngjs'
import jpeg from 'jpeg-js'
import pixelmatch from 'pixelmatch'

const components = composeStories(stories)
const useCases = Object.keys(components)

describe('Circuit display container component', () => {
  useCases.forEach(useCase => {
    // Skip the render option use case since that renders just a basic circ.
    if (useCase !== 'InitRenderOptions') {
      const getPresetArgs = (preset) => {
        return useCase === 'MultiCircuit' ? { circuitPresets: [preset, preset] } : { circuitPreset: preset }
      }
      describe(useCase, () => {
        it('mounts', () => {
          cy.mount({ name, ...components[useCase](getPresetArgs('Classical')) })
        })

        it('can scroll the circuit', () => {
          const viewWidth = useCase === 'MultiCircuit' ? 600 : 500
          cy.viewport(viewWidth, 500)
          cy.mount({ name, ...components[useCase](getPresetArgs('Classical')) })
          cy.contains('(a XOR b)').should('not.be.visible')
          cy.get('.navigator-controller.nav-x')
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: viewWidth * 0.45, clientY: 0 })
            .trigger('mouseup', { which: 1 })
          cy.contains('(a XOR b)').should('be.visible')
          // Jump scrollbar to end
          cy.get('.navigator-preview-block-x').within(() => {
            cy.get('.navigator-preview')
              .click('right')
          })
          cy.contains('SetBits(1,1,0,0)').should('not.be.visible')
          cy.contains('(b RSH 1)').should('be.visible')
        })

        it('can zoom the circuit', () => {
          cy.viewport(500, 500)
          cy.mount({ name, ...components[useCase](getPresetArgs('Classical')) })
          cy.contains('(a XOR b)').should('not.be.visible')
          // zoom out
          cy.get('.zoom-controller.end.nav-x')
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: 250, clientY: 0 })
            .trigger('mouseup', { which: 1 })
          cy.contains('(a XOR b)').should('be.visible')
          // zoom in
          cy.get('.zoom-controller.end.nav-x')
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: 0, clientY: 0 })
            .trigger('mouseup', { which: 1 })
          cy.contains('(a XOR b)').should('not.be.visible')
          // view whole circuit
          cy.get('[data-cy="fitZoom"]').click()
          cy.contains('SetBits(1,1,0,0)').should('be.visible')
          cy.contains('(b RSH 1)').should('be.visible')
          // reset zoom
          cy.get('.navigator-controller.nav-x').dblclick()
          cy.contains('SetBits(1,1,0,0)').should('be.visible')
          cy.contains('Range[2, ').should('not.be.visible')
        })

        it('can toggle display options', () => {
          cy.mount({ name, ...components[useCase](getPresetArgs('Classical')) })
          cy.contains('tk_SCRATCH_BIT[0]').should('not.exist')
          cy.get('[title="Display Options"').click()
          cy.contains('Collapse classical registers').click()
          cy.contains('tk_SCRATCH_BIT[0]').should('exist')
        })

        it('Can view nested info modals', () => {
          cy.viewport(500, 500)
          cy.mount({ name, ...components[useCase](getPresetArgs('SimpleNested')) })
          cy.get('.navigator-controller.nav-x')
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: 300, clientY: 0 })
            .trigger('mouseup', { which: 1 })
          cy.get('[data-cy=open-tool-tip-CircBox]').should('be.visible').first().click()
          cy.get('[data-cy=teleport-to] [data-cy=teleported-CircBox]').within(() => {
            cy.contains('Rx').should('exist')
            cy.get('[data-cy=open-tool-tip-Rx]').should('be.visible').click()
            cy.get('[data-cy=teleported-Rx]').within(() => {
              cy.contains('Box params')
            })
          })
        })
        it('Can view nested info modals when displaying circuits recursively', () => {
          cy.viewport(500, 500)
          cy.mount({ name, ...components[useCase](getPresetArgs('SimpleNested')) })
          // Activate recursive render option
          cy.get('[title="Display Options"]').click()
          cy.contains('Render nested circuits recursively').click()
          cy.get('[title="Display Options"]').click()

          cy.get('.navigator-controller.nav-x')
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: 270, clientY: 0 })
            .trigger('mouseup', { which: 1 })
          cy.get('[data-cy=open-tool-tip-Rx]').should('be.visible').first().click()
          cy.get('[data-cy=teleport-to] [data-cy=teleported-Rx]').within(() => {
            cy.contains('Box params').should('be.visible')
          })
        })
      })
    }
  })

  // Image exporting
  const fileTypes = ['png', 'jpeg', 'svg']
  const resolutions = [1, 4]
  fileTypes.forEach(fileType => {
    describe(`Exporting ${fileType} image`, () => {
      resolutions.forEach(resolution => {
        describe(`x${resolution} resolution`, () => {
          it('can export a single circuit as an image', () => {
            cy.viewport(500, 500)
            cy.mount({ name, ...components.FromRaw({ circuitPreset: 'Basic' }) })

            // Make sure the theme/viewport is consistent
            cy.get('[title="Display Options"]').click()
            cy.contains('Use system Theme').click()
            cy.get('[title="Display Options"]').click()
            cy.get('[data-cy="resetZoom"]').click()

            cy.get('[title="Export"').click()
            cy.contains('Export circuit as an image')

            cy.get(`[data-cy="option-${fileType.toUpperCase()}"]`).click()
            cy.get(`[data-cy="option-${resolution}x"]`).click()
            cy.contains('Generate').click()

            const circuitName = `cy-BASIC-x${resolution}`
            cy.get('input[data-cy="filename"]').clear().type(circuitName)

            compareImages(circuitName, fileType)
          })
          // Only check multiple for png
          if (fileType === 'png') {
            it('can export multiple circuits as images', () => {
              cy.viewport(500, 500)
              cy.mount({ name, ...components.MultiCircuit({ circuitPresets: ['Basic', 'Params'] }) })

              // Make sure the theme is consistent
              cy.get('[title="Display Options"]').click()
              cy.contains('Use system Theme').click()
              cy.contains('Dark Mode').click()
              cy.get('[title="Display Options"]').click()

              cy.get('[title="Export"').click()
              cy.contains('Export circuit as an image')

              cy.get(`[data-cy="option-${fileType.toUpperCase()}"]`).click()
              cy.get(`[data-cy="option-${resolution}x"]`).click()
              cy.get('button[title="Generate Image"]').click()

              const circuitName = `cy-MULTI-x${resolution}_`
              cy.get('input[data-cy="filename"]').clear().type(circuitName)
              cy.get('[data-cy="number_images"]').click()

              compareImages(circuitName + '0', fileType)
              compareImages(circuitName + '1', fileType)
            })
          }
        })
      })
    })
  })
})

async function decodeImage (base64, filetype) {
  const buff = Cypress.Buffer.from(base64, 'base64')
  if (filetype === 'png') {
    return PNG.sync.read(buff)
  } else if (filetype === 'jpeg') {
    return jpeg.decode(buff)
  }
}

function compareImages (circuitName, fileType) {
  const actualFilename = `${circuitName}.${fileType}`
  const expectedScreenshotFilename = `${circuitName}.${fileType}.SCREENSHOT-REF.png`

  cy.get(`img[data-cy="${actualFilename}"]`)
    .scrollIntoView()
    .screenshot(actualFilename)
    .then(($image) => {
      cy.get(`button[data-cy="${actualFilename}"]`).click()

      // Check that a file is downloaded
      cy.readFile('cypress/downloads/' + actualFilename, 'base64', {})

      // Compare image preview screenshot to reference image
      cy.readFile('cypress/fixtures/images/' + expectedScreenshotFilename, 'base64', {})
        .then((expectedFile) => {
          // Check the screenshot of the image preview.
          cy.readFile(`${Cypress.config('screenshotsFolder')}/circuitDisplayContainer.cy.js/${actualFilename}.png`, 'base64', {})
            .then(async (actualScreenshot) => {
              const actualImage = await decodeImage(actualScreenshot, 'png')
              const expectedImage = await decodeImage(expectedFile, 'png')
              expect(actualImage.width).equal(expectedImage.width)
              expect(actualImage.height).equal(expectedImage.height)
              const diff = await pixelmatch(
                actualImage.data,
                expectedImage.data,
                null,
                actualImage.width,
                actualImage.height,
                { threshold: 0.05 }
              )
              expect(diff).equal(0)
            })
        })
    })
}
