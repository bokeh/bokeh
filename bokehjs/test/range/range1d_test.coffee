
require [
  "common/base",
  "range/range1d",
], (base, Range1d) ->

  test('range1d_default_values', () ->
    r = new Range1d.Model()
    ok(r.get('start') == 0)
    ok(r.get('end') == 1)
  )

  test('range1d_setting', () ->
    r = new Range1d.Model()
    r.set('start', 2)
    ok(r.get('start') == 2)
    r.set('end', 3)
    ok(r.get('end') == 3)
  )

  test('range1d_minmax', () ->
    r = new Range1d.Model()
    ok(r.get('min') == 0)
    ok(r.get('max') == 1)
    r.set('start', 2)
    ok(r.get('min') == 1)
    ok(r.get('max') == 2)
    r.set('end', 3)
    ok(r.get('min') == 2)
    ok(r.get('max') == 3)
    r.set('end', -1.1)
    ok(r.get('min') == -1.1)
    ok(r.get('max') == 2)
  )
