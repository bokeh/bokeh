{expect} = require "chai"
utils = require "../../utils"

LogColorMapper = utils.require("models/mappers/log_color_mapper").Model

describe "log_color_mapper module", ->

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
