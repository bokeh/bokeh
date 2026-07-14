import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import {Row} from "@bokehjs/models/layouts/row"

describe("Row", () => {
  it("should have empty children after initialization", () => {
    const r = new Row()
    expect(r.children).to.be.empty
  })

  it("should update spacing after initialization", async () => {
    const r = new Row({spacing: 5, width: 100, height: 100})
    const {view} = await display(r, [150, 150])

    expect(getComputedStyle(view.el).gap).to.be.equal("5px")

    r.spacing = 20
    await view.ready

    expect(getComputedStyle(view.el).gap).to.be.equal("20px")
  })
})
