test('circles_glyph', () ->
  expect(0)
  data_source = Bokeh.Collections.ObjectArrayDataSource.create(
    data : [
      {x : 1, y : 5, z:3, radius:10},
      {x : 2, y : 4, z:3},
      {x : 3, y : 3, z:3, color:"red"},
      {x : 4, y : 2, z:3, radius:8, alpha:0.5},
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
      {x: 1, y: 4}
      {x: 2, y: 4}
      {x: 3, y: 3}
      {x: 4, y: 2}
      {x: 5, y: 2}
    ]
  )
  ds2 = Bokeh.Collections.ObjectArrayDataSource.create(
    data: [
      {x2: 1, y2: 1}
      {x2: 2, y2: 1.5}
      {x2: 2.5, y2: 3}
      {x2: 3, y2: 3.5}
      {x2: 3.5, y2: 2.8}
      {x2: 4, y2: 2.9}
      {x2: 5, y2: 3.5}
    ]
  )
  plot_model = Bokeh.Collections.Plot.create()
  xdr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['x']},
               {ref : ds2.ref(), columns : ['x2']}]
  )
  ydr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['y']},
               {ref : ds2.ref(), columns: ['y2']}]
  )
  glyph_renderer = Bokeh.Collections.GlyphRenderer.create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [
        type : 'line'
        line_width: 4
        line_color: 'red'
        alpha: 1
    ]
  )
  renderer2 = Bokeh.Collections.GlyphRenderer.create(
    data_source: ds2.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [
        type : 'line'
        x: "x2"
        y: "y2"
        line_width: 2
        line_color: 'blue'
        alpha: 0.5
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
    renderers : [glyph_renderer.ref(), renderer2.ref()],
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

test('stacked_lines_glyph', () ->
  expect(0)
  data_source = Bokeh.Collections.ObjectArrayDataSource.create(
    data : [
      {x: 1, y0: 1, y1: 3}
      {x: 2, y0: 1.5, y1: 2}
      {x: 3, y0: 3.5, y1: 0.2}
      {x: 4, y0: 1.5, y1: 0.75}
      {x: 5, y0: 2.5, y1: 0.5}
    ]
  )
  plot_model = Bokeh.Collections.Plot.create()
  xdr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['x']}]
  )
  ydr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['y0','y1']}]
  )
  glyph_renderer = Bokeh.Collections.GlyphRenderer.create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [
        type : 'stacked_lines'
        x: 'x',
        y: ['y0', 'y1']
        fills: {
          y0:
            fill_color: "red"
            fill_alpha: 0.5
          y1:
            fill_color: "blue"
            fill_alpha: 0.5
        }
        lines: {
          y0:
            line_width: 1
            line_color: "black"
            line_alpha: 0.8
          y1:
            line_width: 1
            line_color: "black"
            line_alpha: 0.8
        }
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
  console.log('Test stacked_lines_glyph')
  _.defer(myrender)
)

test('stacked_rects_glyph', () ->
  expect(0)
  data_source = Bokeh.Collections.ObjectArrayDataSource.create(
    data : [
      {x: 1, y0: 1, y1: 3, y2: 1.5}
      {x: 2, y0: 1.5, y1: 2, y2: 1}
      {x: 3, y0: 6, y1: 0.1, y2: 0.1}
      {x: 4, y0: 1.5, y1: 0.75, y2: 1.25}
      {x: 5, y0: 2.5, y1: 0.5, y2: 1}
    ]
  )
  plot_model = Bokeh.Collections.Plot.create()
  xdr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['x']}]
  )
  ydr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['y0','y1','y2']}]
  )
  glyph_renderer = Bokeh.Collections.GlyphRenderer.create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [
        type : 'stacked_rects'
        x: 'x',
        y: ['y0', 'y1', 'y2']
        fills: {
          y0:
            fill_color: "red"
            fill_alpha: 0.5
          y1:
            fill_color: "blue"
            fill_alpha: 0.5
          y2:
            fill_color: "orange"
            fill_alpha: 0.5
        }
        lines: {
          y0:
            line_width: 1
            line_color: "black"
            line_alpha: 0.8
          y1:
            line_width: 1
            line_color: "black"
            line_alpha: 0.8
          y2:
            line_width: 1
            line_color: "black"
            line_alpha: 0.8
        }
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
  console.log('Test stacked_rects_glyph')
  _.defer(myrender)
)

