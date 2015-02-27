define [
  "underscore",
  "common/collection",
  "range/range1d"
], (_, Collection, Range1d) ->

  class DataRange1d extends Range1d.Model
    type: 'DataRange1d'

    _get_minmax: () ->
      columns = []
      for source in @get('sources')
        sourceobj = @resolve_ref(source['source'])
        for colname in source['columns']
          columns.push(sourceobj.get_column(colname))
      columns = _.flatten(columns)
      columns = _.reject(columns, (x) -> _.isString(x))
      columns = _.reject(columns, (x) -> isNaN(x))
      [min, max] = [_.min(columns), _.max(columns)]
      if max != min
        span = (max - min) * (1 + @get('rangepadding'))
      else
        if max != 0
          span = Math.abs(max) * (1 + @get('rangepadding'))
        else
          span = 2
      center = (max + min) / 2.0
      [min, max] = [center - span/2.0, center + span/2.0]
      return [min, max]

    _get_start: () ->
      if not _.isNullOrUndefined(@get('_start'))
        return @get('_start')
      else
        return @get('minmax')[0]

    _set_start: (start) ->
      @set('_start', start)

    _get_end: () ->
      if not _.isNullOrUndefined(@get('_end'))
        return @get('_end')
      else
        return @get('minmax')[1]

    _set_end: (end) ->
      @set('_end', end)

    initialize: (attrs, options) ->
      @register_property('minmax', @_get_minmax, true)
      @add_dependencies('minmax', this, ['sources'], ['rangepadding'])
      for columns_ref in @get('sources')
        source = @resolve_ref(columns_ref.source)
        @add_dependencies('minmax', source, 'data')
      @register_property('start', @_get_start, true)
      @register_setter('start', @_set_start)
      @add_dependencies('start', this, ['minmax', '_start'])
      @register_property('end', @_get_end, true)
      @register_setter('end', @_set_end)
      @add_dependencies('end', this, ['minmax', '_end'])
      super(attrs, options)

    defaults: ->
      return _.extend {}, super(), {
        sources: []
        rangepadding: 0.1
      }

  class DataRange1ds extends Collection
    model: DataRange1d

  return {
    "Model": DataRange1d,
    "Collection": new DataRange1ds()
  }
