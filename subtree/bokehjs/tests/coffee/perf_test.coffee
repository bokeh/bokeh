Collections = require('../base').Collections
make_glyph_test = require('./testutils').make_glyph_test
Rand = require('./common/random').Rand

zip = () ->
  lengthArray = (arr.length for arr in arguments)
  length = Math.min(lengthArray...)
  for i in [0...length]
    arr[i] for arr in arguments


##
## rect performance tests
##

x = ( (x/30) for x in _.range(600) )
y = (Math.sin(y) for y in x)
widths = (0.01 for i in x)
heights = (0.4 for i in x)
colors = ("rgb(#{ Math.floor(155+100*val) }, #{ Math.floor(100+50*val) }, #{ Math.floor(120-50*val) })" for val in y)
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

defaults = {}

rect_fast = {
  x: 'x'
  y: 'y'
  width: 'width'
  height: 'height'
  fill: 'red',
  type: 'rect',
  line_color: null
  fast_path: true
  angle: 0
}

test('rect_perf_fast', make_glyph_test('rect_perf_fast', source, defaults, rect_fast, xdr, ydr, {dims:[800, 500]}))




xdr = Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['x']}]
)

ydr = Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['y']}]
)

rect_slow = {
  x: 'x'
  y: 'y'
  width: 'width'
  height: 'height'
  type: 'rect',
  fill: 'fill'
  line_color: null
  angle: 0.1
}

test('rect_perf_slow', make_glyph_test('rect_perf_slow', source, defaults, rect_slow, xdr, ydr, {dims:[800, 500]}))


##
## circle performance tests
##

r = new Rand(123456789)

x = (r.randf()*500 for i in _.range(20000))
y = (r.randf()*500 for i in _.range(20000))
radii = (r.randf()+0.8 for i in _.range(20000))
colors = ("rgb(#{ Math.floor(50+2*val[0]/5) }, #{ Math.floor(30+2*val[1]/5) }, 150)" for val in zip(x, y))
source = Collections('ColumnDataSource').create(
  data:
    x: x
    y: y
    radius: radii
    fill: colors
)

xdr = Collections('Range1d').create({start: 0, end: 500})
ydr = Collections('Range1d').create({start: 0, end: 500})

circle_fast = {
  x: 'x'
  y: 'y'
  radius: 'radius'
  radius_units: 'data'
  fill: 'red',
  fill_alpha: 0.5
  type: 'circle',
  line_color: null
  fast_path: true
}

test('circle_perf_fast', make_glyph_test('circle_perf_fast', source, defaults, circle_fast, xdr, ydr, {dims:[600, 600]}))



xdr = Collections('Range1d').create({start: 0, end: 500})
ydr = Collections('Range1d').create({start: 0, end: 500})

circle_slow = {
  x: 'x'
  y: 'y'
  radius: 'radius'
  radius_units: 'data'
  fill: 'fill'
  fill_alpha: 0.5
  type: 'circle',
  line_color: null
}

test('circle_perf_slow', make_glyph_test('circle_perf_slow', source, defaults, circle_slow, xdr, ydr, {dims:[600, 600]}))

