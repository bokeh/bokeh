
require(['main'], (Bokeh) ->

  Bokeh.set_log_level("debug")

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
    type: 'Circle'
    source: "mydata"
    x: 'x'
    y: 'y'
    radius: 'radius'
    fill_color: 'color'
    fill_alpha: 0.6
    line_color: null
  }

  options = {
    title: "Scatter Demo"
    plot_width: 600
    plot_height: 600
    x_range: [0, 100]
    y_range: [0, 100]
  }



  xaxis = {
    type: "auto"
    location: "below"
    grid: true
  }

  yaxis = {
    type: "auto"
    location: "left"
    grid: true
  }

  $("#target").bokeh("figure", {
    options: options
    sources: { mydata: data }
    glyphs: [scatter]
    guides: [xaxis, yaxis]
    tools: ["Pan", "WheelZoom"]
  })

 )
