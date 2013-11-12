

define [
  "backbone",
  "source/column_data_source"
], (Backbone, ColumnDataSource) ->

  class PandasPlotSource extends ColumnDataSource.Model
    type: 'PandasPlotSource'

  class PandasPlotSources extends Backbone.Collection
    model: PandasPlotSource

  return {
    "Model": PandasPlotSource,
    "Collection": new PandasPlotSources()
  }
