_ = require "underscore"
{expect} = require "chai"
utils = require "../utils"

{Collections} = utils.require "common/base"

close = (a, b) -> Math.abs(a-b)<10e-7

describe "categorical mapper module", ->
  factors = ["foo", "bar", "baz"]
  start = 20
  end = 80

  generate_mapper = ->
    Collections("CategoricalMapper").create
      source_range: Collections("FactorRange").create factors: factors
      target_range: Collections("Range1d").create start: start, end: end

  describe "mapping", ->
    mapper = generate_mapper()

    test_mapping = (key, expected) ->
      expect(mapper.map_to_target key).to.equal expected

    test_synthetic_mapping = (key, expected) ->
      expect(mapper.map_to_target key, true).to.equal expected

    it "should map factors evenly", ->
      test_mapping "foo", 30
      test_mapping "bar", 50
      test_mapping "baz", 70

    it "should expose synthetic range values", ->
      test_synthetic_mapping "foo", 1
      test_synthetic_mapping "bar", 2
      test_synthetic_mapping "baz", 3

    it "should map synthetic values to synthetic values", ->
      test_synthetic_mapping 1, 1
      test_synthetic_mapping 2, 2
      test_synthetic_mapping 3, 3

  describe "vector mapping", ->
    values = generate_mapper().v_map_to_target factors

    it "should return a Float64Array", ->
      expect(values).to.be.an.instanceof Float64Array

    it "should be evenly distributed", ->
      expect(values).to.deep.equal new Float64Array [30, 50, 70]

    it "should expose synthetic range values", ->
      synthetic = generate_mapper().v_map_to_target factors, true
      expect(synthetic).to.deep.equal [1, 2, 3]

    it "should map synthetic values to synthetic values", ->
      synthetic = generate_mapper().v_map_to_target [1,2,3], true
      expect(synthetic).to.deep.equal [1, 2, 3]

  describe "inverse mapping", ->
    mapper = generate_mapper()
    close = (a, b) -> Math.abs(a-b)<10e-7

    test_inverse_mapping = (key, expected) ->
      expect(mapper.map_from_target key).to.equal expected

    test_synthetic_inverse_mapping = (key, expected) ->
      val = mapper.map_from_target key, true
      expect(close(val, expected)).to.be.ok

    it "should bin inverses evenly", ->
      test_inverse_mapping 21, 'foo'
      test_inverse_mapping 30, 'foo'
      test_inverse_mapping 39, 'foo'
      test_inverse_mapping 41, 'bar'
      test_inverse_mapping 50, 'bar'
      test_inverse_mapping 59, 'bar'
      test_inverse_mapping 61, 'baz'
      test_inverse_mapping 70, 'baz'
      test_inverse_mapping 79, 'baz'

    it "should expose synthetic range values", ->
      test_synthetic_inverse_mapping 21, 0.55
      test_synthetic_inverse_mapping 30, 1.0
      test_synthetic_inverse_mapping 39, 1.45
      test_synthetic_inverse_mapping 41, 1.55
      test_synthetic_inverse_mapping 50, 2.0
      test_synthetic_inverse_mapping 59, 2.45
      test_synthetic_inverse_mapping 61, 2.55
      test_synthetic_inverse_mapping 70, 3.0
      test_synthetic_inverse_mapping 79, 3.45


  describe "inverse vector mapping", ->
    values = [21,30,39,41,50,59,61,70,79]
    result = generate_mapper().v_map_from_target values

    it "should return an Array", ->
      expect(result).to.be.an.instanceof Array

    it "should be evenly distributed", ->
      expect(result).to.deep.equal ['foo','foo','foo','bar','bar','bar','baz','baz','baz']

    it "should expose synthetic range values", ->
      synthetic = generate_mapper().v_map_from_target values, true
      expected = [0.55, 1.0, 1.45, 1.55, 2.0, 2.45, 2.55, 3.0, 3.45]
      for i in [0...values.length]
        expect(close(synthetic[i], expected[i])).to.be.ok


  describe "source updates", ->
    new_factors = ['a', 'b', 'c', 'd']
    mapper = generate_mapper()
    mapper.get('source_range').set('factors', new_factors)

    test_mapping = (key, expected) ->
      expect(mapper.map_to_target key).to.equal expected

    test_inverse_mapping = (key, expected) ->
      expect(mapper.map_from_target key).to.equal expected

    it "should cause updated mapped values", ->
      test_mapping 'a', 27.5
      test_mapping 'b', 42.5
      test_mapping 'c', 57.5
      test_mapping 'd', 72.5

    it "should cause updated vector mapped values", ->
      new_values =  mapper.v_map_to_target new_factors
      expect(new_values).to.deep.equal new Float64Array [27.5, 42.5, 57.5, 72.5]

    it "should cause updated inverse mapped values", ->
      test_inverse_mapping 20,   'a'
      test_inverse_mapping 27.5, 'a'
      test_inverse_mapping 34,   'a'

      test_inverse_mapping 35,   'b'
      test_inverse_mapping 42.5, 'b'
      test_inverse_mapping 49,   'b'

      test_inverse_mapping 50,   'c'
      test_inverse_mapping 57.5, 'c'
      test_inverse_mapping 64,   'c'

      test_inverse_mapping 65,   'd'
      test_inverse_mapping 72.5, 'd'
      test_inverse_mapping 79,   'd'

    it "should cause updated inverse vector mapped values", ->
      values = [25,27.5,30,40,42.5,45,55,57.5,60,70,72.5,75]
      result = mapper.v_map_from_target values
      expect(result).to.deep.equal ['a','a','a','b','b','b','c','c','c','d','d','d']

  describe "categorical coordinates", ->
    mapper = generate_mapper()

    test_mapping = (key, expected) ->
      expect(mapper.map_to_target key).to.equal expected

    it "should apply map percentages to mappings", ->
      test_mapping 'foo:0.1', 22
      test_mapping 'foo:0.5', 30
      test_mapping 'foo:0.9', 38
      test_mapping 'bar:0.2', 44
      test_mapping 'bar:0.4', 48
      test_mapping 'bar:0.6', 52
      test_mapping 'bar:0.8', 56
      test_mapping 'baz:0.3', 66
      test_mapping 'baz:0.7', 74

    it "should apply percentages to vector mappings", ->
      values = generate_mapper().v_map_to_target ['foo:0.1', 'foo:0.5', 'foo:0.9']
      expect(values).to.deep.equal new Float64Array [22,30,38]

      values = generate_mapper().v_map_to_target ['bar:0.2', 'bar:0.4', 'bar:0.6', 'bar:0.8']
      expect(values).to.deep.equal new Float64Array [44,48,52,56]

      values = generate_mapper().v_map_to_target ['baz:0.3', 'baz:0.7']
      expect(values).to.deep.equal new Float64Array [66, 74]



