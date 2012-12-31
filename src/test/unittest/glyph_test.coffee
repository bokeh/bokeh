test('circles_glyph', () ->
  expect(0)
  data_source = Bokeh.Collections.ObjectArrayDataSource.create(
    data : [
      {x : 1, y : 5, z:3, radius:10},
      {x : 2, y : 4, z:3},
      {x : 3, y : 3, z:3, color:"red"},
      {x : 4, y : 2, z:3},
      {x : 5, y : 1, z:3},
    ]
  )
  plot_model = Bokeh.Collections.Plot.create()
  xdr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['x']}]
  )
  ydr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['y']}]
  )
  glyph_renderer = Bokeh.Collections.GlyphRenderer.create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    scatter_size : 10
    color : 'black'
    x : 'x'
    y : 'y'
    glyphs : [
        type : 'circles'
        #xfield: 'x'
        #yfield: 'y'
        #radiusfield: "radius"
        #radius: 5
        color: 'blue'
      ,
        #  type : 'circle'
        #  index : 0
        #,
        #  type : 'square'
        #  index : 1
        #,
        #  type : 'square'
        #  index : 2
        #  color : 'red'
        #,
          #  type : 'square'
          #  index : 2
          #  color : 'green'
          #  x : ['x', 0, 0.1]
          #,
          #  type : 'square'
          #  index : 2
          #  color : 'green'
          #  x : ['x', 0, -0.1]
    ]

  )
  xaxis = Bokeh.Collections['LinearAxis'].create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Bokeh.Collections['LinearAxis'].create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [glyph_renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new Bokeh.PlotView(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('Test circles_glyph')
  _.defer(myrender)
)


test('line_glyph', () ->
  expect(0)
  data_source = Bokeh.Collections.ObjectArrayDataSource.create(
    data : [
      {x : 1, y : 4},
      {x : 2, y : 4},
      {x : 3, y : 3},
      {x : 4, y : 2},
      {x : 5, y : 2},
    ]
  )
  plot_model = Bokeh.Collections.Plot.create()
  xdr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['x']}]
  )
  ydr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['y']}]
  )
  glyph_renderer = Bokeh.Collections.GlyphRenderer.create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    color : 'black'
    x : 'x'
    y : 'y'
    glyphs : [
      type : 'line'
      line_width: 3
      line_color: 'red'
      line_alpha: 0.5
    ]

  )
  xaxis = Bokeh.Collections['LinearAxis'].create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Bokeh.Collections['LinearAxis'].create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [glyph_renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new Bokeh.PlotView(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('Test line_glyph')
  _.defer(myrender)
)

test('rects_glyph', () ->
  expect(0)
  data_source = Bokeh.Collections.ObjectArrayDataSource.create(
    data : [
      {x : 1, y : 2, height: 0.5, width: 0.25}
      {x : 2, y : 3, height: 0.3, width: 0.3, color: "blue"}
      {x : 3, y : 4, height: 0.2, width: 0.35, outline_color: "none"}
      {x : 4, y : 3, height: 0.6, width: 0.4 }
      {x: 4.5, y: 3, height: 0.3, width: 0.4, angle: 20 }
      {x : 5, y : 5, height: 0.15, width: 0.4, alpha: 0.4}
    ]
  )
  plot_model = Bokeh.Collections.Plot.create()
  xdr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['x']}]
  )
  ydr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['y']}]
  )
  glyph_renderer = Bokeh.Collections.GlyphRenderer.create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    scatter_size : 10
    
    glyphs : [
        type : 'rects'
        x : 'x'
        color: 'red'
        outline_color: 'black'
      ,

        type : 'rects'
        color: 'gray'
        x: 'x'
        
        # Uncommenting the following block will cause all of the
        # Y values to be set to 2.5
        #y:
        #  field: 'bogus'
        #  default: 2.5
        #  units: 'data'

        # Uncommenting the following will set a fixed height and width
        # for every rect.(By specifying the name 'bogus' for the field,
        # we can be certain that none of the datapoints will override
        # this height value, and the default will always be used.)
        height:
          field: 'bogus'
          default: 12
          units: 'screen'
        width:
          field: 'bogus'
          default: 0.25
          units: 'data'
    ]

  )
  xaxis = Bokeh.Collections['LinearAxis'].create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Bokeh.Collections['LinearAxis'].create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [glyph_renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new Bokeh.PlotView(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('Test rects_glyph')
  _.defer(myrender)
)


