import {expect} from "assertions"

import {create_glyph_view} from "./glyph_utils"
import {Ray} from "@bokehjs/models/glyphs/ray"
import {SpatialUnits} from "@bokehjs/core/enums"
import {NumberArray} from '@bokehjs/core/types'

describe("Ray", () => {

  describe("RayView", () => {
    function make_glyph(units: SpatialUnits): Ray {
      return new Ray({
        x: {field: "x"},
        y: {field: "y"},
        length: {value: 10, units},
      })
    }

    it("`_map_data` should correctly map data if length units are 'data'", async () => {
      for (const angle of [0, 1, 2, 3]) {
        const glyph = make_glyph("data")

        const data = {x: [1], y: [2], angle: [angle], length: [10]}
        const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})
        glyph_view.map_data()

        expect(glyph_view.slength).to.be.equal(new NumberArray([20]))
      }
    })

    it("`_map_data` should correctly map data if length units are 'screen'", async () => {
      for (const angle of [0, 1, 2, 3]) {
        const glyph = make_glyph("screen")

        const data = {x: [1], y: [2], angle: [angle], length: [10]}
        const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})
        glyph_view.map_data()

        expect(glyph_view.slength).to.be.equal(new NumberArray([10]))
      }
    })
  })
})
