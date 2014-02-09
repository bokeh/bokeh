
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
    ok(_.isEqual(mapper.get('mapper_state'), [6, 20]))
    ok(mapper.map_to_target(-1) == 14)
    ok(mapper.map_to_target(0) == 20)
    ok(mapper.map_to_target(5) == 50)
    ok(mapper.map_to_target(10) == 80)
    ok(mapper.map_to_target(11) == 86)
    ok(_.isEqual(mapper.v_map_to_target([-1,0,5,10,11]), [14,20,50,80,86]))
    ok(mapper.map_from_target(14) == -1)
    ok(mapper.map_from_target(20) == 0)
    ok(mapper.map_from_target(50) == 5)
    ok(mapper.map_from_target(80) == 10)
    ok(mapper.map_from_target(86) == 11)
    ok(_.isEqual(mapper.v_map_from_target([14,20,50,80,86]), [-1,0,5,10,11]))
  )

  test('linear_mapper_range1d_range1d_update_source_start', () ->
    mapper = new LinearMapper({
      source_range: new Range1d.Model({'start': 0, 'end': 10})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.get('source_range').set('start', -10)
    ok(_.isEqual(mapper.get('mapper_state'), [3, 50]))
    ok(mapper.map_to_target(-11) == 17)
    ok(mapper.map_to_target(-10) == 20)
    ok(mapper.map_to_target(0) == 50)
    ok(mapper.map_to_target(10) == 80)
    ok(mapper.map_to_target(11) == 83)
    ok(_.isEqual(mapper.v_map_to_target([-11,-10,0,10,11]), [17,20,50,80,83]))
    ok(mapper.map_from_target(17) == -11)
    ok(mapper.map_from_target(20) == -10)
    ok(mapper.map_from_target(50) == 0)
    ok(mapper.map_from_target(80) == 10)
    ok(mapper.map_from_target(83) == 11)
    ok(_.isEqual(mapper.v_map_from_target([17,20,50,80,83]), [-11,-10,0,10,11]))
  )

  test('linear_mapper_range1d_range1d_update_source_end', () ->
    mapper = new LinearMapper({
      source_range: new Range1d.Model({'start': 0, 'end': 10})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.get('source_range').set('end', 20)
    ok(_.isEqual(mapper.get('mapper_state'), [3, 20]))
    ok(mapper.map_to_target(-1) == 17)
    ok(mapper.map_to_target(0) == 20)
    ok(mapper.map_to_target(10) == 50)
    ok(mapper.map_to_target(20) == 80)
    ok(mapper.map_to_target(21) == 83)
    ok(_.isEqual(mapper.v_map_to_target([-1,0,10,20,21]), [17,20,50,80,83]))
    ok(mapper.map_from_target(17) == -1)
    ok(mapper.map_from_target(20) == 0)
    ok(mapper.map_from_target(50) == 10)
    ok(mapper.map_from_target(80) == 20)
    ok(mapper.map_from_target(83) == 21)
    ok(_.isEqual(mapper.v_map_from_target([17,20,50,80,83]), [-1,0,10,20,21]))
  )

  test('linear_mapper_range1d_range1d_update_source', () ->
    mapper = new LinearMapper({
      source_range: new Range1d.Model({'start': 0, 'end': 10})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.set('source_range', new Range1d.Model({'start': -10, 'end': 20}))
    ok(_.isEqual(mapper.get('mapper_state'), [2, 40]))
    ok(mapper.map_to_target(-11) == 18)
    ok(mapper.map_to_target(-10) == 20)
    ok(mapper.map_to_target(5) == 50)
    ok(mapper.map_to_target(20) == 80)
    ok(mapper.map_to_target(21) == 82)
    ok(_.isEqual(mapper.v_map_to_target([-11,-10,5,20,21]), [18,20,50,80,82]))
    ok(mapper.map_from_target(18) == -11)
    ok(mapper.map_from_target(20) == -10)
    ok(mapper.map_from_target(50) == 5)
    ok(mapper.map_from_target(80) == 20)
    ok(mapper.map_from_target(82) == 21)
    ok(_.isEqual(mapper.v_map_from_target([18,20,50,80,82]), [-11,-10,5,20,21]))
  )

  test('linear_mapper_range1d_range1d_update_targer_start', () ->
    mapper = new LinearMapper({
      source_range: new Range1d.Model({'start': 0, 'end': 10})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.get('target_range').set('start', 0)
    ok(_.isEqual(mapper.get('mapper_state'), [8, 0]))
    ok(mapper.map_to_target(-1) == -8)
    ok(mapper.map_to_target(0) == 0)
    ok(mapper.map_to_target(5) == 40)
    ok(mapper.map_to_target(10) == 80)
    ok(mapper.map_to_target(11) == 88)
    ok(_.isEqual(mapper.v_map_to_target([-1,0,5,10,11]), [-8,0,40,80,88]))
    ok(mapper.map_from_target(-8) == -1)
    ok(mapper.map_from_target(0) == 0)
    ok(mapper.map_from_target(40) == 5)
    ok(mapper.map_from_target(80) == 10)
    ok(mapper.map_from_target(88) == 11)
    ok(_.isEqual(mapper.v_map_from_target([-8,0,40,80,88]), [-1,0,5,10,11]))
  )

  test('linear_mapper_range1d_range1d_update_target_end', () ->
    mapper = new LinearMapper({
      source_range: new Range1d.Model({'start': 0, 'end': 10})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.get('target_range').set('end', 100)
    ok(_.isEqual(mapper.get('mapper_state'), [8, 20]))
    ok(mapper.map_to_target(-1) == 12)
    ok(mapper.map_to_target(0) == 20)
    ok(mapper.map_to_target(5) == 60)
    ok(mapper.map_to_target(10) == 100)
    ok(mapper.map_to_target(11) == 108)
    ok(_.isEqual(mapper.v_map_to_target([-1,0,5,10,11]), [12,20,60,100,108]))
    ok(mapper.map_from_target(12) == -1)
    ok(mapper.map_from_target(20) == 0)
    ok(mapper.map_from_target(60) == 5)
    ok(mapper.map_from_target(100) == 10)
    ok(mapper.map_from_target(108) == 11)
    ok(_.isEqual(mapper.v_map_from_target([12,20,60,100,108]), [-1,0,5,10,11]))
  )

  test('linear_mapper_range1d_range1d_update_target', () ->
    mapper = new LinearMapper({
      source_range: new Range1d.Model({'start': 0, 'end': 10})
      target_range: new Range1d.Model({'start': 20, 'end': 80})
    })
    mapper.set('target_range', new Range1d.Model({'start': 0, 'end': 100}))
    ok(_.isEqual(mapper.get('mapper_state'), [10, 0]))
    ok(mapper.map_to_target(-1) == -10)
    ok(mapper.map_to_target(0) == 0)
    ok(mapper.map_to_target(5) == 50)
    ok(mapper.map_to_target(10) == 100)
    ok(mapper.map_to_target(11) == 110)
    ok(_.isEqual(mapper.v_map_to_target([-1,0,5,10,11]), [-10,0,50,100,110]))
    ok(mapper.map_from_target(-10) == -1)
    ok(mapper.map_from_target(0) == 0)
    ok(mapper.map_from_target(50) == 5)
    ok(mapper.map_from_target(100) == 10)
    ok(mapper.map_from_target(110) == 11)
    ok(_.isEqual(mapper.v_map_from_target([-10,0,50,100,110]), [-1,0,5,10,11]))
  )



