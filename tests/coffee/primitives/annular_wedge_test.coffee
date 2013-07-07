Collections = require('base').Collections
make_glyph_test = require('testutils').make_glyph_test

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5},
    {x: 2, y: 4, direction: 'clock'},
    {x: 3, y: 3, fill: 'red'},
    {x: 4, y: 2, inner_radius: 3, fill_alpha: 0.3},
    {x: 5, y: 1, outer_radius: 15},
  ]
)

defaults = {
  inner_radius: 8
  inner_radius_units: 'screen'
  outer_radius: 13
  outer_radius_units: 'screen'
  start_angle: 0.1
  end_angle: 3.9
  direction: 'anticlock'
}

glyph = {
  type: 'annular_wedge'
  fill: 'blue'
  x: 'x'
  y: 'y'
}

test('annular_wedge_glyph', make_glyph_test('annular_wedge_glyph', data_source, defaults, glyph, xrange, yrange, {}))

test('annular_wedge_glyph_legend2', make_glyph_test('annular_wedge_glyph', data_source, defaults, glyph, xrange, yrange, {reference_point:3}))
