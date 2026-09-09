import {expect} from "#framework/assertions"

import {Column} from "@bokehjs/models/layouts/column"

describe("Column", () => {
  it("should have empty children after initialization", () => {
    const c = Column.create()
    expect(c.children).to.be.empty
  })
})
