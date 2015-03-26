empty = () ->
  return [[Infinity, -Infinity], [Infinity, -Infinity]]

extend = (a, b) ->
  a[0][0] = Math.min(a[0][0], b[0][0])
  a[0][1] = Math.max(a[0][1], b[0][1])
  a[1][0] = Math.min(a[1][0], b[1][0])
  a[1][1] = Math.max(a[1][1], b[1][1])
  return a

module.exports =
  empty: empty
  extend: extend
