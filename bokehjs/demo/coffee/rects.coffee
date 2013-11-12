
xs = ( (x/50) for x in _.range(630) )
ys = (Math.sin(x) for x in xs)
color = ("rgb(#{ Math.floor(155+100*val) }, #{ Math.floor(100+50*val) }, #{ Math.floor(150-50*val) })" for val in ys)

data = {
  x: xs
  y: ys
  color: color
}

rects = {
  type: 'rect',
  x: 'x'
  y: 'y'
  width: 0.01
  height: 0.4
  angle: 0.1
  fill_color: 'color'
  line_color: null
}

options = {
  title: "Scatter Demo"
  dims: [800, 500]
  xaxes: "min"
  yaxes: "min"
  tools: "pan,zoom,resize,preview"
  legend: false
}

plot = Bokeh.Plotting.make_plot(rects, data, options)
Bokeh.Plotting.show(plot)
