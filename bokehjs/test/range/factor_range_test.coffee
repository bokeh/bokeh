
require [
  "underscore",
  "common/base",
  "range/factor_range",
], (_, base, FactorRange) ->

  test('factor_range_default_values', () ->
    r = new FactorRange.Model()
    ok(_.isEqual(r.get('values'), []))
  )

  test('factor_range_setting', () ->
    r = new FactorRange.Model()
    r.set('values', ['FOO'])
    ok(_.isEqual(r.get('values'), ['FOO']))
  )

  test('factor_range_minmax', () ->
    r = new FactorRange.Model()
    r.set('values', ['FOO'])
    ok(r.get('min') == 'FOO')
    ok(r.get('max') == 'FOO')
    r.set('values', ['FOO', 'BAR'])
    ok(r.get('min') == 'FOO')
    ok(r.get('max') == 'BAR')
    r.set('values', ['A', 'B', 'C'])
    ok(r.get('min') == 'A')
    ok(r.get('max') == 'C')
  )