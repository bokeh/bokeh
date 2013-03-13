Collections = require('../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

linspace = (d1,d2,n) ->
  j=0;
  L = new Array();

  while (j<=(n-1))
    tmp1 = j*(d2-d1)/(Math.floor(n)-1);
    tmp2 = Math.ceil((d1+tmp1)*10000)/10000;
    L.push(tmp2);
    j=j+1;

  return L;

d = new Float32Array(600*600)
xs = linspace(0,10,600)
for j in [0..599]
  for i in [0..599]
    d[j*600+i] = Math.sin(xs[i])*Math.cos(xs[j])

x = [0]
y = [0]
dw = [10]
dh = [10]
width = [600]
height = [600]
image = [d]


source = Collections('ColumnDataSource').create(
  data:
    x: x
    y: y
    dw: dw
    dh: dh
    width: width
    height: height
    image: image
)

xdr = Collections('Range1d').create({start: 0, end: 10})
ydr = Collections('Range1d').create({start: 0, end: 10})

image = {
  x: 'x',
  y: 'y',
  dw: 'dw',
  dw_units: 'data'
  dh: 'dh',
  dh_units: 'data'
  image: 'image'
  width: 'width',
  height: 'height',
  type: 'image',
  palette:
    default: 'Spectral-10'
}

test('image', make_glyph_test('image', source, {}, [image], xdr, ydr, true, [600, 600]))

