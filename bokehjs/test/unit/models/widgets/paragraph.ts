import {expect} from "assertions"

import {Paragraph} from "@bokehjs/models/widgets/paragraph"
import {build_view} from "@bokehjs/core/build_views"

describe("Paragraph.View render", () => {

  it("should set the margin to 0", async () => {
    const p = new Paragraph()
    const pv = (await build_view(p)).build()

    const el = pv.el.querySelector<HTMLElement>("p")!
    expect(el.style.cssText.includes("margin: 0px;")).to.be.true
    // TODO: expect(getComputedStyle(el).margin).to.be.equal("0px")
  })
})
