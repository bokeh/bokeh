Collections = require('../base').Collections
make_glyph_test = require('./test_utils').make_glyph_test
Rand = require('./test_utils').Rand

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
  sources : [{ref : source.ref(), columns : ['x']}]
)

ydr = Collections('DataRange1d').create(
  sources : [{ref : source.ref(), columns : ['y']}]
)

defaults = {
  x : {field:'x', units: 'data'}
  y : {field:'y', units: 'data'}
  width: {field:'width', units: 'data'}
  height: {field:'height', units:'data'}
  fill: {field:'fill', units:'data'}
  radius: {field:'radius', units:'data'}
}

rect_fast = {
    fill : 'red',
    type : 'rect',
    line_color : null
    fast_path : true
    angle: 0
  }

test('rect_perf_fast', make_glyph_test('rect_perf_fast', source, defaults, [rect_fast], xdr, ydr, true, [800, 400]))




xdr = Collections('DataRange1d').create(
  sources : [{ref : source.ref(), columns : ['x']}]
)

ydr = Collections('DataRange1d').create(
  sources : [{ref : source.ref(), columns : ['y']}]
)

rect_slow = {
    type : 'rect',
    fill: {field:'fill', units:'data'}
    line_color : null
    angle: 0.1
  }

test('rect_perf_slow', make_glyph_test('rect_perf_slow', source, defaults, [rect_slow], xdr, ydr, true, [800, 400]))


##
## circle performance tests
##

r = new Rand(123456789)

x = (r.randf()*100 for i in _.range(4000))
y = (r.randf()*100 for i in _.range(4000))
radii = (r.randf()+0.5 for i in _.range(4000))
colors = ("rgb(#{ Math.floor(50+2*val[0]) }, #{ Math.floor(30+2*val[1]) }, 150)" for val in zip(x, y))
source = Collections('ColumnDataSource').create(
  data:
    x: x
    y: y
    radius: radii
    fill: colors
)

xdr = Collections('Range1d').create({start: 0, end: 100})
ydr = Collections('Range1d').create({start: 0, end: 100})

circle_fast = {
  fill : 'red',
  fill_alpha: 0.5
  type : 'circle',
  line_color : null
  fast_path : true
}

test('circle_perf_fast', make_glyph_test('circle_perf_fast', source, defaults, [circle_fast], xdr, ydr, true, [600, 600]))



xdr = Collections('Range1d').create({start: 0, end: 100})
ydr = Collections('Range1d').create({start: 0, end: 100})

circle_fast = {
  fill: {field:'fill', units:'data'}
  fill_alpha: 0.5
  type : 'circle',
  line_color : null
}

test('circle_perf_slow', make_glyph_test('circle_perf_slow', source, defaults, [circle_fast], xdr, ydr, true, [600, 600]))

