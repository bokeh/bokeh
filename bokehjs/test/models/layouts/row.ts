import {expect} from "chai"

import {Row} from "models/layouts/row"

describe("Row", () => {
  it("should have empty children after initialization", () => {
    const r = new Row()
    expect(r.children).to.be.empty
  })
})
