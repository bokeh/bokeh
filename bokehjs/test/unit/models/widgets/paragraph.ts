import {expect, expect_not_null} from "#framework/assertions"
import {display} from "#framework/layouts"

import {Paragraph} from "@bokehjs/models/widgets/paragraph"

describe("Paragraph.View render", () => {

  it("should set the margin to 0", async () => {
    const p = Paragraph.create()
    const {view: pv} = await display(p, null)

    const el = pv.shadow_el.querySelector<HTMLElement>("p")
    expect_not_null(el)
    expect(getComputedStyle(el).margin).to.be.equal("0px")
  })
})
