
linspace = (d1,d2,n) ->
  j=0;
  L = new Array();
  while (j<=(n-1))
    tmp1 = j*(d2-d1)/(Math.floor(n)-1);
    tmp2 = Math.ceil((d1+tmp1)*10000)/10000;
    L.push(tmp2);
    j=j+1;
  return L;

N = 600

d = new Array(N)
xs = linspace(0,10,N)
for i in [0..(N-1)]
  for j in [0..(N-1)]
    if j == 0
      d[i] = new Array(N)
    d[i][j] = Math.sin(xs[i])*Math.cos(xs[j])

data = {
  image: [d]
}

image = {
  type: 'image',
  x: 0
  y: 0
  dw: 10
  dw_units: 'data'
  dh: 10
  dh_units: 'data'
  image: 'image'
  palette: 'Spectral-10'
}


options = {
  title: "Image Demo"
  dims: [600, 600]
  xrange: [0, 10]
  yrange: [0, 10]
  xaxes: "min"
  yaxes: "min"
  tools: "pan,wheel_zoom,box_zoom,resize,preview"
  legend: false
}

plot = Bokeh.Plotting.make_plot(image, data, options)
Bokeh.Plotting.show(plot)

