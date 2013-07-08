Collections = require('../../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5},
    {x: 2, y: 4, text: 'bar', text_color: 'orange'},
    {x: 3, y: 3},
    {x: 4, y: 2},
    {x: 5, y: 1},
  ]
)

defaults = {
  text: 'foo'
  angle: 0
}

glyph = {
  type: 'text'
  x: 'x'
  y: 'y'
  angle: -0.2
}

test('text_glyph', make_glyph_test('text_glyph', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, angle: .2},
    {x: 2, y: 4, text: 'bar', angle: .4},
    {x: 3, y: 3, angle: .6},
    {x: 4, y: 2, angle: .8},
    {x: 5, y: 1, angle: 1},
  ]
)

glyph = {
  angle:
    fields: 'angle'
    default: 0
  type: 'text'
  x: 'x'
  y: 'y'
}

test('text_glyph_angle', make_glyph_test('text_glyph_angle', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, text_baseline: 'middle'},
    {x: 2, y: 4, text: 'bar', text_baseline: 'top'},
    {x: 3, y: 3, text_baseline: 'top'},
    {x: 4, y: 2, text_baseline: 'bottom'},
    {x: 5, y: 1, text_baseline: 'bottom'},
  ]
)

glyph = {
  type: 'text'
  x: 'x'
  y: 'y'
}

test('text_glyph_baseline', make_glyph_test('text_glyph_baseline', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, text_align: 'center'},
    {x: 2, y: 4, text: 'bar', text_align: 'left'},
    {x: 3, y: 3, text_align: 'left'},
    {x: 4, y: 2, text_align: 'right'},
    {x: 5, y: 1, text_align: 'right'},
  ]
)

glyph = {
  type: 'text'
  x: 'x'
  y: 'y'
}

test('text_glyph_align', make_glyph_test('text_glyph_align', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, text_alpha: 1},
    {x: 2, y: 4, text: 'bar', text_alpha: .8},
    {x: 3, y: 3, text_alpha: .6},
    {x: 4, y: 2, text_alpha: .4},
    {x: 5, y: 1, text_alpha: .2},
  ]
)

glyph = {
  type: 'text'
  text_alpha:
    field: 'alpha'
    default: 0
  x: 'x'
  y: 'y'
}

test('text_glyph_alpha', make_glyph_test('text_glyph_alpha', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, text_font_size: '8px'},
    {x: 2, y: 4, text: 'bar', text_font_size: "20px"},
    {x: 3, y: 3, text_font_size: "12px"},
    {x: 4, y: 2, text_font_size: "150%"},
    {x: 5, y: 1, text_font_size: '18pt'},
  ]
)

glyph = {
  type: 'text'
  x: 'x'
  y: 'y'
}

test('text_glyph_size', make_glyph_test('text_glyph_size', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, text_font_style: 'italic'},
    {x: 2, y: 4, text: 'bar', text_font_style: 'normal'},
    {x: 3, y: 3},
    {x: 4, y: 2, text_font_style: 'bold'},
    {x: 5, y: 1},
  ]
)

glyph = {
  text_font_size: '16pt'
  type: 'text'
  x: 'x'
  y: 'y'
}

test('text_glyph_style', make_glyph_test('text_glyph_style', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, text_color: 'green'},
    {x: 2, y: 4, text: 'bar', text_color: 'red'},
    {x: 3, y: 3},
    {x: 4, y: 2, text_color: 'blue'},
    {x: 5, y: 1},
  ]
)

glyph = {
  type: 'text'
  x: 'x'
  y: 'y'
}

test('text_glyph_color', make_glyph_test('text_glyph_color', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, text: 'cursive', text_font: 'cursive'},
    {x: 2, y: 4, text: 'monospace', text_font: 'monospace'},
    {x: 3, y: 3, text: 'papyrus', text_font: 'papyrus'},
    {x: 4, y: 2, text: 'garamond', text_font: 'garamond'},
    {x: 5, y: 1, text: 'menlo', text_font: 'menlo'},
  ]
)

glyph = {
  type: 'text'
  x: 'x'
  y: 'y'
}

test('text_glyph_font', make_glyph_test('text_glyph_font', data_source, defaults, glyph, xrange, yrange, {}))
