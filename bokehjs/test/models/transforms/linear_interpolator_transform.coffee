{expect} = require "chai"
utils = require "../../utils"

{Collections} = utils.require "base"

describe "linear_interpolator_transform module", ->
  source = {start: 0, end: 10}
  target = {start: 20, end: 80}

  generate_interpolator_ColumnDataSource = ->
    Collections("LinearInterpolator").create
      x: 'var1'
      y: 'var2'
      data: Collections("ColumnDataSource").create({data: {var1: [0, 5, 15], var2: [10, 20, 30]}})

  generate_interpolator_inline = ->
    Collections("LinearInterpolator").create
      x: [0, 5, 15]
      y: [10, 20, 30]

  describe "creation with ColumnDataSource ranges", ->
    mapper = generate_interpolator_ColumnDataSource()

    it "should return control points", ->
      expect(mapper.compute(0)).to.be.equal 10
      expect(mapper.compute(5)).to.be.equal 20

    it "should linearly interpolate between control points", ->
      expect(mapper.compute(2)).to.be.equal 14

    it "should linearly interpolate a vector of points", ->
      expect(mapper.v_compute([0, 2, 5])).to.be.deep.equal new Float64Array [10, 14, 20]

    it "should map to a Float64Array", ->
      expect(mapper.v_map_to_target([-1,0,5,10,11])).to.be.instanceof Float64Array

  describe "creation with inline ranges", ->
    mapper = generate_interpolator_inline()

    it "should return control points", ->
      expect(mapper.compute(0)).to.be.equal 10
      expect(mapper.compute(5)).to.be.equal 20

    it "should linearly interpolate between control points", ->
      expect(mapper.compute(2)).to.be.equal 14

    it "should linearly interpolate a vector of points", ->
      expect(mapper.v_compute([0, 2, 5])).to.be.deep.equal new Float64Array [10, 14, 20]

    it "should map to a Float64Array", ->
      expect(mapper.v_map_to_target([-1,0,5,10,11])).to.be.instanceof Float64Array
