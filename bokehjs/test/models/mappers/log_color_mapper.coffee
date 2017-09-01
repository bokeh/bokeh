{expect} = require "chai"
utils = require "../../utils"

{LogColorMapper} = utils.require("models/mappers/log_color_mapper")

describe "LogColorMapper module", ->

  describe "LogColorMapper initialization", ->

    it "Should set _nan_color, _low_color, _high_color attributes as ints", ->

      color_mapper = new LogColorMapper({
        palette: ["red", "green", "blue"]
        nan_color: "cadetblue"
        low_color: "rgb(95,158,160)"
        high_color: "#5F9EA0"
        })

      expect(color_mapper._nan_color).to.be.equal(1604231423)
      expect(color_mapper._low_color).to.be.equal(1604231423)
      expect(color_mapper._high_color).to.be.equal(1604231423)

    it "If unset _low_color, _high_color should be undefined", ->
      color_mapper = new LogColorMapper({
        palette: ["red", "green", "blue"]
        })
      expect(color_mapper._low_color).to.be.undefined
      expect(color_mapper._high_color).to.be.undefined

  describe "LogColorMapper.v_map_screen method", ->

    it "Should correctly map values along log scale", ->
      color_mapper = new LogColorMapper({
          low: 2
          high: 25
          palette: ["#3288bd", "#abdda4", "#fee08b"]
        })

      buf8 = new Uint8ClampedArray(color_mapper.v_map_screen([2]))
      expect([buf8[0], buf8[1], buf8[2], buf8[3]]).to.be.deep.equal [50, 136, 189, 255]

      buf8 = new Uint8ClampedArray(color_mapper.v_map_screen([20]))
      expect([buf8[0], buf8[1], buf8[2], buf8[3]]).to.be.deep.equal [254, 224, 139, 255]

    it "Should correctly handle zero values", ->
      color_mapper = new LogColorMapper({
          low: 0
          high: 10
          palette: ["#3288bd", "#abdda4", "#fee08b"]
        })

      buf8 = new Uint8ClampedArray(color_mapper.v_map_screen([0]))
      expect([buf8[0], buf8[1], buf8[2], buf8[3]]).to.be.deep.equal [50, 136, 189, 255]

  describe "LogColorMapper._get_values method", ->

    it "Should map data below low value to low", ->
      palette = ["red", "green", "blue"]
      color_mapper = new LogColorMapper({
          low: 1
          high: 100
          palette: palette
        })

      vals = color_mapper._get_values([0, 1, 10], palette)
      expect(vals).to.be.deep.equal(["red", "red", "green"])

    it "Should map data above high value to high", ->
      palette = ["red", "green", "blue"]
      color_mapper = new LogColorMapper({
          low: 1
          high: 100
          palette: palette
        })

      vals = color_mapper._get_values([10, 100, 101], palette)
      expect(vals).to.be.deep.equal(["green", "blue", "blue"])

    it "Should map data NaN to nan_color value", ->
      palette = ["red", "green", "blue"]
      color_mapper = new LogColorMapper({
          low: 1
          high: 100
          palette: palette
          nan_color: "gray"
        })

      vals = color_mapper._get_values([1, NaN, 100], palette)
      expect(vals).to.be.deep.equal(["red", "gray", "blue"])

    it "Should map data NaN to nan_color value when high/low not set", ->
      palette = ["red", "green", "blue"]
      color_mapper = new LogColorMapper({
          palette: palette
          nan_color: "gray"
        })

      vals = color_mapper._get_values([1, NaN, 100], palette)
      expect(vals).to.be.deep.equal(["red", "gray", "blue"])

    it "Should map high/low values to high_color/low_color, if provided", ->
      palette = ["red", "green", "blue"]
      color_mapper = new LogColorMapper({
          low: 1
          high: 100
          low_color: "pink"
          high_color: "orange"
          palette: palette
        })

      vals = color_mapper._get_values([0.5, 1, 10, 100, 101], palette)
      expect(vals).to.be.deep.equal(["pink", "red", "green", "blue", "orange"])

    it "Should map high/low values to _high_color/_low_color, if image_glyph=true", ->
      palette = [1, 2, 3]
      color_mapper = new LogColorMapper({
          low: 1
          high: 100
          palette: palette
          low_color: "pink" # converts to 4290825215
          high_color: "orange" # converts to 4289003775
        })

      vals = color_mapper._get_values([-1, 1, 10, 100, 101], palette, true)
      expect(vals).to.be.deep.equal([4290825215, 1, 2, 3, 4289003775])
