{expect} = require "chai"
utils = require "../../utils"

{LinearInterpolator} = utils.require("models/transforms/linear_interpolator")
{ColumnDataSource} = utils.require("models/sources/column_data_source")

describe "linear_interpolator_transform module", ->
  source = {start: 0, end: 10}
  target = {start: 20, end: 80}

  generate_interpolator_ColumnDataSource = ->
    new LinearInterpolator({
      x: 'var1'
      y: 'var2'
      data: new ColumnDataSource({
        data: {var1: [0, 5, 15], var2: [10, 20, 30]}
        })
      })

  generate_interpolator_inline = ->
    new LinearInterpolator({
      x: [0, 5, 15]
      y: [10, 20, 30]
      })

  describe "creation with ColumnDataSource ranges", ->
    transform = generate_interpolator_ColumnDataSource()

    it "should return control points", ->
      expect(transform.compute(0)).to.be.equal 10
      expect(transform.compute(5)).to.be.equal 20
      expect(transform.compute(15)).to.be.equal 30

    it "should linearly interpolate between control points", ->
      expect(transform.compute(2)).to.be.equal 14

    it "should linearly interpolate a vector of points", ->
      expect(transform.v_compute([0, 2, 5])).to.be.deep.equal new Float64Array [10, 14, 20]

    it "should map to a Float64Array", ->
      expect(transform.v_compute([-1,0,5,10,11])).to.be.instanceof Float64Array

  describe "creation with inline ranges", ->
    transform = generate_interpolator_inline()

    it "should return control points", ->
      expect(transform.compute(0)).to.be.equal 10
      expect(transform.compute(5)).to.be.equal 20
      expect(transform.compute(15)).to.be.equal 30

    it "should linearly interpolate between control points", ->
      expect(transform.compute(2)).to.be.equal 14

    it "should linearly interpolate a vector of points", ->
      expect(transform.v_compute([0, 2, 5])).to.be.deep.equal new Float64Array [10, 14, 20]

    it "should map to a Float64Array", ->
      expect(transform.v_compute([-1,0,5,10,11])).to.be.instanceof Float64Array
