Collections = require('../../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5},
    {x: 2, y: 4, angle: -0.4},
    {x: 3, y: 3, fill: 'red'},
    {x: 4, y: 2, fill_alpha: 0.3},
    {x: 5, y: 1},
  ]
)

defaults = {
  size: 12
  size_units: 'screen'
}

glyph = {
  type: 'square'
  fill: 'blue'
  x: 'x'
  y: 'y'
}

test('square_glyph', make_glyph_test('square_glyph', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, angle: 0.0},
    {x: 2, y: 4, angle: 0.2},
    {x: 3, y: 3, angle: 0.4},
    {x: 4, y: 2, angle: 0.6},
    {x: 5, y: 1},
  ]
)

glyph = {
  angle:
    field: 'angle'
    default: 1.2
  fill_alpha: 0.5
  type: 'square'
  fill: 'blue'
  x: 'x'
  y: 'y'
}

test('square_glyph_angle', make_glyph_test('square_glyph_angle', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, lwidth: 7},
    {x: 2, y: 4, lwidth: 4},
    {x: 3, y: 3},
    {x: 4, y: 2, lwidth: 2},
    {x: 5, y: 1},
  ]
)

glyph = {
  angle: 0
  line_width:
    field: 'lwidth'
    default: .5
  type: 'square'
  fill: 'blue'
  x: 'x'
  y: 'y'
}

test('square_glyph_line_width', make_glyph_test('square_glyph_line_width', data_source, defaults, glyph, xrange, yrange, {reference_point: {x: 4, y: 2, lwidth:4}}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5},
    {x: 2, y: 4, alpha: .2},
    {x: 3, y: 3, alpha: .4},
    {x: 4, y: 2, alpha: .6},
    {x: 5, y: 1, alpha: .8},
  ]
)

glyph = {
  angle: 0
  line_width: 5
  fill_alpha: 0.2
  line_alpha:
    field: 'alpha'
    default: 0
  type: 'square'
  fill: 'grey'
  size: 18
  x: 'x'
  y: 'y'
}

test('square_glyph_line_alpha', make_glyph_test('square_glyph_line_alpha', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, color: 'green'},
    {x: 2, y: 4},
    {x: 3, y: 3},
    {x: 4, y: 2, color: 'orange'},
    {x: 5, y: 1},
  ]
)

glyph = {
  angle: 0
  type: 'square'
  fill:
    field: 'color'
    default: 'blue'
  x: 'x'
  y: 'y'
}

test('square_glyph_fill', make_glyph_test('square_glyph_fill', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, dash: [1,1]},
    {x: 2, y: 4},
    {x: 3, y: 3},
    {x: 4, y: 2, dash: [1,1,2,1]},
    {x: 5, y: 1},
  ]
)

glyph = {
  angle: 0
  line_width: 4
  line_dash:
    field: 'dash'
    default: [2,2]
  type: 'square'
  fill: 'grey'
  fill_alpha: 0.2
  size: 10
  x: 'x'
  y: 'y'
}

test('square_glyph_linedash', make_glyph_test('square_glyph_linedash', data_source, defaults, glyph, xrange, yrange, {}))
