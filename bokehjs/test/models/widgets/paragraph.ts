import {expect} from "chai"

import {Paragraph} from "models/widgets/paragraph"

describe("Paragraph.View render", () => {

  it("should set the margin to 0", () => {
    const p = new Paragraph()
    const pv = new p.default_view({model: p, parent: null}).build()

    const el = pv.el.querySelector<HTMLElement>("p")
    expect(el!.style.cssText).to.contain("margin: 0px;")
  })
})
