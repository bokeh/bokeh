require(['main'], (Bokeh) ->
  xs = ((x/50) for x in _.range(630))
  ys1 = (Math.sin(x) for x in xs)
  ys2 = (Math.cos(x) for x in xs)
  ys3 = (Math.tan(x) for x in xs)

  source = Bokeh.Collections('ColumnDataSource').create(
    data:
      x: xs
      y1: ys1
      y2: ys2
      y3: ys3
  )

  xdr = Bokeh.Collections('DataRange1d').create(
    sources: [{ref: source.ref(), columns: ['x']}]
  )

  ydr1 = Bokeh.Collections('DataRange1d').create(
    sources: [{ref: source.ref(), columns: ['y1']}]
  )

  ydr2 = Bokeh.Collections('DataRange1d').create(
    sources: [{ref: source.ref(), columns: ['y2']}]
  )

  scatter1 = {
    type: 'circle'
    x: 'x'
    y: 'y1'
    radius: 8
    radius_units: 'screen'
    fill_color: 'red'
    line_color: 'black'
  }

  scatter2 = {
    type: 'rect'
    x: 'x'
    y: 'y2'
    width: 5
    width_units: 'screen'
    height: 5
    height_units: 'screen'
    fill_color: 'blue'
  }
  scatter3 = {
    type: 'rect'
    x: 'x'
    y: 'y3'
    width: 5
    width_units: 'screen'
    height: 5
    height_units: 'screen'
    fill_color: 'blue'
  }

  options = {
    title: "Scatter Demo"
    dims: [600, 600]
    xrange: xdr
    xaxes: "min"
    yaxes: "min"
    tools: false
    legend: false
    
  }

  plot1 = Bokeh.Plotting.make_plot(
    scatter1,
    source, _.extend({title: "Plot 1", yrange: ydr1}, options))
  console.log("plot1 created")
  _.delay((->
    console.log("adding another renderer scatter2")
    glyphs = Bokeh.Plotting.create_glyphs(plot1, [scatter2], [source])
    plot1.add_renderers(g.ref() for g in glyphs)),
    500)
  _.delay((->
    console.log("adding another renderer scatter3")
    glyphs = Bokeh.Plotting.create_glyphs(plot1, [scatter3], [source])
    p1 = plot1
    plot1.add_renderers(g.ref() for g in glyphs)),
    1000)
  _.delay((->
    console.log("clear renderers")
    plot1.set('renderers', [])), 1500)

  _.delay((->    
    glyphs = Bokeh.Plotting.create_glyphs(plot1, [scatter1, scatter3], [source])
    p1 = plot1
    plot1.add_renderers(g.ref() for g in glyphs)),
    3000)


   #plot2 = Bokeh.Plotting.make_plot(scatter2, source, _.extend({title: "Plot 2", yrange: ydr2}, options))

  Bokeh.Plotting.show(plot1))
