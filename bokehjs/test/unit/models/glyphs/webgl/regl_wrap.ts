import {expect} from "#framework/assertions"

import {ReglWrapper} from "@bokehjs/models/glyphs/webgl/regl_wrap"
import type {BoundingBox} from "regl"

function make_wrapper(
  viewport: BoundingBox = {x: 0, y: 0, width: 400, height: 300},
  scissor: BoundingBox = {x: 20, y: 30, width: 300, height: 200},
): ReglWrapper {
  const wrapper = Object.create(ReglWrapper.prototype) as ReglWrapper
  const state = wrapper as unknown as {_viewport: BoundingBox, _scissor: BoundingBox}
  state._viewport = viewport
  state._scissor = scissor
  return wrapper
}

describe("ReglWrapper", () => {
  it("should clear only its viewport and bound it by the drawing buffer", () => {
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 32
    const gl = canvas.getContext("webgl")!
    gl.clearColor(1, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    const wrapper = new ReglWrapper(gl)

    function pixel(x: number, y: number): number[] {
      const data = new Uint8Array(4)
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data)
      return [...data]
    }

    wrapper.clear(16, 8)
    expect(wrapper.viewport).to.be.equal({x: 0, y: 0, width: 16, height: 8})
    expect(pixel(15, 7)).to.be.equal([0, 0, 0, 0])
    expect(pixel(16, 7)).to.be.equal([255, 0, 0, 255])
    expect(pixel(15, 8)).to.be.equal([255, 0, 0, 255])

    wrapper.clear(gl.getParameter(gl.MAX_TEXTURE_SIZE) + 1, 8)
    expect(wrapper.viewport).to.be.equal({x: 0, y: 0, width: 64, height: 8})
    const [, texture] = wrapper.framebuffer_and_texture
    expect([texture.width, texture.height]).to.be.equal([64, 8])
    expect(gl.getError()).to.be.equal(gl.NO_ERROR)
  })

  it("should bound and frame-clip a partly out-of-frame ring", () => {
    const wrapper = make_wrapper()

    expect(wrapper.scissor_for_points([10, 20, 50, 80], 2, 2)).to.be.equal({
      x: 20, y: 136, width: 84, height: 94,
    })
  })

  it("should return a zero-area scissor for a fully out-of-frame ring", () => {
    const wrapper = make_wrapper()

    expect(wrapper.scissor_for_points([-20, 40, -10, 50], 2, 2)).to.be.equal({
      x: 20, y: 196, width: 0, height: 28,
    })
  })

  it("should ignore non-finite point pairs when finite points remain", () => {
    const wrapper = make_wrapper()

    const points = [NaN, 80, 30, 80, Infinity, 90, 50, 100, 70, -Infinity]
    expect(wrapper.scissor_for_points(points, 0, 1)).to.be.equal({
      x: 30, y: 200, width: 20, height: 20,
    })
  })

  it("should return an empty scissor without finite point pairs", () => {
    const wrapper = make_wrapper()

    expect(wrapper.scissor_for_points([NaN, 80, Infinity, 90, 70, -Infinity], 2, 2)).to.be.equal({
      x: 20, y: 30, width: 0, height: 0,
    })
  })

  it("should round outward at fractional device pixel ratios", () => {
    const wrapper = make_wrapper(
      {x: 0, y: 0, width: 600, height: 450},
      {x: 0, y: 0, width: 600, height: 450},
    )

    expect(wrapper.scissor_for_points([30.25, 40.25, 50.75, 80.75], 1.5, 1.5)).to.be.equal({
      x: 43, y: 326, width: 36, height: 66,
    })
  })
})
