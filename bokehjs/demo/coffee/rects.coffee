require(['main'], (Bokeh) ->

  N= 630
  N= 50
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
    type: 'Rect'
    source: "data"
    x: 'x'
    y: 'y'
    width:  0.05
    height: 0.05
    angle: 0.1
    line_color: 'color'
    line_width: 3
    fill_color: 'white'
  }

  xaxis = {
    type: "auto"
    location: "below"
    grid: false
  }

  yaxis = {
    type: "auto"
    location: "left"
    grid: true
  }

  options = {
    title: "Rects Demo"
    plot_width: 800
    plot_height: 500
  }

  $("#target").bokeh("figure", {
    options: options
    sources: { data: data }
    glyphs: [rects]
    guides: [xaxis, yaxis]
    tools: ["Pan", "WheelZoom" ,"Resize" ,"PreviewSave"]
  })

)
