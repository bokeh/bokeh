import {expect} from "assertions"
import {display} from "../../_util"

import {MultiSelect} from "@bokehjs/models/widgets/multiselect"

describe("MultiSelect", () => {

  it("view should reflect the initial options", async () => {
    const s = new MultiSelect({
      value: ["foo", "quux"],
      options: [["foo", "Foo"], ["bar", "BAR"],  ["baz", "bAz"], ["quux", "quux"]],
    })
    const {view: sv} = await display(s, null)

    const option0 = sv.shadow_el.querySelectorAll<HTMLOptionElement>('option[value="foo"]')
    expect(option0.length).to.be.equal(1)
    expect(option0[0].selected).to.be.true

    const option1 = sv.shadow_el.querySelectorAll<HTMLOptionElement>('option[value="bar"]')
    expect(option1.length).to.be.equal(1)
    expect(option1[0].selected).to.be.false

    const option2 = sv.shadow_el.querySelectorAll<HTMLOptionElement>('option[value="baz"]')
    expect(option2.length).to.be.equal(1)
    expect(option2[0].selected).to.be.false

    const option3 = sv.shadow_el.querySelectorAll<HTMLOptionElement>('option[value="quux"]')
    expect(option3.length).to.be.equal(1)
    expect(option3[0].selected).to.be.true
  })
})
