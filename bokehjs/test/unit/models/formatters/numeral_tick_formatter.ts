import {expect} from "assertions"

import {NumeralTickFormatter} from "@bokehjs/models/formatters/numeral_tick_formatter"

describe("numeral_tick_formatter module", () => {

  it("should round numbers appropriately", () => {
    const obj = new NumeralTickFormatter({format: "0.00"})
    const labels = obj.doFormat([0.1, 0.01, 0.001, 0.009], {loc: 0})
    expect(labels).to.be.equal(["0.10", "0.01", "0.00", "0.01"])
  })
})
