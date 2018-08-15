import {expect} from "chai"

import {Layoutable, SizeHint} from "core/layout"

class SomeLayout extends Layoutable {
  size_hint(): SizeHint {
    return {width: 100, height: 50}
  }
}

describe("Layoutable", () => {

  it("should have layout variables zeroed after initialization", () => {
    const c = new SomeLayout()
    expect(c._left.value).to.be.equal(0)
    expect(c._right.value).to.be.equal(0)
    expect(c._top.value).to.be.equal(0)
    expect(c._bottom.value).to.be.equal(0)
    expect(c._width.value).to.be.equal(0)
    expect(c._height.value).to.be.equal(0)
  })
})
