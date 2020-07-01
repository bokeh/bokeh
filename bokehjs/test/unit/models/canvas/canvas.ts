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
  })
})
