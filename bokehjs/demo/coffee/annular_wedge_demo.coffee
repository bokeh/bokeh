require(['main'], (Bokeh) ->

  N = 20
  r = new Bokeh.Random(123456789)

  xs = (r.randf()*2 for i in _.range(N))
  ys = (r.randf()*2 for i in _.range(N))

  data = {
    x: xs
    y: ys
  }

  glyph = {
    type: 'AnnularWedge'
    source: 'data'
    x: 'x'
    y: 'y'
    size:          .2
    inner_radius:  .1
    outer_radius:  .20
    start_angle:   .5
    end_angle:   1.25
    fill_color: 'white'
    line_color: 'green'
    line_width: 7
  }

  options = {
    title: "Annular Wedge Demo"
    plot_width: 800
    plot_height: 500
    x_range: [0, 2]
    y_range: [0, 2]
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
    sources: { data: data }
    glyphs: [glyph]
    guides: [xaxis, yaxis]
    tools: ["Pan", "WheelZoom"]
  })

 )
