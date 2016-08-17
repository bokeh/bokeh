{expect} = require "chai"
sinon = require "sinon"
utils = require "../../utils"

ColorMapper = utils.require("models/mappers/color_mapper").Model

describe "ColorMapper module", ->

  describe "ColorMapper.Model initializer", ->

  color_mapper = new ColorMapper({palette: [0x31a354, 0xaddd8e, 0xf7fcb9]})

  it "should create `little_endian` computed property", ->
    # `is_little_endian` result is platform (browser?) dependent
    stub = sinon.stub(ColorMapper.prototype, '_is_little_endian').returns(true)
    expect(color_mapper.get('little_endian')).to.be.true
    stub.restore()

  it "should create `computed_palette` computed property", ->
    # should convert palette to Uint32Array with duplicate last value
    expected = { '0': 3253076, '1': 11394446, '2': 16252089, '3': 16252089 }
    expect(color_mapper.get('computed_palette')).to.be.deep.equal(expected)

  it "Should reset `computed_palette` property on palette attr change", ->
    color_mapper.palette = [0x43a2ca, 0xa8ddb5, 0xe0f3db]
    new_expected = { '0': 4432586, '1': 11066805, '2': 14742491, '3': 14742491 }
    expect(color_mapper.get("computed_palette")).to.be.deep.equal(new_expected)
