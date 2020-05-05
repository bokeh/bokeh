import {expect} from "assertions"

import {Layoutable, Size, SizeHint} from "@bokehjs/core/layout"

class SomeLayout extends Layoutable {
  _measure(_viewport: Size): SizeHint {
    return {width: 100, height: 50}
  }
}

describe("Layoutable", () => {

  it("should have layout variables zeroed after initialization", () => {
    const c = new SomeLayout()
    expect(c.bbox.left).to.be.equal(0)
    expect(c.bbox.right).to.be.equal(0)
    expect(c.bbox.top).to.be.equal(0)
    expect(c.bbox.bottom).to.be.equal(0)
    expect(c.bbox.width).to.be.equal(0)
    expect(c.bbox.height).to.be.equal(0)
  })
})
