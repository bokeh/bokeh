import {expect} from "chai"
import * as sinon from "sinon"

import {create_glyph_view} from "./glyph_utils"
import {Image, ImageView} from "@bokehjs/models/glyphs/image"

describe("Image module", () => {

  describe("ImageView", () => {

    let stub: any
    before_each(() => {
      stub = sinon.stub(ImageView.prototype as any, '_set_data') // XXX: protected
    })

    after_each(() => {
      stub.restore()
    })

    it("`_map_data` should correctly map data if w and h units are 'data'", async () => {
      // ImageView._map_data is called by ImageView.map_data
      const image = new Image()
      image.dw = 1
      image.dh = 2

      const image_view = await create_glyph_view(image)
      image_view.map_data()

      expect(image_view.sw).to.be.deep.equal(Float64Array.of(565))
      expect(image_view.sh).to.be.deep.equal(Float64Array.of(1180))
    })

    it("`_map_data` should correctly map data if w and h units are 'screen'", async () => {
      // ImageView._map_data is called by ImageView.map_data
      const image = new Image()
      image.dw = 1
      image.dh = 2
      image.properties.dw.units = "screen"
      image.properties.dh.units = "screen"

      const image_view = await create_glyph_view(image)
      image_view.map_data()

      expect(image_view.sw).to.be.deep.equal([1])
      expect(image_view.sh).to.be.deep.equal([2])
    })
  })
})
