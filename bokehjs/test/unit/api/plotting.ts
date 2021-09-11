import {expect} from "assertions"

import {figure} from "@bokehjs/api/plotting"

describe("in api/plotting module", () => {
  describe("figure()", () => {
    it("should throw if multiple legend_* attributes are provided", () => {
      expect(() => figure().circle(0, 0, {legend_label: "circle", legend_field: "circle"})).to.throw()
    })
  })
})
