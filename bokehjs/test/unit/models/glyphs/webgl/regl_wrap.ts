import {expect} from "#framework/assertions"

import {ReglWrapper} from "@bokehjs/models/glyphs/webgl/regl_wrap"
import type {BoundingBox} from "regl"

describe("ReglWrapper", () => {
  it("should bound and frame-clip line accumulation scissors", () => {
    const wrapper = Object.create(ReglWrapper.prototype) as ReglWrapper
    const state = wrapper as unknown as {_viewport: BoundingBox, _scissor: BoundingBox}
    state._viewport = {x: 0, y: 0, width: 400, height: 300}
    state._scissor = {x: 20, y: 30, width: 300, height: 200}

    expect(wrapper.scissor_for_points([10, 20, 50, 80], 2, 2)).to.be.equal({
      x: 20, y: 136, width: 84, height: 94,
    })
  })

  it("should return an empty scissor for missing points", () => {
    const wrapper = Object.create(ReglWrapper.prototype) as ReglWrapper
    const state = wrapper as unknown as {_viewport: BoundingBox, _scissor: BoundingBox}
    state._viewport = {x: 0, y: 0, width: 400, height: 300}
    state._scissor = {x: 20, y: 30, width: 300, height: 200}

    expect(wrapper.scissor_for_points([NaN, NaN], 2, 2)).to.be.equal({
      x: 20, y: 30, width: 0, height: 0,
    })
  })
})
