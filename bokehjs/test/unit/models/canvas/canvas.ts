import {expect} from "assertions"

import {Canvas} from "@bokehjs/models/canvas/canvas"
import {build_view} from "@bokehjs/core/build_views"

describe("Canvas", () => {
  describe("should support composing layers", () => {
    it.dpr(1)("with devicePixelRatio == 1", async () => {
      const canvas = new Canvas({output_backend: "canvas", hidpi: true})
      const canvas_view = await build_view(canvas)
      canvas_view.resize(600, 600)
      expect(canvas_view.pixel_ratio).to.be.equal(1)
      const composite_layer = canvas_view.compose()
      expect(composite_layer.ctx.canvas.width).to.be.equal(600)
      expect(composite_layer.ctx.canvas.height).to.be.equal(600)
    })

    it.dpr(2)("with devicePixelRatio == 2", async () => {
      const canvas = new Canvas({output_backend: "canvas", hidpi: true})
      const canvas_view = await build_view(canvas)
      canvas_view.resize(600, 600)
      expect(canvas_view.pixel_ratio).to.be.equal(2)
      const composite_layer = canvas_view.compose()
      expect(composite_layer.ctx.canvas.width).to.be.equal(1200)
      expect(composite_layer.ctx.canvas.height).to.be.equal(1200)
    })

    it.dpr(3)("with devicePixelRatio == 3", async () => {
      const canvas = new Canvas({output_backend: "canvas", hidpi: true})
      const canvas_view = await build_view(canvas)
      canvas_view.resize(600, 600)
      expect(canvas_view.pixel_ratio).to.be.equal(3)
      const composite_layer = canvas_view.compose()
      expect(composite_layer.ctx.canvas.width).to.be.equal(1800)
      expect(composite_layer.ctx.canvas.height).to.be.equal(1800)
    })

    it("with SVG backend", async () => {
      const canvas = new Canvas({output_backend: "svg", hidpi: true})
      const canvas_view = await build_view(canvas)

      canvas_view.resize(600, 600)
      canvas_view.primary.prepare()
      canvas_view.overlays.prepare()

      canvas_view.primary.ctx.fillStyle = "blue"
      canvas_view.primary.ctx.fillRect(100, 200, 300, 400)

      canvas_view.overlays.ctx.fillStyle = "green"
      canvas_view.overlays.ctx.fillRect(300, 400, 200, 100)

      // TODO: expose SVG canvas/context type information
      const primary_svg = (canvas_view.primary.ctx as any).get_serialized_svg(true)
      expect(primary_svg).to.be.equal(`\
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="600" height="600">\
<defs/>\
<g transform="scale(1,1) translate(0.5,0.5)">\
<rect fill="blue" stroke="none" x="100" y="200" width="300" height="400"/>\
</g>\
</svg>\
`)

      const overlays_svg = (canvas_view.overlays.ctx as any).get_serialized_svg(true)
      expect(overlays_svg).to.be.equal(`\
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="600" height="600">\
<defs/>\
<g transform="scale(1,1) translate(0.5,0.5)">\
<rect fill="green" stroke="none" x="300" y="400" width="200" height="100"/>\
</g>\
</svg>\
`)

      const composite_layer = canvas_view.compose()
      const composite_svg = (composite_layer.ctx as any).get_serialized_svg(true)
      expect(composite_svg).to.be.equal(`\
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="600" height="600">\
<defs/>\
<g>\
<g transform="scale(1,1) translate(0.5,0.5) translate(0, 0)">\
<rect fill="blue" stroke="none" x="100" y="200" width="300" height="400"/>\
</g>\
<g transform="scale(1,1) translate(0.5,0.5) translate(0, 0)">\
<rect fill="green" stroke="none" x="300" y="400" width="200" height="100"/>\
</g>\
</g>\
</svg>\
`)
    })
  })
})
