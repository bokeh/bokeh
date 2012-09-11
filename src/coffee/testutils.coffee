#  Convenience plotting functions
Collections = Bokeh.Collections

Bokeh.scatter_plot = (parent, data_source, xfield, yfield, color_field, mark, colormapper, local) ->
  if _.isUndefined(local)
    local = true
  options = {'local' : local}
  if _.isUndefined(mark)
    mark = 'circle'
  if _.isUndefined(color_field)
    color_field = null
  if _.isUndefined(color_mapper) and color_field
    color_mapper = Collections['DiscreteColorMapper'].create({
      data_range : Collections['DataFactorRange'].create({
        data_source : data_source.ref()
        columns : ['x']
      }, options)
    }, options)

  source_name = data_source.get('name')
  plot_model = Collections['Plot'].create(
    data_sources :
      source_name : data_source.ref()
    parent : parent
    , options
  )
  xdr = Collections['DataRange1d'].create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [xfield]}]
  }, options)
  ydr = Collections['DataRange1d'].create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [yfield]}]
  }, options)
  xmapper = Collections['LinearMapper'].create({
    data_range : xdr.ref()
    screen_range : plot_model.get('xrange')
  }, options)
  ymapper = Collections['LinearMapper'].create({
    data_range : ydr.ref()
    screen_range : plot_model.get('yrange')
  }, options)
  scatter_plot = Collections["ScatterRenderer"].create(
    data_source: data_source.ref()
    xfield: xfield
    yfield: yfield
    color_field: color_field
    color_mapper : color_mapper
    mark: mark
    xmapper: xmapper.ref()
    ymapper: ymapper.ref()
    parent : plot_model.ref()
    , options
  )
  xaxis = Collections['D3LinearAxis'].create({
    'orientation' : 'bottom',
    'mapper' : xmapper.ref()
    'parent' : plot_model.ref()

  }, options)
  yaxis = Collections['D3LinearAxis'].create({
    'orientation' : 'left',
    'mapper' : ymapper.ref()
    'parent' : plot_model.ref()
  }, options)
  plot_model.set({
    'renderers' : [scatter_plot.ref()],
    'axes' : [xaxis.ref(), yaxis.ref()]
  }, options)

Bokeh.data_table = (parent, data_source, xfield, yfield, color_field, mark, colormapper, local) ->
  if _.isUndefined(local)
    local = true
  options = {'local' : local}
  if _.isUndefined(mark)
    mark = 'circle'
  if _.isUndefined(color_field)
    color_field = null
  if _.isUndefined(color_mapper) and color_field
    color_mapper = Collections['DiscreteColorMapper'].create({
      data_range : Collections['DataFactorRange'].create({
        data_source : data_source.ref()
        columns : ['x']
      }, options)
    }, options)

  source_name = data_source.get('name')
  table_model = Collections['Table'].create(
    data_sources :
      source_name : data_source.ref()
    parent : parent
    , options
  )
  xdr = Collections['DataRange1d'].create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [xfield]}]
  }, options)
  ydr = Collections['DataRange1d'].create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [yfield]}]
  }, options)
  xmapper = Collections['LinearMapper'].create({
    data_range : xdr.ref()
    screen_range : table_model.get('xrange')
  }, options)
  ymapper = Collections['LinearMapper'].create({
    data_range : ydr.ref()
    screen_range : table_model.get('yrange')
  }, options)
  scatter_plot = Collections["TableRenderer"].create(
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
      range = Collections['DataRange1d'].create(
          sources : [
              ref : data_source.ref()
              columns : datafields
          ]
          rangepadding : padding
        , options
      )
      mapper = Collections['LinearMapper'].create(
          data_range : range.ref()
          screen_range : screen_range.ref()
        , options
      )
    else
      range = Collections['DataFactorRange'].create(
          data_source : data_source.ref()
          columns : [field]
        , options
      )
      mapper = Collections['FactorMapper'].create(
          data_range : range.ref()
          screen_range : screen_range.ref()
        , options
      )
    return [range, mapper]
Bokeh.make_range_and_mapper = make_range_and_mapper

Bokeh.bar_plot = (parent, data_source, xfield, yfield, orientation, local) ->
  if _.isUndefined(local)
    local = true
  options = {'local' : local}
  plot_model = Collections['Plot'].create(
    data_sources :
      source_name : data_source.ref()
    parent : parent
    , options
  )
  [xdr, xmapper] = Bokeh.make_range_and_mapper(data_source, [xfield],
    d3.max([1 / (data_source.get('data').length - 1), 0.1]),
    plot_model.get_ref('xrange'), false, options)

  [ydr, ymapper] = Bokeh.make_range_and_mapper(data_source, [yfield],
    d3.max([1 / (data_source.get('data').length - 1), 0.1]),
    plot_model.get_ref('yrange'), false, options)

  bar_plot = Collections["BarRenderer"].create(
      data_source: data_source.ref()
      xfield : xfield
      yfield : yfield
      xmapper: xmapper.ref()
      ymapper: ymapper.ref()
      parent : plot_model.ref()
      orientation : orientation
    , options
  )
  xaxis = Collections['D3LinearAxis'].create(
      orientation : 'bottom'
      mapper : xmapper.ref()
      parent : plot_model.ref()
    , options
  )
  yaxis = Collections['D3LinearAxis'].create(
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


Bokeh.line_plot = (parent, data_source, xfield, yfield, local) ->
  if _.isUndefined(local)
    local = true
  options = {'local' : local}
  source_name = data_source.get('name')
  plot_model = Collections['Plot'].create(
    data_sources :
      source_name : data_source.ref()
    parent : parent
    , options
  )
  xdr = Collections['DataRange1d'].create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [xfield]}]
  }, options)
  ydr = Collections['DataRange1d'].create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [yfield]}]
  }, options)
  xmapper = Collections['LinearMapper'].create({
    data_range : xdr.ref()
    screen_range : plot_model.get('xrange')
  }, options)
  ymapper = Collections['LinearMapper'].create({
    data_range : ydr.ref()
    screen_range : plot_model.get('yrange')
  }, options)
  line_plot = Collections["LineRenderer"].create(
    data_source: data_source.ref()
    xfield: xfield
    yfield: yfield
    xmapper: xmapper.ref()
    ymapper: ymapper.ref()
    parent : plot_model.ref()
    , options
  )
  xaxis = Collections['D3LinearAxis'].create({
    'orientation' : 'bottom',
    'mapper' : xmapper.ref()
    'parent' : plot_model.ref()
  }, options)
  yaxis = Collections['D3LinearAxis'].create({
    'orientation' : 'left',
    'mapper' : ymapper.ref()
    'parent' : plot_model.ref()
  }, options)
  plot_model.set({
    'renderers' : [line_plot.ref()],
    'axes' : [xaxis.ref(), yaxis.ref()]
  }, options)


window.bokehprettyprint = (obj) ->
  for own key, val of obj
    console.log(key, val)
