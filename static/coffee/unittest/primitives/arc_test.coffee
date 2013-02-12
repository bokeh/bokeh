Collections = require('../../base').Collections
make_glyph_test = require('../test_utils').make_glyph_test

range = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data : [
    {x : 1, y : 5},
    {x : 2, y : 4, direction : 'anticlock', line_color : 'orange'},
    {x : 3, y : 3},
    {x : 4, y : 2},
    {x : 5, y : 1},
  ]
)

defaults = {
  radius: 10
  x : 'x'
  y : 'y'
  start_angle: 0.8
  end_angle: 3.8
  direction: 'clock'
}

glyphs = [
    type : 'arc'
    line_color:
      field: 'line_color'
  ,
]

test('arc_glyph', make_glyph_test('arc_glyph', data_source, defaults, glyphs, range, range))

