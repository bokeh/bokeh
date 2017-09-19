{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{create_glyph_view} = require("./glyph_utils")
{Ray, RayView} = utils.require("models/glyphs/ray")
{LinearScale} = utils.require("models/scales/linear_scale")
{LogScale} = utils.require("models/scales/log_scale")
{Range1d} = utils.require("models/ranges/range1d")

describe "Ray", ->

  describe "RayView", ->

    afterEach ->
      utils.unstub_canvas()

    beforeEach ->
      utils.stub_canvas()

      @glyph = new Ray({
        x: {field: "x"}
        y: {field: "y"}
        length: {value: 10}
      })

      @set_scales = (glyph_view, type="linear") ->
        if type == "linear"
          scale = new LinearScale({
            source_range: new Range1d({start: 0, end: 100})
            target_range: new Range1d({start: 0, end: 200})
          })
        else if type == "reverse"
          scale = new LinearScale({
            source_range: new Range1d({start: 0, end: 100})
            target_range: new Range1d({start: 200, end: 0})
          })
        else if type == "log"
          scale = new LogScale({
            source_range: new Range1d({start: 1, end: 1000})
            target_range: new Range1d({start: 0, end: 200})
          })
        glyph_view.renderer.xscale = scale
        glyph_view.renderer.yscale = scale
        glyph_view.renderer.plot_view.frame.xscales['default'] = scale
        glyph_view.renderer.plot_view.frame.yscales['default'] = scale

    it "`_map_data` should correctly map data if length units are 'data'", ->
      for angle in [0,1,2,3]
        data = {x: [1], y: [2], length: [10]}
        glyph_view = create_glyph_view(@glyph, data)

        glyph_view.model.properties.length.units = "data"

        @set_scales(glyph_view)
        glyph_view.map_data()
        expect(glyph_view.slength).to.be.deep.equal([20])

    it "`_map_data` should correctly map data if length units are 'screen'", ->
      for angle in [0,1,2,3]
        data = {x: [1], y: [2], angle: [angle], length: [10]}
        glyph_view = create_glyph_view(@glyph, data)

        glyph_view.model.properties.length.units = "screen"

        @set_scales(glyph_view)
        glyph_view.map_data()
        expect(glyph_view.slength).to.be.deep.equal([10])

    it "`_map_data` should correctly map data if length units are 'data' and scale is reversed", ->
      for angle in [0,1,2,3]
        data = {x: [1], y: [2], length: [10]}
        glyph_view = create_glyph_view(@glyph, data)

        glyph_view.model.properties.length.units = "data"

        @set_scales(glyph_view, "reverse")
        glyph_view.map_data()
        expect(glyph_view.slength).to.be.deep.equal([20])

    it "`_map_data` should correctly map data if length units are 'screen' and scale is reversed", ->
      for angle in [0,1,2,3]
        data = {x: [1], y: [2], angle: [angle], length: [10]}
        glyph_view = create_glyph_view(@glyph, data)

        glyph_view.model.properties.length.units = "screen"

        @set_scales(glyph_view, "reverse")
        glyph_view.map_data()
        expect(glyph_view.slength).to.be.deep.equal([10])
