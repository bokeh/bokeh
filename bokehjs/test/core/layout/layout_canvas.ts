import {expect} from "chai"

import {LayoutCanvas} from "core/layout/layout_canvas"
import {Variable} from "core/layout/solver"

class SomeLayoutCanvas extends LayoutCanvas {}

describe("LayoutCanvas", () => {

  it("should get new variables on initialize", () => {
    const c = new SomeLayoutCanvas()
    expect(c).to.have.property('_top')
    expect(c).to.have.property('_left')
    expect(c).to.have.property('_width')
    expect(c).to.have.property('_height')
    expect(c._top).to.be.an.instanceOf(Variable)
    expect(c._left).to.be.an.instanceOf(Variable)
    expect(c._width).to.be.an.instanceOf(Variable)
    expect(c._height).to.be.an.instanceOf(Variable)
  })
})
