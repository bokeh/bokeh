Collections = require('../../base').Collections
make_glyph_test = require('../test_utils').make_glyph_test

range = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data : [
    {x : 1, y : 5},
    {x : 2, y : 4, angle: 0.7},
    {x : 3, y : 3, fill: "red"},
    {x : 4, y : 2, fill_alpha: 0.3},
    {x : 5, y : 1},
  ]
)

defaults = {
  x : 'x'
  y : 'y'
  angle: 0.4
  width: 12
  width_units: "screen"
  height: 15
  height_units: "screen"
}

glyphs = [
    type : 'rect'
    fill: 'blue'
  ,
]

test('rect_glyph', make_glyph_test('rect_glyph', data_source, defaults, glyphs, range, range))

