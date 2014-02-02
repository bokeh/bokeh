require(['main'], (Bokeh) ->
  xs = ((x/50) for x in _.range(630))
  ys1 = (Math.sin(x) for x in xs)
  ys2 = (Math.cos(x) for x in xs)
  ys3 = (Math.tan(x) for x in xs)

  source = Bokeh.Collections('ColumnDataSource').create(
    data:
      x: xs
      y1: ys1
      y3: ys3
  )
  source2 = Bokeh.Collections('ColumnDataSource').create(
    data:
      x: xs
      y2: ys2
  )

  xdr = Bokeh.Collections('DataRange1d').create(
    sources: [{ref: source.ref(), columns: ['x']}]
  )

  ydr1 = Bokeh.Collections('DataRange1d').create(
    sources: [{ref: source.ref(), columns: ['y1']}]
  )

  ydr2 = Bokeh.Collections('DataRange1d').create(
    sources: [{ref: source2.ref(), columns: ['y2']}]
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
    tools: ['cselect']
    legend: false
    
  }
  plot1 = Bokeh.Plotting.make_plot(
    [scatter1],
    source, _.extend({title: "Plot 1", yrange: ydr1}, options))


  # glyphs2 = Bokeh.Plotting.create_glyphs(
  #   plot1, [scatter2], [source2], null)
  # plot1.add_renderers(g.ref() for g in glyphs2)
  remote_data_select_tool = Bokeh.Collections('RemoteDataSelectTool').create(
    data_source_names: ['ys1', 'ys2', 'ys3'], selected_columns:['ys1'])
  plot1.set_obj('tools', [remote_data_select_tool])




  Bokeh.Plotting.show(plot1))
