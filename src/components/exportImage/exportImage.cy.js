/* global cy, describe, it, expect */
import ExportImage from './exportImage.vue'

describe('Image export rendering', () => {
  for (const fileType of ['png', 'jpeg', 'svg']) {
    for (const scale of [1, 4]) {
      it(`renders ${fileType} content at ${scale}x resolution`, () => {
        cy.mount({
          components: { ExportImage },
          data: () => ({ elements: [] }),
          mounted () {
            this.elements = [this.$refs.source]
          },
          // Solid colours provide a visual reference independent of system fonts
          // and browser text antialiasing. The two halves also detect bad scaling.
          template: `
            <div>
              <div ref="source" style="width: 80px; height: 40px">
                <div style="width: 80px; height: 40px; background: rgb(255, 0, 0)">
                  <div style="width: 40px; height: 40px; background: rgb(0, 0, 255)"></div>
                </div>
              </div>
              <export-image :elements-to-render="elements" />
            </div>`
        })

        cy.get(`[data-cy="option-${fileType.toUpperCase()}"]`).click()
        cy.get(`[data-cy="option-${scale}x"]`).click()
        cy.get('button[title="Generate Image"]').click()
        cy.get('.image-preview img').should($image => {
          expect($image[0].complete, 'preview loaded').equal(true)
          expect($image[0].naturalWidth).equal(80 * scale)
          expect($image[0].naturalHeight).equal(40 * scale)
        }).then($image => {
          const image = $image[0]
          const canvas = image.ownerDocument.createElement('canvas')
          canvas.width = image.naturalWidth
          canvas.height = image.naturalHeight
          const context = canvas.getContext('2d')
          context.drawImage(image, 0, 0)
          const left = context.getImageData(10 * scale, 20 * scale, 1, 1).data
          const right = context.getImageData(60 * scale, 20 * scale, 1, 1).data
          // JPEG is lossy, even at its highest quality setting.
          const tolerance = fileType === 'jpeg' ? 3 : 0
          for (const [actual, expected] of [[left, [0, 0, 255, 255]], [right, [255, 0, 0, 255]]]) {
            expected.forEach((value, channel) => {
              expect(actual[channel]).closeTo(value, tolerance)
            })
          }
        })
      })
    }
  }
})
