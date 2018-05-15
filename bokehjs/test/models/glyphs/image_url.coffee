{expect} = require "chai"

{create_glyph_view} = require("./glyph_utils")
{ImageURL} = require('models/glyphs/image_url')

describe "ImageURL module", ->

  describe "ImageURL Model", ->

    describe "Default creation", ->
      r = new ImageURL()

      it "should have global_alpha=1.0", ->
        expect(r.global_alpha).to.be.equal 1.0

      it "should have retry_attempts=0", ->
        expect(r.retry_attempts).to.be.equal 0

      it "should have retry_timeout=0", ->
        expect(r.retry_timeout).to.be.equal 0

  describe "ImageURLView", ->

    beforeEach ->
      @image_url = new ImageURL()

    it "`_set_data` should correctly set Image src", ->
      # ImageURLView._set_data is called during GlyphRendererView.initialize
      @image_url.url = "image.jpg"
      image_url_view = create_glyph_view(@image_url)

      image = image_url_view.image[0]
      expect(image).to.be.instanceof(Object)
      expect(image.src).to.be.equal("image.jpg")

    it "`_map_data` should correctly map data if w and h units are 'data'", ->
      # ImageURLView._map_data is called by ImageURLView.map_data
      @image_url.w = 100
      @image_url.h = 200
      image_url_view = create_glyph_view(@image_url)

      image_url_view.map_data()
      # sw and sh will be equal to zero because the scale state isn't complete
      # this is ok - it just shouldn't be equal to the initial values
      expect(image_url_view.sw).to.be.deep.equal(Float64Array.of(0))
      expect(image_url_view.sh).to.be.deep.equal(Float64Array.of(0))

    it "`_map_data` should correctly map data if w and h units are 'screen'", ->
      # ImageURLView._map_data is called by ImageURLView.map_data
      @image_url.w = 100
      @image_url.h = 200
      @image_url.properties.w.units = "screen"
      @image_url.properties.h.units = "screen"
      image_url_view = create_glyph_view(@image_url)

      image_url_view.map_data()
      expect(image_url_view.sw).to.be.deep.equal([100])
      expect(image_url_view.sh).to.be.deep.equal([200])

    it "`_map_data` should map data to NaN if w and h are null, regardless of units", ->
      # if sw, sh are NaN, then the image width or height are used during render
      @image_url.w = null
      @image_url.h = null

      image_url_view = create_glyph_view(@image_url)
      image_url_view.map_data()
      expect(image_url_view.sw).to.be.deep.equal(Float64Array.of(NaN))
      expect(image_url_view.sh).to.be.deep.equal(Float64Array.of(NaN))

      @image_url.properties.w.units = "screen"
      @image_url.properties.h.units = "screen"
      image_url_view = create_glyph_view(@image_url)
      image_url_view.map_data()
      expect(image_url_view.sw).to.be.deep.equal([NaN])
      expect(image_url_view.sh).to.be.deep.equal([NaN])
