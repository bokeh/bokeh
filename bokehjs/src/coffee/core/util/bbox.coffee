export empty = () -> {
  minX:  Infinity,
  minY:  Infinity,
  maxX: -Infinity,
  maxY: -Infinity
}

export union = (a, b) ->
  r = {}
  r.minX = Math.min(a.minX, b.minX)
  r.maxX = Math.max(a.maxX, b.maxX)
  r.minY = Math.min(a.minY, b.minY)
  r.maxY = Math.max(a.maxY, b.maxY)
  return r
