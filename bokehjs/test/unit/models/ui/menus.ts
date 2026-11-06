import {expect} from "#framework/assertions"

import {collapse_dividers} from "@bokehjs/models/ui/menus/divider_item"

describe("models/ui/menus module", () => {
  describe("collapse_dividers()", () => {
    const is_divider = (item: string | null) => item == null

    it("should keep dividers between items", () => {
      expect(collapse_dividers(["a", null, "b", null, "c"], is_divider)).to.be.equal(["a", null, "b", null, "c"])
    })

    it("should remove leading and trailing dividers", () => {
      expect(collapse_dividers([null, null, "a", "b", null], is_divider)).to.be.equal(["a", "b"])
    })

    it("should collapse consecutive dividers", () => {
      expect(collapse_dividers(["a", null, null, null, "b"], is_divider)).to.be.equal(["a", null, "b"])
    })

    it("should keep the first of consecutive dividers", () => {
      const d0 = {divider: 0}
      const d1 = {divider: 1}
      const items = ["a", d0, d1, "b"]
      const [, divider] = collapse_dividers(items, (item) => typeof item != "string")
      expect(divider).to.be.identical(d0)
    })

    it("should support no items or only dividers", () => {
      expect(collapse_dividers([], is_divider)).to.be.equal([])
      expect(collapse_dividers([null, null], is_divider)).to.be.equal([])
    })
  })
})
