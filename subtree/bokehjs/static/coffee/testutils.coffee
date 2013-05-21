#  Convenience plotting functions
base = require("./base")
Collections = base.Collections

zip = () ->
  lengthArray = (arr.length for arr in arguments)
  length = Math.min(lengthArray...)
  for i in [0...length]
    arr[i] for arr in arguments

scatter_plot = (parent, data_source, xfield, yfield, color_field, mark, colormapper, local) ->
  if _.isUndefined(local)
    local = true
  options = {'local' : local}
  if _.isUndefined(mark)
    mark = 'circle'
  if _.isUndefined(color_field)
    color_field = null
  if _.isUndefined(color_mapper) and color_field
    color_mapper = Collections('DiscreteColorMapper').create({
      data_range : Collections('DataFactorRange').create({
        data_source : data_source.ref()
        columns : ['x']
      }, options)
    }, options)

  source_name = data_source.get('name')
  plot_model = Collections('Plot').create(
    data_sources :
      source_name : data_source.ref()
    parent : parent
    , options
  )
  xdr = Collections('DataRange1d').create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [xfield]}]
  }, options)
  ydr = Collections('DataRange1d').create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [yfield]}]
  }, options)
  scatter_plot = Collections("ScatterRenderer").create(
    data_source: data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    xfield: xfield
    yfield: yfield
    color_field: color_field
    color_mapper : color_mapper
    mark: mark
    parent : plot_model.ref()
    , options
  )
  xaxis = Collections('LinearAxis').create({
    'orientation' : 'bottom',
    'parent' : plot_model.ref()
    'data_range' : xdr.ref()

  }, options)
  yaxis = Collections('LinearAxis').create({
    'orientation' : 'left',
    'parent' : plot_model.ref()
    'data_range' : ydr.ref()
  }, options)
  plot_model.set({
    'renderers' : [scatter_plot.ref()],
    'axes' : [xaxis.ref(), yaxis.ref()]
  }, options)
  plot_model


data_table = (parent, data_source, xfield, yfield, color_field, mark, colormapper, local) ->
  if _.isUndefined(local)
    local = true
  options = {'local' : local}
  if _.isUndefined(mark)
    mark = 'circle'
  if _.isUndefined(color_field)
    color_field = null
  if _.isUndefined(color_mapper) and color_field
    color_mapper = Collections('DiscreteColorMapper').create({
      data_range : Collections('DataFactorRange').create({
        data_source : data_source.ref()
        columns : ['x']
      }, options)
    }, options)

  source_name = data_source.get('name')
  table_model = Collections('Table').create(
    data_sources :
      source_name : data_source.ref()
    parent : parent
    , options
  )
  xdr = Collections('DataRange1d').create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [xfield]}]
  }, options)
  ydr = Collections('DataRange1d').create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [yfield]}]
  }, options)
  xmapper = Collections('LinearMapper').create({
    data_range : xdr.ref()
    screen_range : table_model.get('xrange')
  }, options)
  ymapper = Collections('LinearMapper').create({
    data_range : ydr.ref()
    screen_range : table_model.get('yrange')
  }, options)
  scatter_plot = Collections("TableRenderer").create(
    data_source: data_source.ref()
    xfield: xfield
    yfield: yfield
    color_field: color_field
    color_mapper : color_mapper
    mark: mark
    xmapper: xmapper.ref()
    ymapper: ymapper.ref()
    parent : table_model.ref()
    , options
  )
  table_model.set({
    'renderers' : [scatter_plot.ref()],
  }, options)

make_range_and_mapper = (data_source, datafields, padding, screen_range, ordinal, options) ->
    if not ordinal
      range = Collections('DataRange1d').create(
          sources : [
              ref : data_source.ref()
              columns : datafields
          ]
          rangepadding : padding
        , options
      )
      mapper = Collections('LinearMapper').create(
          data_range : range.ref()
          screen_range : screen_range.ref()
        , options
      )
    else
      range = Collections('DataFactorRange').create(
          data_source : data_source.ref()
          columns : [field]
        , options
      )
      mapper = Collections('FactorMapper').create(
          data_range : range.ref()
          screen_range : screen_range.ref()
        , options
      )
    return [range, mapper]

