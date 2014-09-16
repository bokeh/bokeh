
define [
  "underscore",
  "common/collection",
  "range/factor_range"
], (_, Collection, FactorRange) ->

  class DataFactorRange extends FactorRange.Model
    type: 'DataFactorRange'

    _get_values: () =>
      columns = (@get('data_source').get_column(x) for x in @get('columns'))
      columns = _.reduce(columns, ((x, y) -> return x.concat(y)), [])
      temp = {}
      for val in columns
        temp[val] = true
      uniques = _.keys(temp)
      uniques = _.sortBy(uniques, ((x) -> return x))
      return uniques

    initialize: (attrs, options) ->
      super(attrs, options)
      @register_property
      @register_property('values', @_get_values, true)
      @add_dependencies('values', this, ['data_source', 'columns'])
      @add_dependencies('values', @get('data_source'),
        ['data_source', 'columns'])

    defaults: ->
      _.extend {}, super(), {
        values: []
        columns: []
        data_source: null
      }

  class DataFactorRanges extends Collection
    model: DataFactorRange

  return {
    "Model": DataFactorRange,
    "Collection": new DataFactorRanges
  }
