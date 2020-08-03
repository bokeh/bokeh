import {expect} from "assertions"

import {create_glyph_view} from "./glyph_utils"
import {ImageRGBA} from "@bokehjs/models/glyphs/image_rgba"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {NumberArray} from '@bokehjs/core/types'

describe("ImageRGBA module", () => {

  describe("ImageRGBAView", () => {

    it("`_map_data` should correctly map data if w and h units are 'data'", async () => {
      const image_rgba = new ImageRGBA({image: {field: "image"}})
      image_rgba.x = 0
      image_rgba.y = 0
      image_rgba.dw = 17
      image_rgba.dh = 19

      const data = {image: [ndarray([1, 2, 3, 4], {dtype: "uint32", shape: [2, 2]})]}
      const image_rgba_view = await create_glyph_view(image_rgba, data)
      image_rgba_view.map_data()

      expect(image_rgba_view.sw).to.be.equal(new NumberArray([34]))
      expect(image_rgba_view.sh).to.be.equal(new NumberArray([38]))
    })

    it("`_map_data` should correctly map data if w and h units are 'screen'", async () => {
      const image_rgba = new ImageRGBA({image: {field: "image"}})
      image_rgba.x = 0
      image_rgba.y = 0
      image_rgba.dw = 1
      image_rgba.dh = 2
      image_rgba.properties.dw.units = "screen"
      image_rgba.properties.dh.units = "screen"

      const data = {image: [ndarray([1, 2, 3, 4], {dtype: "uint32", shape: [2, 2]})]}
      const image_rgba_view = await create_glyph_view(image_rgba, data)
      image_rgba_view.map_data()

      expect(image_rgba_view.sw).to.be.equal(new NumberArray([1]))
      expect(image_rgba_view.sh).to.be.equal(new NumberArray([2]))
    })
  })
})
