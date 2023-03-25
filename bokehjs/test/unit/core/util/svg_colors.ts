import {expect} from "assertions"

import {named_colors} from "@bokehjs/core/util/svg_colors"

describe("svg_color module", () => {

  it("should have size = 148", () => {
    expect(Object.keys(named_colors).length).to.be.equal(148)
  })
})
