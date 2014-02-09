
require [
  "common/base",
  "range/range1d",
], (base, Range1d) ->

  test('range1d_default_values', () ->
    r = new Range1d.Model()
    equal(r.get('start'), 0)
    equal(r.get('end'), 1)
  )

  test('range1d_setting', () ->
    r = new Range1d.Model()
    r.set('start', 2)
    equal(r.get('start'), 2)
    r.set('end', 3)
    equal(r.get('end'), 3)
  )

  test('range1d_minmax', () ->
    r = new Range1d.Model()
    equal(r.get('min'), 0)
    equal(r.get('max'), 1)
    r.set('start', 2)
    equal(r.get('min'), 1)
    equal(r.get('max'), 2)
    r.set('end', 3)
    equal(r.get('min'), 2)
    equal(r.get('max'), 3)
    r.set('end', -1.1)
    equal(r.get('min'), -1.1)
    equal(r.get('max'), 2)
  )
