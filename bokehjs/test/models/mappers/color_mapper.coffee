{expect} = require "chai"
sinon = require "sinon"
utils = require "../../utils"

{ColorMapper} = utils.require("models/mappers/color_mapper")

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

    it "should convert palette to Uint32Array", ->
      expected = { '0': 3253076, '1': 11394446, '2': 16252089 }
      expect(@color_mapper._build_palette([0x31a354, 0xaddd8e, 0xf7fcb9])).to.be.deep.equal(expected)

  describe "Changing palette model attr should reset _build_palette private attr", ->

    it "Should call `_build_palette` method and change `_palette` attr value", ->
      spy = sinon.spy(ColorMapper.prototype, "_build_palette")

      new_palette = [0x43a2ca, 0xa8ddb5, 0xe0f3db]
      @color_mapper.palette = new_palette

      expect(spy.withArgs(new_palette).calledOnce).to.be.true
      expect(@color_mapper._palette).to.be.deep.equal({ '0': 4432586, '1': 11066805, '2': 14742491 })

      spy.restore()

  describe "ColorMapper.v_map_screen method", ->
    it "should call get_values with data and palette", ->
      spy = sinon.spy(ColorMapper.prototype, "_get_values")
      palette =  ["blue", "red", "green", "pink", "black"]
      data = [1, 2, 3, 4, 5]
      @color_mapper._palette = palette
      @color_mapper.v_map_screen(data)
      expect(spy.withArgs(data, palette).calledOnce).to.be.true
      spy.restore()

  describe "ColorMapper.compute method", ->
    it "should return null", ->
      # single value transform does not make sense for color mapper
      val = @color_mapper.compute(1)
      expect(val).to.be.null

  describe "ColorMapper.v_compute method", ->
    it "should call get_values with palette", ->
      spy = sinon.spy(ColorMapper.prototype, "_get_values")
      palette =  ["blue", "red", "green", "pink", "black"]
      data = [1, 2, 3, 4, 5]
      @color_mapper.palette = palette
      @color_mapper.v_compute(data)
      expect(spy.withArgs(data, palette).calledOnce).to.be.true
      spy.restore()
