import {expect} from "assertions"

import {NumeralTickFormatter} from "@bokehjs/models/formatters/numeral_tick_formatter"
import {build_view} from "@bokehjs/core/build_views"

describe("numeral_tick_formatter module", () => {

  it("should round numbers appropriately", async () => {
    const formatter = new NumeralTickFormatter({format: "0.00"})
    const formatter_view = await build_view(formatter)

    const labels = formatter_view.format([0.1, 0.01, 0.001, 0.009])
    expect(labels).to.be.equal(["0.10", "0.01", "0.00", "0.01"])
  })
})
