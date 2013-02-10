Collections = require('../../base').Collections
make_glyph_test = require('../test_utils').make_glyph_test

range = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data : [
    {x : 1, y : 5, angle : 0.2, length : 50},
    {x : 2, y : 4, angle : 0.3, length : 40},
    {x : 3, y : 3, angle : 0.4, length : 30},
    {x : 4, y : 2, angle : 0.5, length : 20},
    {x : 5, y : 1, angle : 0.6, length : 10},
  ]
)

defaults = {
  x : 'x'
  y : 'y'
  angle :
    field: 'angle'
    units: 'rad'
  length :
    field : 'length'
    units : 'screen'
}

glyphs = [
    type : 'ray'
  ,
]

test('ray_glyph', make_glyph_test('ray_glyph', data_source, defaults, glyphs, range, range))