bar_plot = (parent, data_source, xfield, yfield, orientation, local) ->
  if _.isUndefined(local)
    local = true
  options = {'local' : local}
  plot_model = Collections('Plot').create(
    data_sources :
      source_name : data_source.ref()
    parent : parent
    , options
  )
  [xdr, xmapper] = make_range_and_mapper(data_source, [xfield],
    d3.max([1 / (data_source.get('data').length - 1), 0.1]),
    plot_model.get_obj('xrange'), false, options)

  [ydr, ymapper] = make_range_and_mapper(data_source, [yfield],
    d3.max([1 / (data_source.get('data').length - 1), 0.1]),
    plot_model.get_obj('yrange'), false, options)

  bar_plot = Collections("BarRenderer").create(
      data_source: data_source.ref()
      xfield : xfield
      yfield : yfield
      xmapper: xmapper.ref()
      ymapper: ymapper.ref()
      parent : plot_model.ref()
      orientation : orientation
    , options
  )
  xaxis = Collections('LinearAxis').create(
      orientation : 'bottom'
      mapper : xmapper.ref()
      parent : plot_model.ref()
    , options
  )
  yaxis = Collections('LinearAxis').create(
      orientation : 'left',
      mapper : ymapper.ref()
      parent : plot_model.ref()
    , options
  )
  plot_model.set(
      renderers : [bar_plot.ref()],
      axes : [xaxis.ref(), yaxis.ref()]
    , options
  )


line_plot = (parent, data_source, xfield, yfield, local) ->
  if _.isUndefined(local)
    local = true
  options = {'local' : local}
  source_name = data_source.get('name')
  plot_model = Collections('Plot').create(
    data_sources :
      source_name : data_source.ref()
    parent : parent
    , options
  )
  xdr = Collections('DataRange1d').create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [xfield]}]
  }, options)
  ydr = Collections('DataRange1d').create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [yfield]}]
  }, options)

  line_plot = Collections("LineRenderer").create(
    data_source: data_source.ref()
    xfield: xfield
    yfield: yfield
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    parent : plot_model.ref()
    , options
  )
  xaxis = Collections('LinearAxis').create({
    'orientation' : 'bottom',
    'data_range' : xdr.ref()
    'mapper' : 'linear'
    'parent' : plot_model.ref()
  }, options)
  yaxis = Collections('LinearAxis').create({
    'orientation' : 'left',
    'data_range' : ydr.ref()
    'mapper' : 'linear'
    'parent' : plot_model.ref()
  }, options)
  plot_model.set({
    'renderers' : [line_plot.ref()],
    'axes' : [xaxis.ref(), yaxis.ref()]
  }, options)


glyph_plot = (data_source, renderer, dom_element, xdatanames=['x'], ydatanames=['y']) ->
  # Creates a new plot using a data source and a renderer, and optionally
  # adds it to a DOM element
  plot_model = Collections('Plot').create()

  xdr = Collections('DataRange1d').create(
    # should be xdatanames; simplifying for testing
    sources : [{ref : data_source.ref(), columns : ['x']}]
  )
  ydr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['y']}]  # should be ydatanames
  )

  renderer.set('xdata_range', xdr.ref())
  renderer.set('ydata_range', ydr.ref())
  xaxis = Collections('LinearAxis').create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Collections('LinearAxis').create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )


  #if dom_element?
  #  div = $('<div></div>')
  #  dom_element.append(div)
  #  #myrender = () ->
  #  view = new PlotView(model: plot_model)
  #  div.append(view.$el)
  #  view.render()
  #  #_.defer(myrender)
  return plot_model

