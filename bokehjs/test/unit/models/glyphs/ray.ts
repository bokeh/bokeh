import {expect} from "chai"

import {create_glyph_view, set_scales} from "./glyph_utils"
import {Ray} from "@bokehjs/models/glyphs/ray"

describe("Ray", () => {

  describe("RayView", () => {
    let glyph: Ray

    before_each(() => {
      glyph = new Ray({
        x: {field: "x"},
        y: {field: "y"},
        length: {value: 10},
      })
    })

    it("`_map_data` should correctly map data if length units are 'data'", async () => {
      for (const angle of [0, 1, 2, 3]) {
        const data = {x: [1], y: [2], angle: [angle], length: [10]}
        const glyph_view = await create_glyph_view(glyph, data)

        glyph_view.model.properties.length.units = "data"

        set_scales(glyph_view, "linear")
        glyph_view.map_data()
        expect(glyph_view.slength).to.be.deep.equal(Float64Array.of(20))
      }
    })

    it("`_map_data` should correctly map data if length units are 'screen'", async () => {
      for (const angle of [0, 1, 2, 3]) {
        const data = {x: [1], y: [2], angle: [angle], length: [10]}
        const glyph_view = await create_glyph_view(glyph, data)

        glyph_view.model.properties.length.units = "screen"

        set_scales(glyph_view, "linear")
        glyph_view.map_data()
        expect(glyph_view.slength).to.be.deep.equal([10])
      }
    })

    it("`_map_data` should correctly map data if length units are 'data' and scale is reversed", async () => {
      for (const angle of [0, 1, 2, 3]) {
        const data = {x: [1], y: [2], angle: [angle], length: [10]}
        const glyph_view = await create_glyph_view(glyph, data)

        glyph_view.model.properties.length.units = "data"

        set_scales(glyph_view, "linear", true)
        glyph_view.map_data()
        expect(glyph_view.slength).to.be.deep.equal(Float64Array.of(20))
      }
    })

    it("`_map_data` should correctly map data if length units are 'screen' and scale is reversed", async () => {
      for (const angle of [0, 1, 2, 3]) {
        const data = {x: [1], y: [2], angle: [angle], length: [10]}
        const glyph_view = await create_glyph_view(glyph, data)

        glyph_view.model.properties.length.units = "screen"

        set_scales(glyph_view, "linear", true)
        glyph_view.map_data()
        expect(glyph_view.slength).to.be.deep.equal([10])
      }
    })
  })
})
