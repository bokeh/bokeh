
require [
  "common/base",
  "range/factor_range",
], (base, FactorRange) ->

  test('factor_range_default_values', () ->
    r = new FactorRange.Model()
    deepEqual(r.get('factors'), [])
  )

  test('factor_range_setting', () ->
    r = new FactorRange.Model()
    r.set('factors', ['FOO'])
    deepEqual(r.get('factors'), ['FOO'])
  )

  test('factor_range_minmax', () ->
    r = new FactorRange.Model()
    r.set('factors', ['FOO'])
    equal(r.get('min'), 0.5)
    equal(r.get('max'), 1.5)
    r.set('factors', ['FOO', 'BAR'])
    equal(r.get('min'), 0.5)
    equal(r.get('max'), 2.5)
    r.set('factors', ['A', 'B', 'C'])
    equal(r.get('min'), 0.5)
    equal(r.get('max'), 3.5)
  )