
require [
  "common/base",
  "mapper/1d/categorical_mapper",
  "range/range1d",
  "range/factor_range",
], (base, CategoricalMapper, Range1d, FactorRange) ->

  test('categorical_mapper_factor_range1d', () ->
    mapper = new CategoricalMapper({
      source_range: new FactorRange.Model({'factors': ['foo', 'bar', 'baz']})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    equal(mapper.map_to_target('foo'), 30)
    equal(mapper.map_to_target('bar'), 50)
    equal(mapper.map_to_target('baz'), 70)
    deepEqual(mapper.v_map_to_target(['foo', 'bar', 'baz']), [30,50,70])
    equal(mapper.map_from_target(21), 'foo')
    equal(mapper.map_from_target(30), 'foo')
    equal(mapper.map_from_target(39), 'foo')
    equal(mapper.map_from_target(41), 'bar')
    equal(mapper.map_from_target(50), 'bar')
    equal(mapper.map_from_target(59), 'bar')
    equal(mapper.map_from_target(61), 'baz')
    equal(mapper.map_from_target(70), 'baz')
    equal(mapper.map_from_target(79), 'baz')
    deepEqual(mapper.v_map_from_target([21,30,39,41,50,59,61,70,79]), ['foo','foo','foo','bar','bar','bar','baz','baz','baz'])
  )

  test('categorical_mapper_factor_range1d_update_source', () ->
    mapper = new CategoricalMapper({
      source_range: new FactorRange.Model({'factors': ['foo', 'bar', 'baz']})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.get('source_range').set('factors', ['a', 'b', 'c', 'd'])
    equal(mapper.map_to_target('a'), 27.5)
    equal(mapper.map_to_target('b'), 42.5)
    equal(mapper.map_to_target('c'), 57.5)
    equal(mapper.map_to_target('d'), 72.5)
    deepEqual(mapper.v_map_to_target(['a', 'b', 'c', 'd']), [27.5,42.5,57.5,72.5])
    equal(mapper.map_from_target(25), 'a')
    equal(mapper.map_from_target(27.5), 'a')
    equal(mapper.map_from_target(30), 'a')
    equal(mapper.map_from_target(40), 'b')
    equal(mapper.map_from_target(42.5), 'b')
    equal(mapper.map_from_target(45), 'b')
    equal(mapper.map_from_target(55), 'c')
    equal(mapper.map_from_target(57.5), 'c')
    equal(mapper.map_from_target(60), 'c')
    equal(mapper.map_from_target(70), 'd')
    equal(mapper.map_from_target(72.5), 'd')
    equal(mapper.map_from_target(75), 'd')
    deepEqual(mapper.v_map_from_target([25,27.5,30,40,42.5,45,55,57.5,60,70,72.5,75]), ['a','a','a','b','b','b','c','c','c','d','d','d'])
  )
