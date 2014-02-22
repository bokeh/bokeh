
require(['main', 'underscore'], (Bokeh, _) ->

  r = new Bokeh.Random(123456789)

  N = 300

  x = (r.randf()*100 for i in _.range(N))
  y = (r.randf()*100 for i in _.range(N))
  t = ("#{ i }" for i in [0..x.length])
  data = {
    x: x
    y: y
    radius: (r.randf()*2 + 2 for i in _.range(N))
    color: ("rgb(#{ Math.floor(50+2*val[0]) }, #{ Math.floor(30+2*val[1]) }, 150)" for val in _.zip(x, y))
    text: t
  }

  scatter = {
    type: 'circle'
    x: 'x'
    y: 'y'
    #size: 'radius'
    radius: 'radius'
    radius_units: 'data'
    fill_color: 'color'
    fill_alpha: 0.6
    line_color: null
    name: "mydata"
  }

  text = {
    type: 'text'
    x: 'x'
    y: 'y'
    angle: 0
    text:
      field: 'text'
    text_font_size: '8pt'
    text_color: 'black'
    text_alpha: 0.4
    text_align: 'center'
  }

  options = {
    title: "Hover Demo"
    dims: [600, 600]
    xrange: [0, 100]
    yrange: [0, 100]
    xaxes: "min"
    yaxes: "min"
    tools: "pan,wheel_zoom,select,resize,preview,reset,box_zoom,hover"
    legend: false
  }

  plot = Bokeh.Plotting.make_plot([scatter, text], data, options)
  hover = _.find(plot.get_obj('tools'), (t) -> return t.type == "HoverTool")
  hover.set('tooltips', {
    "index"         : "$index"
    "color"         : "$color[hex,swatch]:color"
    "radius"        : "@radius"
    "data (x, y)"   : "(@x, @y)"
    "cursor (x, y)" : "($x, $y)"
    "(vx, vy)"      : "($vx, $vy)"
    "data (x, y)"   : "($x, $y)"
    "canvas (x, y)" : "($sx, $sy)"
  })
  Bokeh.Plotting.show(plot)
  )
