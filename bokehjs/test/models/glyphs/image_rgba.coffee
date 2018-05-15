{expect} = require "chai"
sinon = require "sinon"

{create_glyph_view} = require("./glyph_utils")
{ImageRGBA, ImageRGBAView} = require('models/glyphs/image_rgba')

describe "ImageRGBA module", ->

  describe "ImageRGBAView", ->

    afterEach ->
      @stub.restore()

    beforeEach ->
      @stub = sinon.stub(ImageRGBAView.prototype, '_set_data')

      @image_rgba = new ImageRGBA()

    it "`_map_data` should correctly map data if w and h units are 'data'", ->
      # ImageView._map_data is called by ImageView.map_data
      @image_rgba.dw = 100
      @image_rgba.dh = 200
      image_rgba_view = create_glyph_view(@image_rgba)

      image_rgba_view.map_data()
      # sw and sh will be equal to zero because the scale state isn't complete
      # this is ok - it just shouldn't be equal to the initial values
      expect(image_rgba_view.sw).to.be.deep.equal(Float64Array.of(0))
      expect(image_rgba_view.sh).to.be.deep.equal(Float64Array.of(0))

    it "`_map_data` should correctly map data if w and h units are 'screen'", ->
      # ImageView._map_data is called by ImageView.map_data
      @image_rgba.dw = 100
      @image_rgba.dh = 200
      @image_rgba.properties.dw.units = "screen"
      @image_rgba.properties.dh.units = "screen"
      image_rgba_view = create_glyph_view(@image_rgba)

      image_rgba_view.map_data()
      expect(image_rgba_view.sw).to.be.deep.equal([100])
      expect(image_rgba_view.sh).to.be.deep.equal([200])
