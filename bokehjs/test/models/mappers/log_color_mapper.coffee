{expect} = require "chai"
utils = require "../../utils"

LogColorMapper = utils.require("models/mappers/log_color_mapper").Model

describe "log_color_mapper module", ->

  describe "creation of LogColorMapper", ->
    mapper = new LogColorMapper({
        low: 2
        high: 25
        palette: ["#3288bd", "#abdda4", "#fee08b"]
      })

    it "should check and set platform endian", ->
      expect('_little_endian' of mapper).to.be.true

    it "should convert palette to Uint32Array with duplicate last value", ->
      _palette = { '0': 3311805, '1': 11263396, '2': 16703627, '3': 16703627 }
      expect(mapper._palette).to.be.deep.equal(_palette)

    it "should map values along log scale", ->
      buf8 = new Uint8ClampedArray(mapper.v_map_screen([2]))
      expect([buf8[0], buf8[1], buf8[2], buf8[3]]).to.be.deep.equal [50, 136, 189, 255]

      buf8 = new Uint8ClampedArray(mapper.v_map_screen([20]))
      expect([buf8[0], buf8[1], buf8[2], buf8[3]]).to.be.deep.equal [254, 224, 139, 255]

  describe "zero value handling of LogColorMapper", ->
    mapper = new LogColorMapper({
        low: 0
        high: 10
        palette: ["#3288bd", "#abdda4", "#fee08b"]
      })

    it "should map values along log scale", ->
      buf8 = new Uint8ClampedArray(mapper.v_map_screen([0]))
      expect([buf8[0], buf8[1], buf8[2], buf8[3]]).to.be.deep.equal [50, 136, 189, 255]
