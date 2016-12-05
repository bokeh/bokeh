{expect} = require "chai"
utils = require "../../utils"

{CategoricalColorMapper} = utils.require("models/mappers/categorical_color_mapper")

describe "CategoricalColorMapper module", ->

  describe "CategoricalColorMapper._get_values method", ->

    it "Should map factors to palette", ->
      palette = ["red", "green", "blue"]
      color_mapper = new CategoricalColorMapper({
          palette: palette
          factors: ["a", "b", "c"]
        })
      vals = color_mapper._get_values(["c", "b", "a", "b"], palette)
      expect(vals).to.be.deep.equal(["blue", "green", "red", "green"])

    it "Should map data NaN to nan_color value", ->
      palette = ["red", "green", "blue"]
      color_mapper = new CategoricalColorMapper({
          palette: palette
          nan_color: "gray"
          factors: ["a", "b", "c"]
        })
      vals = color_mapper._get_values(["d", "a", "b"], palette)
      expect(vals).to.be.deep.equal(["gray", "red", "green"])

    it "Should map data to nan_color if palette is shorter than data", ->
      palette = ["red", "green"]
      color_mapper = new CategoricalColorMapper({
          palette: palette
          nan_color: "gray"
          factors: ["a", "b", "c"]
        })
      vals = color_mapper._get_values(["a", "b", "c"], palette)
      expect(vals).to.be.deep.equal(["red", "green", "gray"])
