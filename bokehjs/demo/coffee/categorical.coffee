
require(['main'], (Bokeh) ->



  r = new Bokeh.Random(123456789)

  factors = ["a", "b", "c", "d", "e", "f", "g", "h"]

  data = {
    x0: [0,0,0,0,0,0,0,0]
    x: [50, 40, 65, 10, 25, 37, 80, 60]
    y: factors
  }

  dot = {
    type: 'circle'
    x: 'x'
    y: 'y'
    radius: 6
    radius_units: 'screen'
    fill_color: 'orange'
    line_color: 'green'
    line_width: 2
  }

  line = {
    type: 'segment'
    x0: 'x0'
    y0: 'y'
    x1: 'x'
    y1: 'y'
    line_color: 'green'
    line_width: 4
  }

  options = {
    title: "Categorical Demo"
    dims: [600, 600]
    xrange: [0, 100]
    yrange: factors
    xaxes: "min"
    yaxes: "min"
    tools: "resize"
    legend: false
  }

  plot = Bokeh.Plotting.make_plot([line, dot], data, options)
  Bokeh.Plotting.show(plot)
  )
