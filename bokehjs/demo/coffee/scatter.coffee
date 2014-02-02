
require(['main'], (Bokeh) ->



  r = new Bokeh.Random(123456789)

  x = (r.randf()*100 for i in _.range(4000))
  y = (r.randf()*100 for i in _.range(4000))
  data = {
    x: x
    y: y
    radius: (r.randf()+0.3 for i in _.range(4000))
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
    nonselected:  {
      fill_color: 'black'
      line_alpha: 0.1
      fill_alpha: 0.05
    }
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
