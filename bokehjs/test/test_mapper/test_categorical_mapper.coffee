_ = require "underscore"
{expect} = require "chai"
utils = require "../utils"

{Collections} = utils.require "common/base"

close = (a, b) -> Math.abs(a-b)<10e-7

describe "categorical mapper module", ->
  factors = ["foo", "bar", "baz"]
  start = 20
  end = 80

  generate_mapper = (offset=0) ->
    Collections("CategoricalMapper").create
      source_range: Collections("FactorRange").create factors: factors, offset: offset
      target_range: Collections("Range1d").create start: start, end: end

  describe "mapping", ->
    mapper = generate_mapper()
    omapper = generate_mapper(-1)

    test_mapping = (mapper, key, expected) ->
      expect(mapper.map_to_target key).to.equal expected

    test_synthetic_mapping = (mapper, key, expected) ->
      expect(mapper.map_to_target key, true).to.equal expected

    it "should map factors evenly", ->
      test_mapping mapper, "foo", 30
      test_mapping mapper, "bar", 50
      test_mapping mapper, "baz", 70

      test_mapping omapper, "foo", 30
      test_mapping omapper, "bar", 50
      test_mapping omapper, "baz", 70

    it "should expose synthetic range values", ->
      test_synthetic_mapping mapper, "foo", 1
      test_synthetic_mapping mapper, "bar", 2
      test_synthetic_mapping mapper, "baz", 3

      test_synthetic_mapping omapper, "foo", 0
      test_synthetic_mapping omapper, "bar", 1
      test_synthetic_mapping omapper, "baz", 2

    it "should map synthetic values to synthetic values", ->
      test_synthetic_mapping mapper, 1, 1
      test_synthetic_mapping mapper, 2, 2
      test_synthetic_mapping mapper, 3, 3

      test_synthetic_mapping omapper, 1, 1
      test_synthetic_mapping omapper, 2, 2
      test_synthetic_mapping omapper, 3, 3

  describe "vector mapping", ->
    values = generate_mapper().v_map_to_target factors

    it "should return a Float64Array", ->
      expect(values).to.be.an.instanceof Float64Array

    it "should be evenly distributed", ->
      expect(values).to.deep.equal new Float64Array [30, 50, 70]

    it "should expose synthetic range values", ->
      synthetic = generate_mapper().v_map_to_target factors, true
      expect(synthetic).to.deep.equal [1, 2, 3]

      osynthetic = generate_mapper(-1).v_map_to_target factors, true
      expect(osynthetic).to.deep.equal [0, 1, 2]

    it "should map synthetic values to synthetic values", ->
      synthetic = generate_mapper().v_map_to_target [1,2,3], true
      expect(synthetic).to.deep.equal [1, 2, 3]

      osynthetic = generate_mapper().v_map_to_target [1,2,3], true
      expect(osynthetic).to.deep.equal [1, 2, 3]

  describe "inverse mapping", ->
    mapper = generate_mapper()
    omapper = generate_mapper(-1)
    close = (a, b) -> Math.abs(a-b)<10e-7

    test_inverse_mapping = (mapper, key, expected) ->
      expect(mapper.map_from_target key).to.equal expected

    test_synthetic_inverse_mapping = (mapper, key, expected) ->
      val = mapper.map_from_target key, true
      expect(close(val, expected)).to.be.ok

    it "should bin inverses evenly", ->
      test_inverse_mapping mapper, 21, 'foo'
      test_inverse_mapping mapper, 30, 'foo'
      test_inverse_mapping mapper, 39, 'foo'
      test_inverse_mapping mapper, 41, 'bar'
      test_inverse_mapping mapper, 50, 'bar'
      test_inverse_mapping mapper, 59, 'bar'
      test_inverse_mapping mapper, 61, 'baz'
      test_inverse_mapping mapper, 70, 'baz'
      test_inverse_mapping mapper, 79, 'baz'

      test_inverse_mapping omapper, 21, 'foo'
      test_inverse_mapping omapper, 30, 'foo'
      test_inverse_mapping omapper, 39, 'foo'
      test_inverse_mapping omapper, 41, 'bar'
      test_inverse_mapping omapper, 50, 'bar'
      test_inverse_mapping omapper, 59, 'bar'
      test_inverse_mapping omapper, 61, 'baz'
      test_inverse_mapping omapper, 70, 'baz'
      test_inverse_mapping omapper, 79, 'baz'


    it "should expose synthetic range values", ->
      test_synthetic_inverse_mapping mapper, 21, 0.55
      test_synthetic_inverse_mapping mapper, 30, 1.0
      test_synthetic_inverse_mapping mapper, 39, 1.45
      test_synthetic_inverse_mapping mapper, 41, 1.55
      test_synthetic_inverse_mapping mapper, 50, 2.0
      test_synthetic_inverse_mapping mapper, 59, 2.45
      test_synthetic_inverse_mapping mapper, 61, 2.55
      test_synthetic_inverse_mapping mapper, 70, 3.0
      test_synthetic_inverse_mapping mapper, 79, 3.45

      test_synthetic_inverse_mapping omapper, 21, -0.45
      test_synthetic_inverse_mapping omapper, 30, 0.0
      test_synthetic_inverse_mapping omapper, 39, 0.45
      test_synthetic_inverse_mapping omapper, 41, 0.55
      test_synthetic_inverse_mapping omapper, 50, 1.0
      test_synthetic_inverse_mapping omapper, 59, 1.45
      test_synthetic_inverse_mapping omapper, 61, 1.55
      test_synthetic_inverse_mapping omapper, 70, 2.0
      test_synthetic_inverse_mapping omapper, 79, 2.45

  describe "inverse vector mapping", ->
    values = [21,30,39,41,50,59,61,70,79]
    result = generate_mapper().v_map_from_target values
    oresult = generate_mapper(-1).v_map_from_target values

    it "should return an Array", ->
      expect(result).to.be.an.instanceof Array
      expect(oresult).to.be.an.instanceof Array

    it "should be evenly distributed", ->
      expect(result).to.deep.equal ['foo','foo','foo','bar','bar','bar','baz','baz','baz']
      expect(oresult).to.deep.equal ['foo','foo','foo','bar','bar','bar','baz','baz','baz']

    it "should expose synthetic range values", ->
      synthetic = generate_mapper().v_map_from_target values, true
      expected = [0.55, 1.0, 1.45, 1.55, 2.0, 2.45, 2.55, 3.0, 3.45]
      for i in [0...values.length]
        expect(close(synthetic[i], expected[i])).to.be.ok

      osynthetic = generate_mapper(-1).v_map_from_target values, true
      expected = [-0.45, 0.0, 0.45, 0.55, 1.0, 1.45, 1.55, 2.0, 2.45]
      for i in [0...values.length]
        expect(close(osynthetic[i], expected[i])).to.be.ok

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
    omapper = generate_mapper(-1)

    test_mapping = (mapper, key, expected) ->
      expect(mapper.map_to_target key).to.equal expected

    it "should apply map percentages to mappings", ->
      test_mapping mapper, 'foo:0.1', 22
      test_mapping mapper, 'foo:0.5', 30
      test_mapping mapper, 'foo:0.9', 38
      test_mapping mapper, 'bar:0.2', 44
      test_mapping mapper, 'bar:0.4', 48
      test_mapping mapper, 'bar:0.6', 52
      test_mapping mapper, 'bar:0.8', 56
      test_mapping mapper, 'baz:0.3', 66
      test_mapping mapper, 'baz:0.7', 74

    it "should apply map percentages to mappings with offset synthetic ranges", ->
      test_mapping omapper, 'foo:0.1', 22
      test_mapping omapper, 'foo:0.5', 30
      test_mapping omapper, 'foo:0.9', 38
      test_mapping omapper, 'bar:0.2', 44
      test_mapping omapper, 'bar:0.4', 48
      test_mapping omapper, 'bar:0.6', 52
      test_mapping omapper, 'bar:0.8', 56
      test_mapping omapper, 'baz:0.3', 66
      test_mapping omapper, 'baz:0.7', 74

    it "should apply percentages to vector mappings", ->
      values = generate_mapper().v_map_to_target ['foo:0.1', 'foo:0.5', 'foo:0.9']
      expect(values).to.deep.equal new Float64Array [22,30,38]

      values = generate_mapper().v_map_to_target ['bar:0.2', 'bar:0.4', 'bar:0.6', 'bar:0.8']
      expect(values).to.deep.equal new Float64Array [44,48,52,56]

      values = generate_mapper().v_map_to_target ['baz:0.3', 'baz:0.7']
      expect(values).to.deep.equal new Float64Array [66, 74]

    it "should apply percentages to vector mappings with offset synthetic ranges", ->
      values = generate_mapper(-1).v_map_to_target ['foo:0.1', 'foo:0.5', 'foo:0.9']
      expect(values).to.deep.equal new Float64Array [22,30,38]

      values = generate_mapper(-1).v_map_to_target ['bar:0.2', 'bar:0.4', 'bar:0.6', 'bar:0.8']
      expect(values).to.deep.equal new Float64Array [44,48,52,56]

      values = generate_mapper(-1).v_map_to_target ['baz:0.3', 'baz:0.7']
      expect(values).to.deep.equal new Float64Array [66, 74]



