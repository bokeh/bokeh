require(['main'], (Bokeh) ->
  N= 630
  N= 10
  r = new Bokeh.Random(123456789)


  xs = ( (x/50) for x in _.range(N) )
  ys = (Math.sin(x) for x in xs)
  color = ("rgb(#{ Math.floor(155+100*val) }, #{ Math.floor(100+50*val) }, #{ Math.floor(150-50*val) })" for val in ys)
  xs = (r.randf()*2 for i in _.range(N))
  xs2 = (.2+x for x in xs)

  ys = (r.randf()*2 for i in _.range(N))
  ys2 = (.2+y for y in ys)

  zs = (r.randf()*2 for i in _.range(N))
  zs2 = (.2+z for z in zs)

  ws = (r.randf()*2 for i in _.range(N))
  ws2 = (.2+w for w in ws)

  beziers = {
    type: 'bezier',
    x0: 'xs'
    y0: 'ys'
    cx0: 'zs'
    cy0: 'ws'

    x1: 'xs2'
    y1: 'ys2'
    cx1: 'zs2'
    cy1: 'ws2'

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
    title: "Bezier Demo"
    dims: [800, 500]
    xaxes: "min"
    yaxes: "min"
    tools: "pan,zoom,resize,preview,select"
    legend: false
  }

  plot2 = Bokeh.Plotting.make_plot(beziers, data, options)
  Bokeh.Plotting.show(plot2)
  
  data = {
    x: xs
    xs: xs
    xs2: xs2
    
    y: ys
    ys: ys
    ys2: ys2

    z: zs
    zs: zs
    zs2: zs2

    w: ws
    ws: ws
    ws2: ws2
    
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
  