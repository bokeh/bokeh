
require [
  "common/base",
  "mapper/1d/linear_mapper",
  "range/range1d",
  "range/factor_range",
], (base, LinearMapper, Range1d, FactorRange) ->

  window.Float64Array = Array

  test('linear_mapper_range1d_range1d', () ->
    mapper = new LinearMapper({
      source_range: new Range1d.Model({'start': 0, 'end': 10})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    deepEqual(mapper.get('mapper_state'), [6, 20])
    equal(mapper.map_to_target(-1), 14)
    equal(mapper.map_to_target(0), 20)
    equal(mapper.map_to_target(5), 50)
    equal(mapper.map_to_target(10), 80)
    equal(mapper.map_to_target(11), 86)
    deepEqual(mapper.v_map_to_target([-1,0,5,10,11]), [14,20,50,80,86])
    equal(mapper.map_from_target(14), -1)
    equal(mapper.map_from_target(20), 0)
    equal(mapper.map_from_target(50), 5)
    equal(mapper.map_from_target(80), 10)
    equal(mapper.map_from_target(86), 11)
    deepEqual(mapper.v_map_from_target([14,20,50,80,86]), [-1,0,5,10,11])
  )

  test('linear_mapper_range1d_range1d_update_source_start', () ->
    mapper = new LinearMapper({
      source_range: new Range1d.Model({'start': 0, 'end': 10})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.get('source_range').set('start', -10)
    deepEqual(mapper.get('mapper_state'), [3, 50])
    equal(mapper.map_to_target(-11), 17)
    equal(mapper.map_to_target(-10), 20)
    equal(mapper.map_to_target(0), 50)
    equal(mapper.map_to_target(10), 80)
    equal(mapper.map_to_target(11), 83)
    deepEqual(mapper.v_map_to_target([-11,-10,0,10,11]), [17,20,50,80,83])
    equal(mapper.map_from_target(17), -11)
    equal(mapper.map_from_target(20), -10)
    equal(mapper.map_from_target(50), 0)
    equal(mapper.map_from_target(80), 10)
    equal(mapper.map_from_target(83), 11)
    deepEqual(mapper.v_map_from_target([17,20,50,80,83]), [-11,-10,0,10,11])
  )

  test('linear_mapper_range1d_range1d_update_source_end', () ->
    mapper = new LinearMapper({
      source_range: new Range1d.Model({'start': 0, 'end': 10})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.get('source_range').set('end', 20)
    deepEqual(mapper.get('mapper_state'), [3, 20])
    equal(mapper.map_to_target(-1), 17)
    equal(mapper.map_to_target(0), 20)
    equal(mapper.map_to_target(10), 50)
    equal(mapper.map_to_target(20), 80)
    equal(mapper.map_to_target(21), 83)
    deepEqual(mapper.v_map_to_target([-1,0,10,20,21]), [17,20,50,80,83])
    equal(mapper.map_from_target(17), -1)
    equal(mapper.map_from_target(20), 0)
    equal(mapper.map_from_target(50), 10)
    equal(mapper.map_from_target(80), 20)
    equal(mapper.map_from_target(83), 21)
    deepEqual(mapper.v_map_from_target([17,20,50,80,83]), [-1,0,10,20,21])
  )

  test('linear_mapper_range1d_range1d_update_source', () ->
    mapper = new LinearMapper({
      source_range: new Range1d.Model({'start': 0, 'end': 10})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.set('source_range', new Range1d.Model({'start': -10, 'end': 20}))
    deepEqual(mapper.get('mapper_state'), [2, 40])
    equal(mapper.map_to_target(-11), 18)
    equal(mapper.map_to_target(-10), 20)
    equal(mapper.map_to_target(5), 50)
    equal(mapper.map_to_target(20), 80)
    equal(mapper.map_to_target(21), 82)
    deepEqual(mapper.v_map_to_target([-11,-10,5,20,21]), [18,20,50,80,82])
    equal(mapper.map_from_target(18), -11)
    equal(mapper.map_from_target(20), -10)
    equal(mapper.map_from_target(50), 5)
    equal(mapper.map_from_target(80), 20)
    equal(mapper.map_from_target(82), 21)
    deepEqual(mapper.v_map_from_target([18,20,50,80,82]), [-11,-10,5,20,21])
  )

  test('linear_mapper_range1d_range1d_update_targer_start', () ->
    mapper = new LinearMapper({
      source_range: new Range1d.Model({'start': 0, 'end': 10})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.get('target_range').set('start', 0)
    deepEqual(mapper.get('mapper_state'), [8, 0])
    equal(mapper.map_to_target(-1), -8)
    equal(mapper.map_to_target(0), 0)
    equal(mapper.map_to_target(5), 40)
    equal(mapper.map_to_target(10), 80)
    equal(mapper.map_to_target(11), 88)
    deepEqual(mapper.v_map_to_target([-1,0,5,10,11]), [-8,0,40,80,88])
    equal(mapper.map_from_target(-8), -1)
    equal(mapper.map_from_target(0), 0)
    equal(mapper.map_from_target(40), 5)
    equal(mapper.map_from_target(80), 10)
    equal(mapper.map_from_target(88), 11)
    deepEqual(mapper.v_map_from_target([-8,0,40,80,88]), [-1,0,5,10,11])
  )

  test('linear_mapper_range1d_range1d_update_target_end', () ->
    mapper = new LinearMapper({
      source_range: new Range1d.Model({'start': 0, 'end': 10})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.get('target_range').set('end', 100)
    deepEqual(mapper.get('mapper_state'), [8, 20])
    equal(mapper.map_to_target(-1), 12)
    equal(mapper.map_to_target(0), 20)
    equal(mapper.map_to_target(5), 60)
    equal(mapper.map_to_target(10), 100)
    equal(mapper.map_to_target(11), 108)
    deepEqual(mapper.v_map_to_target([-1,0,5,10,11]), [12,20,60,100,108])
    equal(mapper.map_from_target(12), -1)
    equal(mapper.map_from_target(20), 0)
    equal(mapper.map_from_target(60), 5)
    equal(mapper.map_from_target(100), 10)
    equal(mapper.map_from_target(108), 11)
    deepEqual(mapper.v_map_from_target([12,20,60,100,108]), [-1,0,5,10,11])
  )

  test('linear_mapper_range1d_range1d_update_target', () ->
    mapper = new LinearMapper({
      source_range: new Range1d.Model({'start': 0, 'end': 10})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.set('target_range', new Range1d.Model({'start': 0, 'end': 100}))
    deepEqual(mapper.get('mapper_state'), [10, 0])
    equal(mapper.map_to_target(-1), -10)
    equal(mapper.map_to_target(0), 0)
    equal(mapper.map_to_target(5), 50)
    equal(mapper.map_to_target(10), 100)
    equal(mapper.map_to_target(11), 110)
    deepEqual(mapper.v_map_to_target([-1,0,5,10,11]), [-10,0,50,100,110])
    equal(mapper.map_from_target(-10), -1)
    equal(mapper.map_from_target(0), 0)
    equal(mapper.map_from_target(50), 5)
    equal(mapper.map_from_target(100), 10)
    equal(mapper.map_from_target(110), 11)
    deepEqual(mapper.v_map_from_target([-10,0,50,100,110]), [-1,0,5,10,11])
  )



