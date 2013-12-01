require(['main'], (Bokeh) ->
  N= 630
  N= 10
  r = new Bokeh.Random(123456789)


  xs = ( (x/50) for x in _.range(N) )
  ys = (Math.sin(x) for x in xs)
  color = ("rgb(#{ Math.floor(155+100*val) }, #{ Math.floor(100+50*val) }, #{ Math.floor(150-50*val) })" for val in ys)
  xs = (r.randf()*2 for i in _.range(N))
  ys = (r.randf()*2 for i in _.range(N))

  data = {
    x: xs
    y: ys
    color: color
  }

  rects = {
    type: 'annular_wedge',
    x: 'x'
    y: 'y'
    size:          .2
    inner_radius:  .1
    outer_radius:  .20
    start_angle:   .5
    end_angle:   1.25
    line_alpha: 1
    fill_color: '#0F0FF0'
    #line_color: 'color'
    do_fill:true
  }

  options = {
    title: "Annular Wedge Demo"
    dims: [800, 500]
    xaxes: "min"
    yaxes: "min"
    tools: "pan,zoom,resize,preview,select"
    legend: false
  }

  plot = Bokeh.Plotting.make_plot(rects, data, options)
  Bokeh.Plotting.show(plot)
  )
  