typeIsArray = ( value ) ->
    value and
        typeof value is 'object' and
        value instanceof Array and
        typeof value.length is 'number' and
        typeof value.splice is 'function' and
        not ( value.propertyIsEnumerable 'length' )

make_glyph_test = (test_name, data_source, defaults, glyphspecs, xrange, yrange, tools=false, dims=[400, 400], axes=true) ->
  return () ->
    expect(0)

    plot_tools = []
    if tools
      pantool = Collections('PanTool').create(
        dataranges: [xrange.ref(), yrange.ref()]
        dimensions: ['width', 'height']
      )
      zoomtool = Collections('ZoomTool').create(
        dataranges: [xrange.ref(), yrange.ref()]
        dimensions: ['width', 'height']
      )
      pstool = Collections('PreviewSaveTool').create()
      plot_tools = [pantool, zoomtool, pstool]
    glyphs = []
    if not typeIsArray(glyphspecs)
      glyphspecs = [glyphspecs]
    if not typeIsArray(data_source)
      for glyphspec in glyphspecs
        glyph = Collections('GlyphRenderer').create({
          data_source: data_source.ref()
          glyphspec: glyphspec
        })
        glyph.set(defaults)
        glyphs.push(glyph)
    else
      for val in zip(glyphspecs, data_source)
        [glyphspec, ds] = val
        glyph = Collections('GlyphRenderer').create({
          data_source: ds.ref()
          glyphspec: glyphspec
        })
        glyph.set(defaults)
        glyphs.push(glyph)
    plot_model = Collections('Plot').create(
      x_range: xrange # TODO .ref() fails?
      y_range: yrange
      canvas_width: dims[0]
      canvas_height: dims[1]
      outer_width: dims[0]
      outer_height: dims[1]
      tools: plot_tools
    )
    plot_model.set(defaults)
    plot_model.add_renderers(g.ref() for g in glyphs)
    if axes
      xaxis1 = Collections('GuideRenderer').create(
        guidespec: {
          type: 'linear_axis'
          dimension: 0
          location: 'min'
          bounds: 'auto'
        }
        parent: plot_model.ref()
      )
      yaxis1 = Collections('GuideRenderer').create(
        guidespec: {
          type: 'linear_axis'
          dimension: 1
          location: 'min'
          bounds: 'auto'
        }
        parent: plot_model.ref()
      )
      xaxis2 = Collections('GuideRenderer').create(
        guidespec: {
          type: 'linear_axis'
          dimension: 0
          location: 'max'
          bounds: 'auto'
        }
        parent: plot_model.ref()
      )
      yaxis2 = Collections('GuideRenderer').create(
        guidespec: {
          type: 'linear_axis'
          dimension: 1
          location: 'max'
          bounds: 'auto'
        }
        parent: plot_model.ref()
      )
      xrule = Collections('GuideRenderer').create(
        guidespec: {
          type: 'rule'
          dimension: 0
          bounds: 'auto'
        }
        parent: plot_model.ref()
      )
      yrule = Collections('GuideRenderer').create(
        guidespec: {
          type: 'rule'
          dimension: 1
          bounds: 'auto'
        }
        parent: plot_model.ref()
      )
      plot_model.add_renderers(
        [xrule.ref(), yrule.ref(), xaxis1.ref(), yaxis1.ref(), xaxis2.ref(), yaxis2.ref()]
      )
    div = $('<div></div>')
    $('body').append(div)
    myrender  =  ->
      view = new plot_model.default_view(model: plot_model)
      div.append(view.$el)
      console.log('Test ' + test_name)
    _.defer(myrender)


window.bokehprettyprint = (obj) ->
  for own key, val of obj
    console.log(key, val)


exports.scatter_plot = scatter_plot
exports.data_table = data_table
exports.make_range_and_mapper = make_range_and_mapper
exports.bar_plot = bar_plot
exports.line_plot = line_plot
exports.glyph_plot = glyph_plot
exports.make_glyph_test = make_glyph_test
