{expect} = require "chai"
sinon = require "sinon"

{create_glyph_view} = require("./glyph_utils")
{Image, ImageView} = require('models/glyphs/image')

describe "Image module", ->

  describe "ImageView", ->

    afterEach ->
      @stub.restore()

    beforeEach ->
      @stub = sinon.stub(ImageView.prototype, '_set_data')

      @image = new Image()

    it "`_map_data` should correctly map data if w and h units are 'data'", ->
      # ImageView._map_data is called by ImageView.map_data
      @image.dw = 100
      @image.dh = 200
      image_view = create_glyph_view(@image)

      image_view.map_data()
      # sw and sh will be equal to zero because the scale state isn't complete
      # this is ok - it just shouldn't be equal to the initial values
      expect(image_view.sw).to.be.deep.equal(Float64Array.of(0))
      expect(image_view.sh).to.be.deep.equal(Float64Array.of(0))

    it "`_map_data` should correctly map data if w and h units are 'screen'", ->
      # ImageView._map_data is called by ImageView.map_data
      @image.dw = 100
      @image.dh = 200
      @image.properties.dw.units = "screen"
      @image.properties.dh.units = "screen"
      image_view = create_glyph_view(@image)

      image_view.map_data()
      expect(image_view.sw).to.be.deep.equal([100])
      expect(image_view.sh).to.be.deep.equal([200])
