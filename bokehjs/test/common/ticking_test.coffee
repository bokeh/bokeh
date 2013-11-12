
require [
  "underscore",
  "common/ticking",
], (_, ticking) ->

  auto_interval  = ticking.auto_interval
  argsort        = ticking.argsort

  test('auto_interval', ->
    equal(auto_interval(0.0, 100.0), 20)
    equal(auto_interval(0.0, 130.0), 25)
    equal(auto_interval(30.0, 50.0), 2.5)
  )

  test('argsort', ->
    orig = [-3, -2, -1]
    argsorted = argsort(orig)
    expected = [0,1,2]
    deepEqual(argsorted, expected)
    orig2 = [3, -2, -1]
    argsorted2 = argsort(orig2)
    expected2 = [1,2, 0]
    deepEqual(argsorted2, expected2)
    true
  )