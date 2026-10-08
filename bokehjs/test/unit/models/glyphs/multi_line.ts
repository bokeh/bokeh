import {expect} from "#framework/assertions"

import {create_glyph_view} from "./_util"
import {MultiLine} from "@bokehjs/models/glyphs/multi_line"

describe("MultiLine", () => {
  it("should materialize nested ISO date coordinates without changing source data", async () => {
    const xs = [["2024-01-01", "2024-01-02"]]
    const expected_xs = xs.map((line) => [...line])
    const glyph = MultiLine.create({xs: {field: "xs"}, ys: {field: "ys"}})
    const glyph_view = await create_glyph_view(glyph, {xs: xs as any, ys: [[1, 2]]})

    expect([...glyph_view.xs.get(0)]).to.be.equal([Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 2)])
    expect(glyph_view.renderer.model.data_source.get_array("xs")).to.be.equal(expected_xs)
  })
})
