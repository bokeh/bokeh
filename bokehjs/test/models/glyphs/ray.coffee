{expect} = require "chai"
sinon = require "sinon"

{create_glyph_view, set_scales} = require("./glyph_utils")
{Ray, RayView} = require("models/glyphs/ray")

describe "Ray", ->

  describe "RayView", ->

    beforeEach ->
      @glyph = new Ray({
        x: {field: "x"}
        y: {field: "y"}
        length: {value: 10}
      })

    it "`_map_data` should correctly map data if length units are 'data'", ->
      for angle in [0,1,2,3]
        data = {x: [1], y: [2], length: [10]}
        glyph_view = create_glyph_view(@glyph, data)

        glyph_view.model.properties.length.units = "data"

        set_scales(glyph_view, "linear")
        glyph_view.map_data()
        expect(glyph_view.slength).to.be.deep.equal(Float64Array.of(20))

    it "`_map_data` should correctly map data if length units are 'screen'", ->
      for angle in [0,1,2,3]
        data = {x: [1], y: [2], angle: [angle], length: [10]}
        glyph_view = create_glyph_view(@glyph, data)

        glyph_view.model.properties.length.units = "screen"

        set_scales(glyph_view, "linear")
        glyph_view.map_data()
        expect(glyph_view.slength).to.be.deep.equal([10])

    it "`_map_data` should correctly map data if length units are 'data' and scale is reversed", ->
      for angle in [0,1,2,3]
        data = {x: [1], y: [2], length: [10]}
        glyph_view = create_glyph_view(@glyph, data)

        glyph_view.model.properties.length.units = "data"

        set_scales(glyph_view, "linear", true)
        glyph_view.map_data()
        expect(glyph_view.slength).to.be.deep.equal(Float64Array.of(20))

    it "`_map_data` should correctly map data if length units are 'screen' and scale is reversed", ->
      for angle in [0,1,2,3]
        data = {x: [1], y: [2], angle: [angle], length: [10]}
        glyph_view = create_glyph_view(@glyph, data)

        glyph_view.model.properties.length.units = "screen"

        set_scales(glyph_view, "linear", true)
        glyph_view.map_data()
        expect(glyph_view.slength).to.be.deep.equal([10])
