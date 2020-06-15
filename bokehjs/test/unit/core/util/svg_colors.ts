import {expect} from "assertions"

import {svg_colors} from "@bokehjs/core/util/svg_colors"

describe("svg_color module", () => {

  it("should have size = 147", () => {
    expect(Object.keys(svg_colors).length).to.be.equal(147)
  })
})
