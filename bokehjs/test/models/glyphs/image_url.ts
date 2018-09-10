import {expect} from "chai"

import {create_glyph_view} from "./glyph_utils"
import {ImageURL} from "models/glyphs/image_url"

describe("ImageURL module", () => {

  describe("ImageURL Model", () => {

    describe("Default creation", () => {
      const image_url = new ImageURL()

      it("should have global_alpha=1.0", () => {
        expect(image_url.global_alpha).to.be.equal(1.0)
      })

      it("should have retry_attempts=0", () => {
        expect(image_url.retry_attempts).to.be.equal(0)
      })

      it("should have retry_timeout=0", () => {
        expect(image_url.retry_timeout).to.be.equal(0)
      })
    })
  })

  describe("ImageURLView", () => {

    it("`_set_data` should correctly set Image src", () => {
      // ImageURLView._set_data is called during GlyphRendererView.initialize
      const image_url = new ImageURL()
      image_url.url = "image.jpg"

      const image_url_view = create_glyph_view(image_url)

      const image = image_url_view.image[0]
      expect(image).to.be.instanceof(Object)
      expect(image!.src).to.be.equal("image.jpg") // XXX: null
    })

    it("`_map_data` should correctly map data if w and h units are 'data'", () => {
      // ImageURLView._map_data is called by ImageURLView.map_data
      const image_url = new ImageURL()
      image_url.w = 1
      image_url.h = 2

      const image_url_view = create_glyph_view(image_url)
      image_url_view.map_data()

      expect(image_url_view.sw).to.be.deep.equal(Float64Array.of(565))
      expect(image_url_view.sh).to.be.deep.equal(Float64Array.of(1180))
    })

    it("`_map_data` should correctly map data if w and h units are 'screen'", () => {
      // ImageURLView._map_data is called by ImageURLView.map_data
      const image_url = new ImageURL()
      image_url.w = 1
      image_url.h = 2
      image_url.properties.w.units = "screen"
      image_url.properties.h.units = "screen"

      const image_url_view = create_glyph_view(image_url)
      image_url_view.map_data()

      expect(image_url_view.sw).to.be.deep.equal([1])
      expect(image_url_view.sh).to.be.deep.equal([2])
    })

    it("`_map_data` should map data to NaN if w and h are null, 'data' units", () => {
      // if sw, sh are NaN, then the image width or height are used during render
      const image_url = new ImageURL()
      image_url.w = null as any // XXX
      image_url.h = null as any // XXX

      const image_url_view = create_glyph_view(image_url)
      image_url_view.map_data()

      expect(image_url_view.sw).to.be.deep.equal(Float64Array.of(NaN))
      expect(image_url_view.sh).to.be.deep.equal(Float64Array.of(NaN))
    })

    it("`_map_data` should map data to NaN if w and h are null, 'screen' units", () => {
      const image_url = new ImageURL()
      image_url.w = null as any // XXX
      image_url.h = null as any // XXX
      image_url.properties.w.units = "screen"
      image_url.properties.h.units = "screen"

      const image_url_view = create_glyph_view(image_url)
      image_url_view.map_data()

      expect(image_url_view.sw).to.be.deep.equal([NaN])
      expect(image_url_view.sh).to.be.deep.equal([NaN])
    })
  })
})
