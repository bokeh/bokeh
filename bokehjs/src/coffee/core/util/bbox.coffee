export empty = () -> {
  minX:  Infinity
  minY:  Infinity
  maxX: -Infinity
  maxY: -Infinity
}

export positive_x = () -> {
  minX:  Number.MIN_VALUE
  minY: -Infinity
  maxX:  Infinity
  maxY:  Infinity
}

export positive_y = () -> {
  minX:  -Infinity
  minY:  Number.MIN_VALUE
  maxX:  Infinity
  maxY:  Infinity
}

export union = (a, b) ->
  r = {}
  r.minX = Math.min(a.minX, b.minX)
  r.maxX = Math.max(a.maxX, b.maxX)
  r.minY = Math.min(a.minY, b.minY)
  r.maxY = Math.max(a.maxY, b.maxY)
  return r

export class BBox
  constructor: (args...) ->
    switch args.length
      when 0  # new BBox()
        [@x0, @y0, @x1, @y1] = [Infinity, -Infinity, Infinity, -Infinity]
      when 1  # new BBox({x0, y0, x1, y1})
        [{@x0, @y0, @x1, @y1}] = args
      when 2  # new BBox([x0, y0], [x1, y1])
        [[@x0, @y0], [@x1, @y1]] = args
      when 4  # new BBox(x0, y0, x1, y1)
        [@x0, @y0, @x1, @y1] = args

  Object.defineProperty(this.prototype, 'minX', {get: () -> @x0})
  Object.defineProperty(this.prototype, 'minY', {get: () -> @y0})

  Object.defineProperty(this.prototype, 'maxX', {get: () -> @x1})
  Object.defineProperty(this.prototype, 'maxY', {get: () -> @y1})

  Object.defineProperty(this.prototype, 'pt0', {get: () -> [@x0, @y0]})
  Object.defineProperty(this.prototype, 'pt1', {get: () -> [@x1, @y1]})

  Object.defineProperty(this.prototype, 'x', {get: () -> @x0})
  Object.defineProperty(this.prototype, 'y', {get: () -> @x1})
  Object.defineProperty(this.prototype, 'width', {get: () -> @x1 - @x0})
  Object.defineProperty(this.prototype, 'height', {get: () -> @y1 - @y0})

  contains: (x, y) -> x >= @x0 and x <= @x1 and y >= @y0 and y <= @y1

  union: (bbox) ->
    new BBox({
      x0: Math.min(a.x0, b.x0)
      y0: Math.min(a.y0, b.y0)
      x1: Math.max(a.x1, b.x1)
      y1: Math.max(a.y1, b.y1)
    })
