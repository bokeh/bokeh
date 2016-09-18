{expect} = require "chai"
utils = require "../../utils"

{create_glyph_view} = require("./glyph_utils")
ImageURL = utils.require('models/glyphs/image_url')

describe "ImageURL module", ->

  describe "ImageURL Model", ->

    describe "Default creation", ->
      r = new ImageURL.Model()

      it "should have global_alpha=1.0", ->
        expect(r.global_alpha).to.be.equal 1.0

      it "should have retry_attempts=0", ->
        expect(r.retry_attempts).to.be.equal 0

      it "should have retry_timeout=0", ->
        expect(r.retry_timeout).to.be.equal 0

  describe "ImageURLView", ->

    afterEach ->
      utils.unstub_canvas()
      utils.unstub_solver()

    beforeEach ->
      utils.stub_canvas()
      utils.stub_solver()
      @image_url = new ImageURL.Model()

    it "`_set_data` should correctly set Image src", ->
      # ImageURLView._set_data is called during GlyphRendererView.initialize
      @image_url.url = "image.jpg"
      image_url_view = create_glyph_view(@image_url)

      image = image_url_view.image[0]
      expect(image).to.be.instanceof(Object)
      expect(image.src).to.be.equal("file://image.jpg/")

    it "`_map_data` should correctly map data if w and h units are 'data'", ->
      # ImageURLView._map_data is called by ImageURLView.map_data
      @image_url.w = 100
      @image_url.h = 200
      image_url_view = create_glyph_view(@image_url)

      image_url_view.map_data()
      # sw and sh will be equal to zero because the mapper state isn't complete
      # this is ok - it just shouldn't be equal to the initial values
      expect(image_url_view.sw).to.be.deep.equal([0])
      expect(image_url_view.sh).to.be.deep.equal([0])

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
