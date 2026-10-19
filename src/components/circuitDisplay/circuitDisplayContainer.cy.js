/* global Cypress, cy, it, describe, expect */
import { composeStories } from '@storybook/vue3'
import * as stories from './circuitDisplayContainer.stories.js'
import { PNG } from 'pngjs'
import jpeg from 'jpeg-js'

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

            captureCircuitDimensions()
            cy.get('[title="Export"]').click()
            cy.contains('Export circuit as an image')

            cy.get(`[data-cy="option-${fileType.toUpperCase()}"]`).click()
            cy.get(`[data-cy="option-${resolution}x"]`).click()
            cy.contains('Generate').click()

            const circuitName = `cy-BASIC-x${resolution}`
            cy.get('input[data-cy="filename"]').clear().type(circuitName)

            checkExport(circuitName, fileType, resolution)
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

              captureCircuitDimensions()
              cy.get('[title="Export"]').click()
              cy.contains('Export circuit as an image')

              cy.get(`[data-cy="option-${fileType.toUpperCase()}"]`).click()
              cy.get(`[data-cy="option-${resolution}x"]`).click()
              cy.get('button[title="Generate Image"]').click()

              const circuitName = `cy-MULTI-x${resolution}_`
              cy.get('input[data-cy="filename"]').clear().type(circuitName)
              cy.get('[data-cy="number_images"]').click()

              checkExport(circuitName + '0', fileType, resolution, 0)
              checkExport(circuitName + '1', fileType, resolution, 1)
            })
          }
        })
      })
    })
  })
})

// Measure the rendered circuits rather than depending on a runner's installed fonts.
function captureCircuitDimensions () {
  cy.get('.circuit-inner-scroll').then($circuits => {
    const dimensions = [...$circuits].map(circuit => ({
      width: circuit.clientWidth,
      height: circuit.clientHeight
    }))
    cy.wrap(dimensions).as('circuitDimensions')
  })
}

function checkExport (circuitName, fileType, resolution, index = 0) {
  const actualFilename = `${circuitName}.${fileType}`
  const mimeType = fileType === 'svg' ? 'image/svg+xml' : `image/${fileType}`

  cy.get(`img[data-cy="${actualFilename}"]`)
    .should($image => {
      expect($image[0].complete, 'preview loaded').equal(true)
      expect($image[0].naturalWidth, 'preview width').greaterThan(0)
      expect($image[0].src.split(/[;,]/)[0], 'export format').equal(`data:${mimeType}`)
    })
    .then($image => {
      const image = $image[0]
      cy.get('@circuitDimensions').then(dimensions => {
        const expectedWidth = Math.ceil(dimensions[index].width * resolution)
        const expectedHeight = Math.ceil(dimensions[index].height * resolution)
        expect(image.naturalWidth, 'exported width').equal(expectedWidth)
        expect(image.naturalHeight, 'exported height').equal(expectedHeight)
      })
      // Fetch also decodes SVG data URLs without depending on their escaping.
      cy.wrap(image.ownerDocument.defaultView.fetch(image.src)
        .then(response => response.arrayBuffer())
        .then(buffer => Cypress.Buffer.from(new Uint8Array(buffer)).toString('base64')))
        .then(preview => {
          cy.get(`button[data-cy="${actualFilename}"]`).click()
          cy.readFile(`${Cypress.config('downloadsFolder')}/${actualFilename}`, 'base64')
            .should('be.a', 'string')
            .then(download => {
              expect(download === preview, 'download matches preview bytes').equal(true)
              if (fileType === 'svg') {
                const xml = new image.ownerDocument.defaultView.DOMParser()
                  .parseFromString(Cypress.Buffer.from(download, 'base64').toString('utf8'), 'image/svg+xml')
                expect(xml.querySelector('parsererror'), 'valid SVG').equal(null)
                expect(xml.documentElement.localName).equal('svg')
                expect(xml.documentElement.getAttribute('width')).equal(String(image.naturalWidth))
                expect(xml.documentElement.getAttribute('height')).equal(String(image.naturalHeight))
                expect(xml.querySelector('foreignObject .circuit-container'), 'exported circuit').not.equal(null)
              } else {
                const buffer = Cypress.Buffer.from(download, 'base64')
                const decoded = fileType === 'png' ? PNG.sync.read(buffer) : jpeg.decode(buffer)
                expect(decoded.width, 'downloaded width').equal(image.naturalWidth)
                expect(decoded.height, 'downloaded height').equal(image.naturalHeight)
              }
            })
        })
    })
}
