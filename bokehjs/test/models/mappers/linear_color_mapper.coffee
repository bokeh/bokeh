{expect} = require "chai"
utils = require "../../utils"

{LinearColorMapper} = utils.require("models/mappers/linear_color_mapper")

describe "LinearColorMapper module", ->

  describe "LinearColorMapper initialization", ->

    it "Should set _nan_color, _low_color, _high_color attributes as ints", ->

      color_mapper = new LinearColorMapper({
        palette: ["red", "green", "blue"]
        nan_color: "cadetblue"
        low_color: "rgb(95,158,160)"
        high_color: "#5F9EA0"
        })

      expect(color_mapper._nan_color).to.be.equal(1604231423)
      expect(color_mapper._low_color).to.be.equal(1604231423)
      expect(color_mapper._high_color).to.be.equal(1604231423)

    it "If unset _low_color, _high_color should be undefined", ->
      color_mapper = new LinearColorMapper({
        palette: ["red", "green", "blue"]
        })
      expect(color_mapper._low_color).to.be.undefined
      expect(color_mapper._high_color).to.be.undefined

  describe "LinearColorMapper._get_values method", ->

    it "Should map values along linear scale with high/low unset", ->
      palette = ["red", "green", "blue"]
      color_mapper = new LinearColorMapper({
          palette: palette
        })

      vals = color_mapper._get_values([99.999, 67, 50, 32, 0.0001], palette)
      expect(vals).to.be.deep.equal(["blue", "blue", "green", "red", "red"])

      vals = color_mapper._get_values([0.0001, 32, 50, 67, 99.999], palette)
      expect(vals).to.be.deep.equal(["red", "red", "green", "blue", "blue"])

      vals = color_mapper._get_values([1, 2, 3], palette)
      expect(vals).to.be.deep.equal(["red", "green", "blue"])

      vals = color_mapper._get_values([3, 2, 1], palette)
      expect(vals).to.be.deep.equal(["blue", "green", "red"])

      vals = color_mapper._get_values([0, 1, 2], palette)
      expect(vals).to.be.deep.equal(["red", "green", "blue"])

      vals = color_mapper._get_values([2, 1, 0], palette)
      expect(vals).to.be.deep.equal(["blue", "green", "red"])

      vals = color_mapper._get_values([-1, 0, 1], palette)
      expect(vals).to.be.deep.equal(["red", "green", "blue"])

      vals = color_mapper._get_values([1, 0, -1], palette)
      expect(vals).to.be.deep.equal(["blue", "green", "red"])

    it "Should map values along linear scale with high/low set", ->
      palette = ["red", "green", "blue"]
      color_mapper = new LinearColorMapper({
          low: 1
          high: 3
          palette: palette
        })

      vals = color_mapper._get_values([1, 2, 3], palette)
      expect(vals).to.be.deep.equal(["red", "green", "blue"])

    it "Should map values along linear scale with high/low set in other direction", ->
      palette = ["red", "green", "blue"]
      color_mapper = new LinearColorMapper({
          low: 3
          high: 1
          palette: palette
        })

      vals = color_mapper._get_values([1, 2, 3], palette)
      expect(vals).to.be.deep.equal(["blue", "green", "red"])

    it "Should map data below low value to low", ->
      palette = ["red", "green", "blue"]
      color_mapper = new LinearColorMapper({
          low: 1
          high: 3
          palette: palette
        })

      vals = color_mapper._get_values([0, 1, 2], palette)
      expect(vals).to.be.deep.equal(["red", "red", "green"])

    it "Should map data above high value to high", ->
      palette = ["red", "green", "blue"]
      color_mapper = new LinearColorMapper({
          low: 1
          high: 3
          palette: palette
        })

      vals = color_mapper._get_values([2, 3, 4], palette)
      expect(vals).to.be.deep.equal(["green", "blue", "blue"])

    it "Should map data NaN to nan_color value", ->
      palette = ["red", "green", "blue"]
      color_mapper = new LinearColorMapper({
          low: 1
          high: 3
          palette: palette
          nan_color: "gray"
        })

      vals = color_mapper._get_values([1, NaN, 3], palette)
      expect(vals).to.be.deep.equal(["red", "gray", "blue"])

    it "Should map data NaN to nan_color value when high/low not set", ->
      palette = ["red", "green", "blue"]
      color_mapper = new LinearColorMapper({
          palette: palette
          nan_color: "gray"
        })

      vals = color_mapper._get_values([1, NaN, 3], palette)
      expect(vals).to.be.deep.equal(["red", "gray", "blue"])

    it "Should map high/low values to high_color/low_color, if provided", ->
      palette = ["red", "green", "blue"]
      color_mapper = new LinearColorMapper({
          low: 0
          high: 2
          palette: palette
          low_color: "pink"
          high_color: "orange"
        })

      vals = color_mapper._get_values([-1, 0, 1, 2, 3], palette)
      expect(vals).to.be.deep.equal(["pink", "red", "green", "blue", "orange"])

    it "Should map high/low values to _high_color/_low_color, if image_glyph=true", ->
      palette = [1, 2, 3]
      color_mapper = new LinearColorMapper({
          low: 0
          high: 2
          palette: palette
          low_color: "pink" # converts to 4290825215
          high_color: "orange" # converts to 4289003775
        })

      vals = color_mapper._get_values([-1, 0, 1, 2, 3], palette, true)
      expect(vals).to.be.deep.equal([4290825215, 1, 2, 3, 4289003775])
