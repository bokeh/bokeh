require(['main'], (Bokeh) ->

  N= 2000
  r = new Bokeh.Random(123456789)

  x = (r.randf()*100 for i in _.range(N))
  y = (r.randf()*100 for i in _.range(N))
  data = {
    x: x
    y: y
    radius: (r.randf()+0.3 for i in _.range(N))
    color: ("rgb(#{ Math.floor(50+2*val[0]) }, #{ Math.floor(30+2*val[1]) }, 150)" for val in _.zip(x, y))
  }

  scatter = {
    type: 'circle'
    x: 'x'
    y: 'y'
    radius: 'radius'
    radius_units: 'data'
    fill_color: 'color'
    fill_alpha: 0.6
    line_color: null
  }

  options = {
    title: "Scatter Demo"
    dims: [600, 600]
    xrange: [0, 100]
    yrange: [0, 100]
    xaxes: "min"
    yaxes: "min"
    tools: true
    legend: false
  }

  plot = Bokeh.Plotting.make_plot(scatter, data, options)
  Bokeh.Plotting.show(plot)
  )

