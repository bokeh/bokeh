define [
  "underscore",
  "require",
  "common/plot",
  "common/gmap_plot",
  "common/grid_plot",
  "common/plot_context",
  # "pandas/ipython_remote_data",
  # "pandas/pandas_pivot_table",
  # "pandas/pandas_plot_source",
  "range/range1d",
  "range/data_range1d",
  "range/factor_range",
  "range/data_factor_range",
  "renderer/glyph/glyph",
  "renderer/guide/linear_axis",
  "renderer/guide/datetime_axis",
  "renderer/guide/grid",
  "renderer/annotation/legend",
  "renderer/overlay/box_selection",
  "source/object_array_data_source",
  "source/column_data_source",
  "tool/pan_tool",
  "tool/zoom_tool",
  "tool/resize_tool",
  "tool/box_select_tool",
  "tool/data_range_box_select_tool",
  "tool/preview_save_tool",
  "tool/embed_tool",
  "widget/data_slider",
], (underscore, require) ->

  locations =

    Plot:                   'common/plot'
    GMapPlot:               'common/gmap_plot'
    GridPlot:               'common/grid_plot'
    CDXPlotContext:         'common/plot_context'
    PlotContext:            'common/plot_context'
    PlotList:               'common/plot_context'

    IPythonRemoteData:      'pandas/ipython_remote_data'
    PandasPivotTable:       'pandas/pandas_pivot_table'
    PandasPlotSource:       'pandas/pandas_plot_source'

    Range1d:                'range/range1d'
    DataRange1d:            'range/data_range1d'
    FactorRange:            'range/factor_range'
    DataFactorRange:        'range/data_factor_range'

    Glyph:                  'renderer/glyph/glyph_factory'
    LinearAxis:             'renderer/guide/linear_axis'
    DatetimeAxis:           'renderer/guide/datetime_axis'
    Grid:                   'renderer/guide/grid'
    Legend:                 'renderer/annotation/legend'
    BoxSelection:           'renderer/overlay/box_selection'

    ObjectArrayDataSource:  'source/object_array_data_source'
    ColumnDataSource:       'source/column_data_source'

    PanTool:                'tool/pan_tool'
    ZoomTool:               'tool/zoom_tool'
    ResizeTool:             'tool/resize_tool'
    BoxSelectTool:          'tool/box_select_tool'
    DataRangeBoxSelectTool: 'tool/data_range_box_select_tool'
    PreviewSaveTool:        'tool/preview_save_tool'
    EmbedTool:              'tool/embed_tool'

    DataSlider:             'widget/data_slider'

  resolve_ref = (obj, ref) ->
      # ### method: HasProperties::resolve_ref
      #converts a reference into an object
      #also works vectorized now
      if _.isArray(ref)
        return _.map(ref, (ref) -> resolve_ref(obj, ref))
      if not ref
        console.log('ERROR, null reference')
      #this way we can reference ourselves
      # even though we are not in any collection yet
      if ref['type'] == obj.type and ref['id'] == obj.id
        return obj
      else
        module_name = locations[ref['type']]
        module = require(module_name)
        return module.Collection.get(ref['id'])

  return {
    "resolve_ref": resolve_ref
  }