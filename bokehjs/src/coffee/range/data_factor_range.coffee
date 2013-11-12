
define [
  "underscore",
  "backbone",
  "range/factor_range"
], (_, Backbone, FactorRange) ->

  class DataFactorRange extends FactorRange.Model
    type: 'DataFactorRange'

    _get_values: () =>
      columns = (@get_obj('data_source').getcolumn(x) for x in @get('columns'))
      columns = _.reduce(columns, ((x, y) -> return x.concat(y)), [])
      temp = {}
      for val in columns
        temp[val] = true
      uniques = _.keys(temp)
      uniques = _.sortBy(uniques, ((x) -> return x))
      return uniques

    dinitialize: (attrs, options) ->
      super(attrs, options)
      @register_property
      @register_property('values', @_get_values, true)
      @add_dependencies('values', this, ['data_source', 'columns'])
      @add_dependencies('values', @get_obj('data_source'),
        ['data_source', 'columns'])

    defaults: () ->
      return {
        values: []
        columns: []
        data_source: null
      }

  class DataFactorRanges extends Backbone.Collection
    model: DataFactorRange

  return {
    "Model": DataFactorRange,
    "Collection": new DataFactorRanges
  }