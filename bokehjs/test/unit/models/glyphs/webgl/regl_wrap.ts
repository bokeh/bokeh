import {expect} from "#framework/assertions"

import {ReglWrapper} from "@bokehjs/models/glyphs/webgl/regl_wrap"
import type {BoundingBox} from "regl"

function make_wrapper(
  viewport: BoundingBox = {x: 0, y: 0, width: 400, height: 300},
  scissor: BoundingBox = {x: 20, y: 30, width: 300, height: 200},
): ReglWrapper {
  const wrapper = Object.create(ReglWrapper.prototype) as ReglWrapper
  const state = wrapper as unknown as {
    _viewport: BoundingBox
    _scissor: BoundingBox
    _scale_x: number
    _scale_y: number
  }
  state._viewport = viewport
  state._scissor = scissor
  state._scale_x = 1
  state._scale_y = 1
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

  it("should convert frame scissors and point scissors under a clamped viewport", () => {
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 32
    const gl = canvas.getContext("webgl")!
    const wrapper = new ReglWrapper(gl)

    // Clamped viewport: requested 128x64, actual 64x32 -> scale_x = 0.5, scale_y = 0.5
    wrapper.clear(128, 64)
    expect(wrapper.viewport).to.be.equal({x: 0, y: 0, width: 64, height: 32})

    // Frame scissor: requested [10, 8, 100, 40] -> scaled to [5, 4, 50, 20]
    wrapper.set_scissor(10, 8, 100, 40)
    expect(wrapper.scissor).to.be.equal({x: 5, y: 4, width: 50, height: 20})

    // Point scissor near bottom (screen y near 60 in requested 64 height)
    // Points [10, 40, 50, 60] with padding 2, pixel_ratio 1
    // X: left = floor((10-2)*0.5) = 4, right = ceil((50+2)*0.5) = 26 -> width = 22
    // Y: bottom = floor(32 - (60+2)*0.5) = 1, top = ceil(32 - (40-2)*0.5) = 13 -> height = 12
    // Clipped to frame scissor [5, 4, 50, 20]:
    // sx0 = max(5, 4) = 5, sx1 = min(55, 26) = 26 -> width = 21
    // sy0 = max(4, 1) = 4, sy1 = min(24, 13) = 13 -> height = 9
    expect(wrapper.scissor_for_points([10, 40, 50, 60], 2, 1)).to.be.equal({
      x: 5, y: 4, width: 21, height: 9,
    })
  })

  it("should support independent X and Y scaling with asymmetric clamping", () => {
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 32
    const gl = canvas.getContext("webgl")!
    const wrapper = new ReglWrapper(gl)

    // X is unclamped (64 -> 64, scale_x = 1), Y is clamped (64 -> 32, scale_y = 0.5)
    wrapper.clear(64, 64)
    expect(wrapper.viewport).to.be.equal({x: 0, y: 0, width: 64, height: 32})

    wrapper.set_scissor(5, 10, 50, 40)
    expect(wrapper.scissor).to.be.equal({x: 5, y: 5, width: 50, height: 20})

    // Points [10, 40, 50, 60] with padding 2, pixel_ratio 1
    // X: left = floor((10-2)*1) = 8, right = ceil((50+2)*1) = 52
    // Y: bottom = floor(32 - (60+2)*0.5) = 1, top = ceil(32 - (40-2)*0.5) = 13
    // Clipped to frame scissor [5, 5, 50, 20] (bounds [5..55, 5..25]):
    // sx0 = max(5, 8) = 8, sx1 = min(55, 52) = 52 -> width = 44
    // sy0 = max(5, 1) = 5, sy1 = min(25, 13) = 13 -> height = 8
    expect(wrapper.scissor_for_points([10, 40, 50, 60], 2, 1)).to.be.equal({
      x: 8, y: 5, width: 44, height: 8,
    })
  })

  it("should handle zero-width and zero-height safely without NaN or infinite scales", () => {
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 32
    const gl = canvas.getContext("webgl")!
    const wrapper = new ReglWrapper(gl)

    for (const [w, h] of [[0, 0], [0, 32], [64, 0]]) {
      wrapper.clear(w, h)
      expect(wrapper.viewport).to.be.equal({x: 0, y: 0, width: Math.min(w, 64), height: Math.min(h, 32)})
      wrapper.set_scissor(0, 0, w, h)
      expect(wrapper.scissor.width).to.be.equal(w === 0 ? 0 : Math.min(w, 64))
      expect(wrapper.scissor.height).to.be.equal(h === 0 ? 0 : Math.min(h, 32))
      const pts_scissor = wrapper.scissor_for_points([10, 20], 1, 1)
      expect(Number.isFinite(pts_scissor.x)).to.be.true
      expect(Number.isFinite(pts_scissor.y)).to.be.true
      expect((pts_scissor.width ?? 0) * (pts_scissor.height ?? 0)).to.be.equal(0)
    }
  })

  it("should round outward with fractional DPR and fractional viewport scaling", () => {
    const canvas = document.createElement("canvas")
    canvas.width = 75
    canvas.height = 50
    const gl = canvas.getContext("webgl")!
    const wrapper = new ReglWrapper(gl)

    // Requested 100x100 -> scale_x = 0.75, scale_y = 0.5
    wrapper.clear(100, 100)
    expect(wrapper.viewport).to.be.equal({x: 0, y: 0, width: 75, height: 50})
    wrapper.set_scissor(5, 5, 90, 90)
    // Scaled frame scissor:
    // x0 = floor(5*0.75) = 3, x1 = ceil(95*0.75) = 72 -> width = 69
    // y0 = floor(5*0.5) = 2, y1 = ceil(95*0.5) = 48 -> height = 46
    expect(wrapper.scissor).to.be.equal({x: 3, y: 2, width: 69, height: 46})

    // Points with fractional coords and padding 1.5, DPR 1.5:
    // x0 = 10.25, y0 = 20.5, x1 = 30.75, y1 = 40.25
    // X: left = floor((10.25 - 1.5) * 1.5 * 0.75) = floor(9.84375) = 9
    //    right = ceil((30.75 + 1.5) * 1.5 * 0.75) = ceil(36.28125) = 37
    // Y: bottom = floor(50 - (40.25 + 1.5) * 1.5 * 0.5) = floor(50 - 31.3125) = 18
    //    top = ceil(50 - (20.5 - 1.5) * 1.5 * 0.5) = ceil(50 - 14.25) = 36
    // Frame scissor clip [3, 2, 69, 46] covers [3..72, 2..48], containing [9..37, 18..36]
    expect(wrapper.scissor_for_points([10.25, 20.5, 30.75, 40.25], 1.5, 1.5)).to.be.equal({
      x: 9, y: 18, width: 28, height: 18,
    })
  })
})
