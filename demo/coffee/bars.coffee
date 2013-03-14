Collections = require('../base').Collections
make_glyph_test = require('../testutils').make_glyph_test
Rand = require('../testutils').Rand

zip = () ->
  lengthArray = (arr.length for arr in arguments)
  length = Math.min(lengthArray...)
  for i in [0...length]
    arr[i] for arr in arguments



x = ( (x/30) for x in _.range(600) )
y = (Math.sin(y) for y in x)
widths = (0.01 for i in x)
heights = (0.4 for i in x)
colors = ("rgb(#{ Math.floor(155+100*val) }, #{ Math.floor(100+50*val) }, #{ Math.floor(150-50*val) })" for val in y)
source = Collections('ColumnDataSource').create(
  data:
    x: x
    y: y
    width: widths
    height: heights
    fill: colors
)


xdr = Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['x']}]
)

ydr = Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['y']}]
)

bars = {
  x: 'x'
  y: 'y'
  width: 'width'
  height: 'height'
  type: 'rect',
  fill: 'fill'
  line_color: null
  angle: 0.1
}

test('bars', make_glyph_test('bars', source, {}, [bars], xdr, ydr, true, [800, 400]))


