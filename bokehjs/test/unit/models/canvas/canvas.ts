import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import {Canvas, once_async} from "@bokehjs/models/canvas/canvas"
import type {SVGRenderingContext2D} from "@bokehjs/core/util/svg"
import {BBox} from "@bokehjs/core/util/bbox"

describe("Canvas", () => {
  it("should share in-flight asynchronous initialization", async () => {
    const resource = {}
    let calls = 0
    let resolve: (value: object) => void = () => {}
    const initialize = once_async(() => {
      calls++
      return new Promise<object>((_resolve) => resolve = _resolve)
    })

    const pending0 = initialize()
    const pending1 = initialize()
    expect(pending0 === pending1).to.be.true
    expect(calls).to.be.equal(1)

    resolve(resource)
    expect(await pending0).to.be.equal(resource)
    expect(await initialize()).to.be.equal(resource)
    expect(calls).to.be.equal(1)
  })

  it("should retry asynchronous initialization after rejection", async () => {
    let calls = 0
    const initialize = once_async(async () => {
      calls++
      if (calls == 1) {
        throw new Error("initialization failed")
      }
      return "initialized"
    })

    let rejected = false
    try {
      await initialize()
    } catch {
      rejected = true
    }
    expect(rejected).to.be.true
    expect(await initialize()).to.be.equal("initialized")
    expect(calls).to.be.equal(2)
  })

  describe("should support composing layers", () => {
    it.dpr(1)("with devicePixelRatio == 1", async () => {
      const canvas = new Canvas({output_backend: "canvas", hidpi: true, styles: {width: "600px", height: "600px"}})
      const {view: canvas_view} = await display(canvas, [650, 650])
      expect(canvas_view.pixel_ratio).to.be.equal(1)
      const composite_layer = canvas_view.compose()
      expect(composite_layer.ctx.canvas.width).to.be.equal(600)
      expect(composite_layer.ctx.canvas.height).to.be.equal(600)
    })

    it.dpr(2)("with devicePixelRatio == 2", async () => {
      const canvas = new Canvas({output_backend: "canvas", hidpi: true, styles: {width: "600px", height: "600px"}})
      const {view: canvas_view} = await display(canvas, [650, 650])
      expect(canvas_view.pixel_ratio).to.be.equal(2)
      const composite_layer = canvas_view.compose()
      expect(composite_layer.ctx.canvas.width).to.be.equal(1200)
      expect(composite_layer.ctx.canvas.height).to.be.equal(1200)
    })

    it.dpr(3)("with devicePixelRatio == 3", async () => {
      const canvas = new Canvas({output_backend: "canvas", hidpi: true, styles: {width: "600px", height: "600px"}})
      const {view: canvas_view} = await display(canvas, [650, 650])
      expect(canvas_view.pixel_ratio).to.be.equal(3)
      const composite_layer = canvas_view.compose()
      expect(composite_layer.ctx.canvas.width).to.be.equal(1800)
      expect(composite_layer.ctx.canvas.height).to.be.equal(1800)
    })

    it("with SVG backend", async () => {
      const canvas = new Canvas({output_backend: "svg", hidpi: true, styles: {width: "600px", height: "600px"}})
      const {view: canvas_view} = await display(canvas, [650, 650])

      canvas_view.primary.prepare()
      canvas_view.overlays.prepare()

      canvas_view.primary.ctx.fillStyle = "blue"
      canvas_view.primary.ctx.fillRect(100, 200, 300, 400)

      canvas_view.overlays.ctx.fillStyle = "green"
      canvas_view.overlays.ctx.fillRect(300, 400, 200, 100)

      // TODO: expose SVG canvas/context type information
      const primary_svg = (canvas_view.primary.ctx as any as SVGRenderingContext2D).get_serialized_svg(true)
      expect(primary_svg).to.be.equal('\
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="600" height="600">\
<defs/>\
<path fill="blue" stroke="none" paint-order="stroke" d="M 100.5 200.5 L 400.5 200.5 L 400.5 600.5 L 100.5 600.5 L 100.5 200.5 Z"/>\
</svg>\
')

      const overlays_svg = (canvas_view.overlays.ctx as any as SVGRenderingContext2D).get_serialized_svg(true)
      expect(overlays_svg).to.be.equal('\
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="600" height="600">\
<defs/>\
<path fill="green" stroke="none" paint-order="stroke" d="M 300.5 400.5 L 500.5 400.5 L 500.5 500.5 L 300.5 500.5 L 300.5 400.5 Z"/>\
</svg>\
')

      const composite_layer = canvas_view.compose()
      const composite_svg = (composite_layer.ctx as any as SVGRenderingContext2D).get_serialized_svg(true)
      expect(composite_svg).to.be.equal('\
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="600" height="600">\
<defs/>\
<path fill="blue" stroke="none" paint-order="stroke" d="M 100.5 200.5 L 400.5 200.5 L 400.5 600.5 L 100.5 600.5 L 100.5 200.5 Z"/>\
<path fill="green" stroke="none" paint-order="stroke" d="M 300.5 400.5 L 500.5 400.5 L 500.5 500.5 L 300.5 500.5 L 300.5 400.5 Z"/>\
</svg>\
')
    })
  })

  it("should floor CSS width and height when computing dimensions of canvas element", async () => {
    const canvas = new Canvas({output_backend: "canvas", styles: {width: "300.5px", height: "300.5px"}})
    const {view: canvas_view} = await display(canvas, [350, 350])
    expect(canvas_view.bbox).to.be.equal(new BBox({x: 0, y: 0, width: 300, height: 300}))

    for (const layer of canvas_view.layers) {
      const el = layer instanceof HTMLElement ? layer : layer.el

      const {width, height} = getComputedStyle(el)
      expect([width, height]).to.be.equal(["300px", "300px"])
    }
  })
})
