
define [
  "underscore",
  "backbone",
  "common/has_properties",
  "range/range1d",
  "range/factor_range",
], (_, Backbone, HasProperties, Range1d, FactorRange) ->

  class ObjectArrayDataSource extends HasProperties
    type: 'ObjectArrayDataSource'
    initialize: (attrs, options) ->
      super(attrs, options)
      @cont_ranges = {}
      @discrete_ranges = {}

    getcolumn: (colname) ->
      return (x[colname] for x in @get('data'))

    compute_cont_range: (field) ->
      data = @getcolumn(field)
      return [_.max(data), _.min(data)]

    compute_discrete_factor: (field) ->
      temp = {}
      for val in @getcolumn(field)
        temp[val] = true
      uniques = _.keys(temp)
      uniques = _.sortBy(uniques, ((x) -> return x))

    get_cont_range: (field, padding) ->
      padding = 1.0 if _.isUndefined(padding)
      if not _.exists(@cont_ranges, field)
        [min, max] = @compute_cont_range(field)
        span = (max - min) * (1 + padding)
        center = (max + min) / 2.0
        [min, max] = [center - span/2.0, center + span/2.0]

        @cont_ranges[field] = Range1d.Collection.create(
            start: min
            end: max
        )
        @on('change:data'
          ,
          () =>
            [max, min] = @compute_cont_range(field)
            @cont_ranges[field].set('start', min)
            @cont_ranges[field].set('end', max)
        )
      return @cont_ranges[field]

    get_discrete_range: (field) ->
      if not _.exists(@discrete_ranges, field)
        factors = @compute_discrete_factor(field)
        @discrete_ranges[field] = FactorRange.Collection.create(
            values: factors
        )
        @on('change:data'
          ,
            () =>
              factors = @compute_discrete_factor(field)
              @discrete_ranges[field] = FactorRange.Collection.set(
                'values', factors)
        )
      return @discrete_ranges[field]

    select: (fields, func) ->
      selected = []
      for val, idx in @get('data')
        args = (val[x] for x in fields)
        if func.apply(func, args)
          selected.push(idx)
      selected.sort()
      return selected

    defaults: () ->
      return {
        data: [{}]
        name: 'data'
        selected: []
        selecting: false
      }

  class ObjectArrayDataSources extends Backbone.Collection
    model: ObjectArrayDataSource

  return {
    "Model": ObjectArrayDataSource,
    "Collection": new ObjectArrayDataSources()
  }

