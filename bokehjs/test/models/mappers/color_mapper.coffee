{expect} = require "chai"
sinon = require "sinon"
utils = require "../../utils"

ColorMapper = utils.require("models/mappers/color_mapper").Model

describe "ColorMapper module", ->

  beforeEach ->
    @color_mapper = new ColorMapper({palette: [0x31a354, 0xaddd8e, 0xf7fcb9]})

  describe "ColorMapper.initializer method", ->

    it "Should set `_little_endian` private attribute", ->
      # is_little_endian is platform (browser?) dependent, so we're just checking it's set
      expect(@color_mapper).to.have.property("_little_endian")

    it "Should set `_palette` private attribute", ->
      # This method is explicitly tested next, we're just checking it's set here
      expect(@color_mapper).to.have.property("_palette")

  describe "ColorMapper._build_palette method", ->

    it "should convert palette to Uint32Array with duplicate last value", ->
      expected = { '0': 3253076, '1': 11394446, '2': 16252089, '3': 16252089 }
      expect(@color_mapper._build_palette([0x31a354, 0xaddd8e, 0xf7fcb9])).to.be.deep.equal(expected)

  describe "Changing palette model attr should reset _build_palette private attr", ->

    it "Should call `_build_palette` method and change `_palette` attr value", ->
      spy = sinon.spy(ColorMapper.prototype, "_build_palette")

      new_palette = [0x43a2ca, 0xa8ddb5, 0xe0f3db]
      @color_mapper.palette = new_palette

      expect(spy.withArgs(new_palette).calledOnce).to.be.true
      expect(@color_mapper._palette).to.be.deep.equal({ '0': 4432586, '1': 11066805, '2': 14742491, '3': 14742491 })

      spy.restore()
