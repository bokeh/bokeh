Collections = require('../../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, angle: 1.3, length: 0},
    {x: 2, y: 4, angle: 1.2, length: 40, line_color: 'blue'},
    {x: 3, y: 3, angle: 1.1, length: 30},
    {x: 4, y: 2, angle: 1.0, length: 20},
    {x: 5, y: 1, angle: 0.9, length: 10},
  ]
)

defaults = {}

glyph = {
  type: 'ray'
  x: 'x'
  y: 'y'
  angle: 'angle'
  length: 'length'
}

test('ray_glyph', make_glyph_test('ray_glyph', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, angle: 1.3, length: 0, lwidth: 4},
    {x: 2, y: 4, angle: 1.2, length: 40},
    {x: 3, y: 3, angle: 1.1, length: 30, lwidth: 1},
    {x: 4, y: 2, angle: 1.0, length: 20, lwidth: 2},
    {x: 5, y: 1, angle: 0.9, length: 10},
  ]
)


glyph = {
  type: 'ray'
  line_width:
    field: 'lwidth'
    default: .5
  x: 'x'
  y: 'y'
  angle: 'angle'
  length: 'length'
}

test('ray_glyph_line_width', make_glyph_test('ray_glyph_line_width', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, angle: 1.3, length: 0, alpha: .2, lwidth: 4},
    {x: 2, y: 4, angle: 1.2, length: 40, alpha: .4},
    {x: 3, y: 3, angle: 1.1, length: 30, alpha: .6, lwidth: 2},
    {x: 4, y: 2, angle: 1.0, length: 20, alpha: .8, lwidth: 6},
    {x: 5, y: 1, angle: 0.9, length: 10, alpha: 1},
  ]
)


glyph = {
  type: 'ray'
  line_width:
    field: 'lwidth'
    default: .5
  line_alpha:
    field: 'alpha'
    default: 0
  x: 'x'
  y: 'y'
  angle: 'angle'
  length: 'length'
}

test('ray_glyph_line_alpha', make_glyph_test('ray_glyph_line_alpha', data_source, defaults, glyph, xrange, yrange, {reference_point:3}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, angle: 1.3, length: 0, dash: [3,1,4,3]},
    {x: 2, y: 4, angle: 1.2, length: 40},
    {x: 3, y: 3, angle: 1.1, length: 30},
    {x: 4, y: 2, angle: 1.0, length: 20},
    {x: 5, y: 1, angle: 0.9, length: 10, dash: [1,1]},
  ]
)

glyph = {
  type: 'ray'
  line_width: 2
  line_dash:
    field: 'dash'
    default: [2,2]
  x: 'x'
  y: 'y'
  angle: 'angle'
  length: 'length'
}

test('ray_glyph_line_dash', make_glyph_test('ray_glyph_line_dash', data_source, defaults, glyph, xrange, yrange, {}))
