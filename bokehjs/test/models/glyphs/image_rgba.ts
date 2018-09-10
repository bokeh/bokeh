import {expect} from "chai"
import * as sinon from "sinon"

import {create_glyph_view} from "./glyph_utils"
import {ImageRGBA, ImageRGBAView} from "models/glyphs/image_rgba"

describe("ImageRGBA module", () => {

  describe("ImageRGBAView", () => {

    let stub: any
    beforeEach(() => {
      stub = sinon.stub(ImageRGBAView.prototype as any, '_set_data') // XXX: protected
    })

    afterEach(() => {
      stub.restore()
    })

    it("`_map_data` should correctly map data if w and h units are 'data'", () => {
      // ImageView._map_data is called by ImageView.map_data
      const image_rgba = new ImageRGBA()
      image_rgba.dw = 1
      image_rgba.dh = 2

      const image_rgba_view = create_glyph_view(image_rgba)
      image_rgba_view.map_data()

      expect(image_rgba_view.sw).to.be.deep.equal(Float64Array.of(565))
      expect(image_rgba_view.sh).to.be.deep.equal(Float64Array.of(1180))
    })

    it("`_map_data` should correctly map data if w and h units are 'screen'", () => {
      // ImageView._map_data is called by ImageView.map_data
      const image_rgba = new ImageRGBA()
      image_rgba.dw = 1
      image_rgba.dh = 2
      image_rgba.properties.dw.units = "screen"
      image_rgba.properties.dh.units = "screen"

      const image_rgba_view = create_glyph_view(image_rgba)
      image_rgba_view.map_data()

      expect(image_rgba_view.sw).to.be.deep.equal([1])
      expect(image_rgba_view.sh).to.be.deep.equal([2])
    })
  })
})
