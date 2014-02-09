
require [
  "common/base",
  "mapper/1d/categorical_mapper",
  "range/range1d",
  "range/factor_range",
], (base, CategoricalMapper, Range1d, FactorRange) ->

  test('categorical_mapper_factor_range1d', () ->
    mapper = new CategoricalMapper({
      source_range: new FactorRange.Model({'values': ['foo', 'bar', 'baz']})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    ok(_.isEqual(mapper.get('mapper_state'), [20, 10]))
    ok(mapper.map_to_target('foo') == 30)
    ok(mapper.map_to_target('bar') == 50)
    ok(mapper.map_to_target('baz') == 70)
    ok(_.isEqual(mapper.v_map_to_target(['foo', 'bar', 'baz']), [30,50,70]))
    ok(mapper.map_from_target(21) == 'foo')
    ok(mapper.map_from_target(30) == 'foo')
    ok(mapper.map_from_target(39) == 'foo')
    ok(mapper.map_from_target(41) == 'bar')
    ok(mapper.map_from_target(50) == 'bar')
    ok(mapper.map_from_target(59) == 'bar')
    ok(mapper.map_from_target(61) == 'baz')
    ok(mapper.map_from_target(70) == 'baz')
    ok(mapper.map_from_target(79) == 'baz')
    ok(_.isEqual(mapper.v_map_from_target([21,30,39,41,50,59,61,70,79]), ['foo','foo','foo','bar','bar','bar','baz','baz','baz']))
  )

  test('categorical_mapper_factor_range1d_update_source', () ->
    mapper = new CategoricalMapper({
      source_range: new FactorRange.Model({'values': ['foo', 'bar', 'baz']})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.get('source_range').set('values', ['a', 'b', 'c', 'd'])
    ok(_.isEqual(mapper.get('mapper_state'), [15, 7.5]))
    ok(mapper.map_to_target('a') == 27.5)
    ok(mapper.map_to_target('b') == 42.5)
    ok(mapper.map_to_target('c') == 57.5)
    ok(mapper.map_to_target('d') == 72.5)
    ok(_.isEqual(mapper.v_map_to_target(['a', 'b', 'c', 'd']), [27.5,42.5,57.5,72.5]))
    ok(mapper.map_from_target(25) == 'a')
    ok(mapper.map_from_target(27.5) == 'a')
    ok(mapper.map_from_target(30) == 'a')
    ok(mapper.map_from_target(40) == 'b')
    ok(mapper.map_from_target(42.5) == 'b')
    ok(mapper.map_from_target(45) == 'b')
    ok(mapper.map_from_target(55) == 'c')
    ok(mapper.map_from_target(57.5) == 'c')
    ok(mapper.map_from_target(60) == 'c')
    ok(mapper.map_from_target(70) == 'd')
    ok(mapper.map_from_target(72.5) == 'd')
    ok(mapper.map_from_target(75) == 'd')
    ok(_.isEqual(mapper.v_map_from_target([25,27.5,30,40,42.5,45,55,57.5,60,70,72.5,75]), ['a','a','a','b','b','b','c','c','c','d','d','d']))
  )

  test('categorical_mapper_factor_range1d_min', () ->
    mapper = new CategoricalMapper({
      source_range: new FactorRange.Model({'values': ['foo', 'bar', 'baz']})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    ok(_.isEqual(mapper.get('mapper_state'), [20, 10]))
    ok(mapper.map_to_target('foo', 'min') == 20)
    ok(mapper.map_to_target('bar', 'min') == 40)
    ok(mapper.map_to_target('baz', 'min') == 60)
    ok(_.isEqual(mapper.v_map_to_target(['foo', 'bar', 'baz'], 'min'), [20,40,60]))
  )

  test('categorical_mapper_factor_range1d_max', () ->
    mapper = new CategoricalMapper({
      source_range: new FactorRange.Model({'values': ['foo', 'bar', 'baz']})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    ok(_.isEqual(mapper.get('mapper_state'), [20, 10]))
    ok(mapper.map_to_target('foo', 'max') == 40)
    ok(mapper.map_to_target('bar', 'max') == 60)
    ok(mapper.map_to_target('baz', 'max') == 80)
    ok(_.isEqual(mapper.v_map_to_target(['foo', 'bar', 'baz'], 'max'), [40,60,80]))
  )