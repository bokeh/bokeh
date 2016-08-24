{expect} = require "chai"
utils = require "../../utils"

LogColorMapper = utils.require("models/mappers/log_color_mapper").Model

describe "LogColorMapper module", ->

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
