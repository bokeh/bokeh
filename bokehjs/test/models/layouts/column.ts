import {expect} from "chai"

import {Column} from "models/layouts/column"

describe("Column", () => {
  it("should have empty children after initialization", () => {
    const c = new Column()
    expect(c.children).to.be.empty
  })
})
