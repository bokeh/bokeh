{expect} = require "chai"
utils = require "../../utils"

LogColorMapper = utils.require("models/mappers/log_color_mapper").Model

describe "log_color_mapper module", ->
  
  describe "creation of LogColorMapper", ->
    mapper = new LogColorMapper({
        palette: ["#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#fee08b"]
      })

    it "should check and set platform endian", ->
      expect('_little_endian' of mapper).to.be.true

    it "should convert palette to Uint32Array with duplicate last value", ->
      expect(mapper._palette).to.be.deep.equal({ '0': 3311805, '1': 6734501, '2': 11263396, '3': 15136152, '4': 16703627, '5': 16703627})

    it "should map values along log scale", ->
      expect(mapper.v_map_screen([1,10,100,1000])).to.be.equal {}