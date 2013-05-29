ticking = require("../common/ticking")
nice_2_5_10 = ticking.nice_2_5_10

testutils = require("./testutils")

arrayEqual = (a, b) ->
  a.length is b.length and a.every (elem, i) -> elem is b[i]

test('test_nice_2_5_10', ->
  res = (nice_2_5_10(i) for i in [1..10])
  ok(arrayEqual(res, [1, 2, 5, 5, 5, 10, 10, 10, 10, 10]))
  res = (nice_2_5_10(i, true) for i in [1..10])
  ok(arrayEqual(res, [1, 2, 5, 5, 5, 5, 5, 10, 10, 10]))
)

test('test_nice_10', ->
  res = (nice_2_5_10(i) for i in [1, 5, 10, 15, 80, 100, 115, 1000, 1001])
  ok(arrayEqual(res, [1, 1, 10, 10, 10, 100, 100, 1000, 1000])
)