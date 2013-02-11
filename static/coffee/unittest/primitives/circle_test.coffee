Collections = require('../../base').Collections
make_glyph_test = require('../test_utils').make_glyph_test

range = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data : [
    {x : 1, y : 5, radius:10},
    {x : 2, y : 4},
    {x : 3, y : 3, fill: "red"},
    {x : 4, y : 2, radius: 8, fill_alpha: 0.3},
    {x : 5, y : 1},
  ]
)

defaults = {
  radius:
    units: "screen"
    default: 5
  x : 'x'
  y : 'y'
}

glyphs = [
    type : 'circle'
    fill: 'blue'
  ,
]

test('circle_glyph', make_glyph_test('circle_glyph', data_source, defaults, glyphs, range, range))
