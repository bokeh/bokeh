import {expect} from "assertions"

import {BasicTickFormatter} from "@bokehjs/models/formatters/basic_tick_formatter"

describe("BasicTickFormatter", () => {
  describe("doFormat method", () => {
    it("should increase automatic scientific precision for neighboring labels", () => {
      const formatter = new BasicTickFormatter()
      const labels = formatter.doFormat([1.00001e-5, 1.00002e-5, 1.00003e-5], {loc: 0})

      expect(new Set(labels).size).to.be.equal(labels.length)
      expect(labels).to.be.equal(["1.00001e−5", "1.00002e−5", "1.00003e−5"])
    })
  })
})
