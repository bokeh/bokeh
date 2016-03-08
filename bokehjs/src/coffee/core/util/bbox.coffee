empty = () ->
  return [[Infinity, -Infinity], [Infinity, -Infinity]]

union = (a, b) ->
  a[0][0] = Math.min(a[0][0], b[0][0])
  a[0][1] = Math.max(a[0][1], b[0][1])
  a[1][0] = Math.min(a[1][0], b[1][0])
  a[1][1] = Math.max(a[1][1], b[1][1])
  return a

class BBox
  constructor: (args...) ->
    switch args.length
      when 0  # new BBox()
        [@x0, @y0, @x1, @y1] = [Infinity, -Infinity, Infinity, -Infinity]
      when 2  # new BBox([x0, y0], [x1, y1])
        [[@x0, @y0], [@x1, @y1]] = args
      when 4  # new BBox(x0, y0, x1, y1)
        [@x0, @y0, @x1, @y1] = args

    @xy0 = [@x0, @y0]
    @xy1 = [@x1, @y1]

  contains: (x, y) ->
    return x >= @x0 and x <= @x1 and y >= @y0 and y <= @y1

module.exports =
  BBox: BBox
  empty: empty
  union: union
