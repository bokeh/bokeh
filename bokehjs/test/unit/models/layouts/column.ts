import {expect} from "assertions"

import {Column} from "@bokehjs/models/layouts/column"

describe("Column", () => {
  it("should have empty children after initialization", () => {
    const c = new Column()
    expect(c.children).to.be.empty
  })
})
