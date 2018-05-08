{expect} = require "chai"

{CategoricalScale} = require("models/scales/categorical_scale")
{FactorRange} = require("models/ranges/factor_range")
{Range1d} = require("models/ranges/range1d")

close = (a, b) -> Math.abs(a-b)<10e-7

describe "categorical_scale module", ->

  describe "basic factors", ->
    factors = ["foo", "bar", "baz"]

    beforeEach ->
      @scale = new CategoricalScale({
        source_range: new FactorRange({factors: factors, range_padding: 0})
        target_range: new Range1d({start: 20, end: 80})
      })

    describe "forward mapping", ->
      it "should map factors evenly", ->
        expect(@scale.compute "foo").to.equal 30
        expect(@scale.compute "bar").to.equal 50
        expect(@scale.compute "baz").to.equal 70

    describe "forward vector mapping", ->
      beforeEach ->
        @values = @scale.v_compute factors

      it "should return a Float64Array", ->
        expect(@values).to.be.an.instanceof Float64Array

      it "should map factors evenly", ->
        expect(@values).to.deep.equal new Float64Array [30, 50, 70]

    describe "inverse mapping", ->
      it "should map factors evenly", ->
        expect(@scale.invert 20).to.equal 0
        expect(@scale.invert 30).to.equal 0.5
        expect(@scale.invert 40).to.equal 1
        expect(@scale.invert 50).to.equal 1.5
        expect(@scale.invert 60).to.equal 2
        expect(@scale.invert 70).to.equal 2.5
        expect(@scale.invert 80).to.equal 3

    describe "inverse vector mapping", ->
      beforeEach ->
        @values = @scale.v_invert [18, 20, 26, 28, 30, 32, 34, 38, 40, 42]

      it "should return a Float64Arrayy", ->
        expect(@values).to.be.an.instanceof Float64Array

      it "should map factors evenly", ->
        expect(@values).to.deep.equal new Float64Array [-0.1, 0, 0.3, 0.4, 0.5, 0.6, 0.7, 0.9, 1.0, 1.1]

    describe "factor updates", ->
      new_factors = ['a', 'b', 'c', 'd']

      beforeEach ->
        @scale.source_range.factors = new_factors

      it "should cause updated mapped values", ->
        expect(@scale.compute 'a').to.equal 27.5
        expect(@scale.compute 'b').to.equal 42.5
        expect(@scale.compute 'c').to.equal 57.5
        expect(@scale.compute 'd').to.equal 72.5

      it "should cause updated vector mapped values", ->
        values = @scale.v_compute new_factors
        expect(values).to.deep.equal new Float64Array [27.5, 42.5, 57.5, 72.5]

      it "should cause updated inverse mapped values", ->
        expect(@scale.invert 20).to.equal 0
        expect(@scale.invert 27.5).to.equal 0.5
        expect(@scale.invert 35).to.equal 1

        expect(@scale.invert 35).to.equal 1
        expect(@scale.invert 42.5).to.equal 1.5
        expect(@scale.invert 50).to.equal 2

        expect(@scale.invert 50).to.equal 2
        expect(@scale.invert 57.5).to.equal 2.5
        expect(@scale.invert 65).to.equal 3

        expect(@scale.invert 65).to.equal 3
        expect(@scale.invert 72.5).to.equal 3.5
        expect(@scale.invert 80).to.equal 4

      it "should cause updated inverse vector mapped values", ->
        values = @scale.v_invert [20, 27.5, 35, 42.5, 50, 57.5, 65, 72.5, 80]
        expect(values).to.deep.equal new Float64Array [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]

    describe "categorical offsets", ->
      it "should apply offsets to mappings", ->
        expect(@scale.compute ['foo', -0.6]).to.equal 18
        expect(@scale.compute ['foo', -0.5]).to.equal 20
        expect(@scale.compute ['foo', -0.2]).to.equal 26
        expect(@scale.compute ['foo', -0.1]).to.equal 28
        expect(@scale.compute ['foo',  0.0]).to.equal 30
        expect(@scale.compute ['foo',  0.1]).to.equal 32
        expect(@scale.compute ['foo',  0.2]).to.equal 34
        expect(@scale.compute ['foo',  0.5]).to.equal 40
        expect(@scale.compute ['foo',  0.6]).to.equal 42

        expect(@scale.compute ['bar', -0.6]).to.equal 38
        expect(@scale.compute ['bar', -0.5]).to.equal 40
        expect(@scale.compute ['bar', -0.2]).to.equal 46
        expect(@scale.compute ['bar', -0.1]).to.equal 48
        expect(@scale.compute ['bar',  0.0]).to.equal 50
        expect(@scale.compute ['bar',  0.1]).to.equal 52
        expect(@scale.compute ['bar',  0.2]).to.equal 54
        expect(@scale.compute ['bar',  0.5]).to.equal 60
        expect(@scale.compute ['bar',  0.6]).to.equal 62

        expect(@scale.compute ['baz', -0.6]).to.equal 58
        expect(@scale.compute ['baz', -0.5]).to.equal 60
        expect(@scale.compute ['baz', -0.2]).to.equal 66
        expect(@scale.compute ['baz', -0.1]).to.equal 68
        expect(@scale.compute ['baz',  0.0]).to.equal 70
        expect(@scale.compute ['baz',  0.1]).to.equal 72
        expect(@scale.compute ['baz',  0.2]).to.equal 74
        expect(@scale.compute ['baz',  0.5]).to.equal 80
        expect(@scale.compute ['baz',  0.6]).to.equal 82

      it "should apply offsets to vector mappings", ->
        values = @scale.v_compute [
          ['foo',-0.6], ['foo',-0.5], ['foo',-0.2], ['foo',-0.1], ['foo',0.0], ['foo',0.1], ['foo',0.2], ['foo',0.5], ['foo',0.6]
        ]
        expect(values).to.deep.equal new Float64Array [18,20,26,28,30,32,34,40,42]

        values = @scale.v_compute [
          ['bar',-0.6], ['bar',-0.5], ['bar',-0.2], ['bar',-0.1], ['bar',0.0], ['bar',0.1], ['bar',0.2], ['bar',0.5], ['bar',0.6]
        ]
        expect(values).to.deep.equal new Float64Array [38,40,46,48,50,52,54,60,62]

        values = @scale.v_compute [
          ['baz',-0.6], ['baz',-0.5], ['baz',-0.2], ['baz',-0.1], ['baz',0.0], ['baz',0.1], ['baz',0.2], ['baz',0.5], ['baz',0.6]
        ]
        expect(values).to.deep.equal new Float64Array [58,60,66,68,70,72,74,80,82]
