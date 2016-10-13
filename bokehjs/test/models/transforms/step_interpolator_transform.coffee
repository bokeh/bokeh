{expect} = require "chai"
utils = require "../../utils"

{Collections} = utils.require "base"

{StepInterpolator} = utils.require('models/transforms/step_interpolator')
{ColumnDataSource} = utils.require('models/sources/column_data_source')

describe "step_interpolator_transform module", ->
  source = {start: 0, end: 10}
  target = {start: 20, end: 80}

  generate_interpolator_ColumnDataSource = ->
    new StepInterpolator({
      x: 'var1'
      y: 'var2'
      data: new ColumnDataSource({
        data: {var1: [0, 5, 15], var2: [10, 20, 30]}
        })
      })

  generate_interpolator_inline = ->
    new StepInterpolator({
      x: [0, 5, 15]
      y: [10, 20, 30]
      })

  describe "creation with ColumnDataSource ranges", ->
    transform = generate_interpolator_ColumnDataSource()

    it "should return control points", ->
      expect(transform.compute(0)).to.be.equal 10
      expect(transform.compute(5)).to.be.equal 20

    it "should step interpolate before", ->
      transform.mode = 'before'

      it "should linearly interpolate between control points", ->
        expect(transform.compute(2)).to.be.equal 20

      it "should linearly interpolate a vector of points", ->
        expect(transform.v_compute([0, 2, 6])).to.be.deep.equal new Float64Array [20, 20, 30]

      it "should map to a Float64Array", ->
        expect(transform.v_compute([-1,0,5,10,11])).to.be.instanceof Float64Array

    it "should step interpolate after", ->
      transform.mode = 'after'

      it "should linearly interpolate between control points", ->
        expect(transform.compute(2)).to.be.equal 10

      it "should linearly interpolate a vector of points", ->
        expect(transform.v_compute([0, 2, 6])).to.be.deep.equal new Float64Array [10, 10, 20]

      it "should map to a Float64Array", ->
        expect(transform.v_compute([-1,0,5,10,11])).to.be.instanceof Float64Array

    it "should step interpolate center", ->
      transform.mode = 'center'

      it "should linearly interpolate between control points", ->
        expect(transform.compute(2)).to.be.equal 10

      it "should linearly interpolate a vector of points", ->
        expect(transform.v_compute([0, 2, 6])).to.be.deep.equal new Float64Array [10, 10, 20]

      it "should map to a Float64Array", ->
        expect(transform.v_compute([-1,0,5,10,11])).to.be.instanceof Float64Array

  describe "creation with inline ranges", ->
    transform = generate_interpolator_inline()

    it "should return control points", ->
      expect(transform.compute(0)).to.be.equal 10
      expect(transform.compute(5)).to.be.equal 20

    it "should step interpolate before", ->
      transform.mode = 'before'

      it "should linearly interpolate between control points", ->
        expect(transform.compute(2)).to.be.equal 20

      it "should linearly interpolate a vector of points", ->
        expect(transform.v_compute([0, 2, 6])).to.be.deep.equal new Float64Array [20, 20, 30]

      it "should map to a Float64Array", ->
        expect(transform.v_compute([-1,0,5,10,11])).to.be.instanceof Float64Array

    it "should step interpolate after", ->
      transform.mode = 'after'

      it "should linearly interpolate between control points", ->
        expect(transform.compute(2)).to.be.equal 10

      it "should linearly interpolate a vector of points", ->
        expect(transform.v_compute([0, 2, 6])).to.be.deep.equal new Float64Array [10, 10, 20]

      it "should map to a Float64Array", ->
        expect(transform.v_compute([-1,0,5,10,11])).to.be.instanceof Float64Array

    it "should step interpolate center", ->
      transform.mode = 'center'

      it "should linearly interpolate between control points", ->
        expect(transform.compute(2)).to.be.equal 10

      it "should linearly interpolate a vector of points", ->
        expect(transform.v_compute([0, 2, 6])).to.be.deep.equal new Float64Array [10, 10, 20]

      it "should map to a Float64Array", ->
        expect(transform.v_compute([-1,0,5,10,11])).to.be.instanceof Float64Array
