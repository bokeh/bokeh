require(['main'], (Bokeh) ->

  N= 50
  r = new Bokeh.Random(123456789)

  x = (r.randf()*100 for i in _.range(N))
  y = (r.randf()*100 for i in _.range(N))
  data = {
    x: x
    y: y
    radius: (r.randf()+0.3 for i in _.range(N))
    #color: ("rgb(#{ Math.floor(50+2*val[0]) }, #{ Math.floor(30+2*val[1]) }, 150)" for val in _.zip(x, y))
  }


  scatter = {
    type: 'circle'
    x: 'x'
    y: 'y'
    radius: 'radius'
    radius_units: 'data'
    fill_color: '#000FF0'
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
  data2 = {
    x: x
    y: y
    #color: color
  }

  rects = {
    type: 'rect',
    x: 'x'
    y: 'y'
    width: 0.01
    height: 0.4
    angle: 0.1
    fill_color: '#000FF0'
    #fill_color: 'color'
    line_color: null
  }

  options = {
    title: "Scatter Demo"
    dims: [800, 500]
    xaxes: "min"
    yaxes: "min"
    tools: "pan,zoom,resize,preview,select"
    legend: false
  }

  # plot2 = Bokeh.Plotting.make_plot(rects, data, options)
  # Bokeh.Plotting.show(plot2)

  plot = Bokeh.Plotting.make_plot(scatter, data, options)
  Bokeh.Plotting.show(plot)
  )

