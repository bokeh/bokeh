ticks = require("../ticks")
calc_bound = ticks.calc_bound
tick_intervals = ticks.tick_intervals
auto_interval = ticks.auto_interval
argsort = ticks.argsort

test('test_calc_bound', ()->
  expect(4)
  equal(calc_bound(3.0, 2, true), 4)
  equal(calc_bound(3.0, 2, false), 2)
  equal(calc_bound(4.0, 2, true), 4)
  equal(calc_bound(4.0, 2, false), 4)
  )


test('test_tick_intervals', ()->
  expect(3)
  equal(tick_intervals(0.0, 100.0, 13), 10)
  equal(tick_intervals(0.0, 120.0, 3), 50)
  equal(tick_intervals(0.0, 100.0, 5), 25)

  )
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


test('_sorted', ->
  ab = [2, 4, 7]
  deepEqual(_.sorted(ab), [2, 4, 7])
  ab = [2, 4, 7]
  bc = _.sorted(ab)
  bc[0] = 'a'
  deepEqual(ab, [2, 4, 7])

  ab = [2, -4, 7]
  deepEqual([-4, 2, 7], _.sorted(ab))
  null
  )