test('rects_glyph', () ->
  expect(0)
  data_source = Bokeh.Collections.ObjectArrayDataSource.create(
    data : [
      {x: 1, y: 2, height: 0.5, width: 0.25}
      {x: 2, y: 3, height: 0.3, width: 0.3, color: "blue"}
      {x: 3, y: 4, height: 0.2, width: 0.35, outline_color: "none"}
      {x: 4, y: 3, height: 0.6, width: 0.4 }
      {x: 4.5, y: 3, height: 0.3, width: 0.4, angle: 20 }
      {x: 5, y: 5, height: 0.15, width: 0.4, alpha: 0.4}
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

test('rects_glyph2', () ->
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
  renderer = Bokeh.Collections.GlyphRenderer.create(
    data_source : data_source.ref()

    glyphs : [
        type : 'rects'
        x : 'x'
        color: 'blue'
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

  #Bokeh.glyph_plot(data_source, renderer, $('body'))
  plot_model = Bokeh.glyph_plot(data_source, renderer)
  div = $('<div></div>')
  $('body').append(div)
  myrender = ->
    div.append("<h2>rects_glyph_2</h2>")
    view = new Bokeh.PlotView(model: plot_model)
    div.append(view.$el)
    view.render()
  _.defer(myrender)

)


test('rect_regions_glyph_test', () ->
  expect(0)
  data_source = Bokeh.Collections.ObjectArrayDataSource.create(
    data : [
      {left: 1, right: 1.5, top: 1.5, bottom: 1.0}
      {left: 2, right: 2.6, top: 2.3, color: "blue"}
      {left: 3, right: 3.2, top: 3.2, outline_color: "none"}
      {left: 4, right: 4.2, top: 2.6, bottom: 1.0}
      {left: 4.8, right: 5.2, top: 2.6, alpha: 0.4}
    ]
  )
  plot_model = Bokeh.Collections.Plot.create()
  xdr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['left', 'right']}]
  )
  ydr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['bottom', 'top']}]
  )
  renderer = Bokeh.Collections.GlyphRenderer.create(
    data_source: data_source.ref()
    xdata_range: xdr.ref()
    ydata_range: ydr.ref()
    glyphs : [
      type : 'rectregions'
      left: 'left'
      right: 'right'
      bottom:
        field: 'bogus'
        default: 1.0
        units: 'data'

      color: 'red'
      outline_color: 'black'
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
    renderers : [renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )

  div = $('<div></div>')
  $('body').append(div)
  myrender = ->
    div.append("<h2>rect_regions_glyph_test</h2>")
    view = new Bokeh.PlotView(model: plot_model)
    div.append(view.$el)
    view.render()
  _.defer(myrender)
)


test('vector_data_test', () ->
  expect(0)
  data_source = Bokeh.Collections.ColumnDataSource.create(
    data : {
      x : [1, 2, 3, 4, 4.5, 5]
      y : [2, 3, 4, 3, 3, 5]
      height : [0.5, 0.3, 0.2, 0.6, 0.3, 0.15]
      width : [0.25, 0.3, 0.35, 0.4, 0.4, 0.4]
    }
  )
  renderer = Bokeh.Collections.GlyphRenderer.create(
    data_source : data_source.ref()

    glyphs : [
        type : 'rects'
        x : 'x'
        color: 'blue'
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

  #Bokeh.glyph_plot(data_source, renderer, $('body'))
  plot_model = Bokeh.glyph_plot(data_source, renderer)
  div = $('<div></div>')
  $('body').append(div)
  myrender = ->
    div.append("<h2>vector_data_test</h2>")
    view = new Bokeh.PlotView(model: plot_model)
    div.append(view.$el)
    view.render()
  _.defer(myrender)
)

test('area_glyph', () ->
  expect(0)
  data_source = Bokeh.Collections.ObjectArrayDataSource.create(
    data : [
      {x: 1, y: 1}
      {x: 2, y: 2}
      {x: 2, y: 3}
      {x: 1, y: 3}
      {x: 0.5, y: 2}
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
    glyphs : [
        type: 'area'
        color: 'blue'
        outline_width: 4
        outline_color: 'black'
        alpha: 0.6
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
  console.log('Test area_glyph')
  _.defer(myrender)
)


test('boxplots_test', () ->
  expect(0)
  data_source = Bokeh.Collections.ObjectArrayDataSource.create(
    # style ['plain', 'notched', 'tufte']
    # x, median, width, q1, q3
    # fill, upper_fill, lower_fill
    # center_line_width, center_line_color, center_line_alpha, center_line_dash
    # outline_width, outline_color, outline_alpha, outline_dash
    # upper_line_width, upper_line_color, upper_line_alpha, upper_line_dash
    # lower_line_width, lower_line_color, lower_line_alpha, lower_line_dash
    # whisker_size, whisker_line_width, whisker_line_alphe
    # upper_whisker_size, upper_whisker_line_width, upper_whisker_line_alphe
    # lower_whisker_size, lower_whisker_line_width, lower_whisker_line_alphe
    # outliers
    # outliers_glyph, outliers_size, outliers_fill, outliers_outline, outliers_alpha
    # mean
    # mean_glyph, mean_size, mean_fill, mean_outline, mean_alpha
    data : [
      {x: 1, median: 4.0, size: 0.4, q1: 3.0, q3: 5.2 }
      {x: 2, median: 4.2, size: 0.6, q1: 3.0, q3: 5.0 }
      {x: 4, median: 3.7, size: 1.4, q1: 2.9, q3: 4.5 }
      {x: 6, median: 3.5, size: 0.5, q1: 2.6, q3: 4.1 }
    ]
  )

  plot_model = Bokeh.Collections.Plot.create()

  xdr = Bokeh.Collections.Range1d.create()
  xdr.set('start', 0)
  xdr.set('end', 7)

  ydr = Bokeh.Collections.Range1d.create()
  ydr.set('start', -2)
  ydr.set('end', 10)

  glyph_renderer = Bokeh.Collections.GlyphRenderer.create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [
        type: 'boxplots'
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
  console.log('Test boxplots_glyph')
  _.defer(myrender)

)
