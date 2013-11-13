
define [
  "underscore",
  "backbone",
  "range/range1d"
], (_, Backbone, Range1d) ->

  class DataRange1d extends Range1d.Model
    type: 'DataRange1d'

    _get_minmax: () ->
      columns = []
      for source in @get('sources')
        sourceobj = @resolve_ref(source['ref'])
        for colname in source['columns']
          columns.push(sourceobj.getcolumn(colname))
      columns = _.reduce(columns, ((x, y) -> return x.concat(y)), [])
      columns = _.filter(columns, (x) -> typeof(x) != "string")
      if not _.isArray(columns[0])
        columns = _.reject(columns, (x) -> isNaN(x))
        [min, max] = [_.min(columns), _.max(columns)]
      else
        maxs = Array(columns.length)
        mins = Array(columns.length)
        for i in [0..columns.length-1]
          columns[i] = _.reject(columns[i], (x) -> isNaN(x))
          maxs[i] = _.max(columns[i])
          mins[i] = _.min(columns[i])
        [min, max] = [_.min(mins), _.max(maxs)]
      if max != min
        span = (max - min) * (1 + @get('rangepadding'))
      else
        if max != 0
          span = max * (1 + @get('rangepadding'))
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

    dinitialize: (attrs, options) ->
      @register_property('minmax', @_get_minmax, true)
      @add_dependencies('minmax', this, ['sources'], ['rangepadding'])
      for source in @get('sources')
        source = @resolve_ref(source.ref)
        @add_dependencies('minmax', source, 'data')
      @register_property('start', @_get_start, true)
      @register_setter('start', @_set_start)
      @add_dependencies('start', this, ['minmax', '_start'])
      @register_property('end', @_get_end, true)
      @register_setter('end', @_set_end)
      @add_dependencies('end', this, ['minmax', '_end'])
      super(attrs, options)

    defaults: () ->
      return {
        sources: []
        rangepadding: 0.1
      }

  class DataRange1ds extends Backbone.Collection
    model: DataRange1d

  return {
    "Model": DataRange1d,
    "Collection": new DataRange1ds()
  }
