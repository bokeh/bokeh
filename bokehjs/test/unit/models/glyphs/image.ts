import {expect} from "assertions"

import {create_glyph_view} from "./glyph_utils"
import {Image} from "@bokehjs/models/glyphs/image"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {NumberArray} from '@bokehjs/core/types'

describe("Image module", () => {

  describe("ImageView", () => {

    it("`_map_data` should correctly map data if w and h units are 'data'", async () => {
      const image = new Image({image: {field: "image"}})
      image.x = 0
      image.y = 0
      image.dw = 17
      image.dh = 19

      const data = {image: [ndarray([1, 2, 3, 4], {dtype: "uint32", shape: [2, 2]})]}
      const image_view = await create_glyph_view(image, data)
      image_view.map_data()

      expect(image_view.sw).to.be.equal(new NumberArray([34]))
      expect(image_view.sh).to.be.equal(new NumberArray([38]))
    })

    it("`_map_data` should correctly map data if w and h units are 'screen'", async () => {
      const image = new Image({image: {field: "image"}})
      image.x = 0
      image.y = 0
      image.dw = 1
      image.dh = 2
      image.properties.dw.units = "screen"
      image.properties.dh.units = "screen"

      const data = {image: [ndarray([1, 2, 3, 4], {dtype: "uint32", shape: [2, 2]})]}
      const image_view = await create_glyph_view(image, data)
      image_view.map_data()

      expect(image_view.sw).to.be.equal(new NumberArray([1]))
      expect(image_view.sh).to.be.equal(new NumberArray([2]))
    })
  })
})
