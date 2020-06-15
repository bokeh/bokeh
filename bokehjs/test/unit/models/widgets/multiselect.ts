import {expect} from "assertions"

import {MultiSelect} from "@bokehjs/models/widgets/multiselect"
import {build_view} from "@bokehjs/core/build_views"

describe("MultiSelect", () => {

  it("view should reflect the initial options", async () => {
    const s = new MultiSelect({
      value: ["foo", "quux"],
      options: [["foo", "Foo"], ["bar", "BAR"],  ["baz", "bAz"], ["quux", "quux"]],
    })
    const sv = (await build_view(s)).build()

    const option0 = sv.el.querySelectorAll<HTMLOptionElement>('option[value="foo"]')
    expect(option0.length).to.be.equal(1)
    expect(option0[0].selected).to.be.true

    const option1 = sv.el.querySelectorAll<HTMLOptionElement>('option[value="bar"]')
    expect(option1.length).to.be.equal(1)
    expect(option1[0].selected).to.be.false

    const option2 = sv.el.querySelectorAll<HTMLOptionElement>('option[value="baz"]')
    expect(option2.length).to.be.equal(1)
    expect(option2[0].selected).to.be.false

    const option3 = sv.el.querySelectorAll<HTMLOptionElement>('option[value="quux"]')
    expect(option3.length).to.be.equal(1)
    expect(option3[0].selected).to.be.true
  })
})
