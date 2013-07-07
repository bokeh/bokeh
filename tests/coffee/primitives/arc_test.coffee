Collections = require('../../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5},
    {x: 2, y: 4, direction: 'clock', line_color: 'orange'},
    {x: 3, y: 3},
    {x: 4, y: 2},
    {x: 5, y: 1},
  ]
)

defaults = {
  radius: 10
  start_angle: 0.8
  end_angle: 3.8
  direction: 'anticlock'
}

glyph = {
  type: 'arc'
  x: 'x'
  y: 'y'
  line_color:
    field: 'line_color'
}

opts = {}

test('arc_glyph', make_glyph_test('arc_glyph', data_source, defaults, glyph, xrange, yrange, opts))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, start_angle: 2, end_angle: 10},
    {x: 2, y: 4, start_angle: 4, end_angle: 8},
    {x: 3, y: 3, start_angle: 6, end_angle: 6},
    {x: 4, y: 2, start_angle: 8, end_angle: 4},
    {x: 5, y: 1, start_angle: 10, end_angle: 2},
  ]
)

glyph = {
  type: 'arc'
  x: 'x'
  y: 'y'
  line_color:
    field: 'line_color'
}

test('arc_glyph_startstop_angle', make_glyph_test('arc_glyph_startstop_angle', data_source, defaults, glyph, xrange, yrange, opts))

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
  line_width:
    field: 'lwidth'
    default: .5
  type: 'arc'
  fill: 'blue'
  x: 'x'
  y: 'y'
}

test('arc_glyph_line_width', make_glyph_test('arc_glyph_line_width', data_source, defaults, glyph, xrange, yrange, opts))
