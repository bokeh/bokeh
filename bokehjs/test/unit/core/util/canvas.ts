import {expect} from "#framework/assertions"

import {CanvasLayer} from "@bokehjs/core/util/canvas"

describe("CanvasLayer", () => {
  for (const hidpi of [false, true]) {
    for (const pixel_ratio of [1, 1.5, 2]) {
      it.dpr(pixel_ratio)(`should clear every pixel before repainting at devicePixelRatio=${pixel_ratio}, hidpi=${hidpi}`, () => {
        const layer = new CanvasLayer("canvas", hidpi)
        layer.resize(8, 6)

        const ctx = layer.prepare()
        ctx.fillStyle = "black"
        ctx.fillRect(-1, -1, 10, 8)
        layer.finish()
        expect(ctx.getImageData(0, 0, 1, 1).data[3]).to.be.equal(255)

        layer.prepare()
        const {data} = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height)
        expect(data.every((value) => value == 0)).to.be.true
        const {a, b, c, d, e, f} = ctx.getTransform()
        const expected = hidpi ? [pixel_ratio, 0, 0, pixel_ratio, pixel_ratio/2, pixel_ratio/2] : [1, 0, 0, 1, 0, 0]
        expect([a, b, c, d, e, f]).to.be.equal(expected)
        layer.finish()
      })
    }
  }

  it("should remove the previous SVG drawing before repainting", () => {
    const layer = new CanvasLayer("svg", true)
    layer.resize(8, 6)

    const ctx = layer.prepare()
    ctx.fillRect(0, 0, 4, 3)
    layer.finish()
    expect(layer.canvas.querySelectorAll("path").length).to.be.equal(1)

    layer.prepare()
    expect(layer.canvas.querySelectorAll("path").length).to.be.equal(0)
    ctx.fillRect(1, 1, 2, 2)
    layer.finish()
    expect(layer.canvas.querySelectorAll("path").length).to.be.equal(1)
  })
})
