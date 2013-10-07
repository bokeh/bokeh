base = require("../base")
HasProperties = base.HasProperties

class Range1d extends HasProperties
  type : 'Range1d'
  initialize : (attrs, options) ->
    super(attrs, options)
    @register_property('min',
        () -> Math.min(@get('start'), @get('end'))
      , true)
    @add_dependencies('min', this, ['start', 'end'])
    @register_property('max',
        () -> Math.max(@get('start'), @get('end'))
      , true)
    @add_dependencies('max', this, ['start', 'end'])


Range1d::defaults = _.clone(Range1d::defaults)
_.extend(Range1d::defaults
  ,
    start : 0
    end : 1
)

class Range1ds extends Backbone.Collection
  model : Range1d

class DataRange1d extends Range1d
  type : 'DataRange1d'

  _get_minmax : () ->
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
    span = (max - min) * (1 + @get('rangepadding'))
    center = (max + min) / 2.0
    [min, max] = [center - span/2.0, center + span/2.0]
    return [min, max]

  _get_start : () ->
    if not _.isNullOrUndefined(@get('_start'))
      return @get('_start')
    else
      return @get('minmax')[0]

  _set_start : (start) ->
    @set('_start', start)

  _get_end : () ->
    if not _.isNullOrUndefined(@get('_end'))
      return @get('_end')
    else
      return @get('minmax')[1]

  _set_end : (end) ->
    @set('_end', end)

  dinitialize : (attrs, options) ->
    super(attrs, options)
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

DataRange1d::defaults = _.clone(DataRange1d::defaults)
_.extend(DataRange1d::defaults
  ,
    sources : []
    rangepadding : 0.1
)

class DataRange1ds extends Backbone.Collection
  model : DataRange1d

class Range1ds extends Backbone.Collection
  model : Range1d


class FactorRange extends HasProperties
  type : 'FactorRange'

FactorRange::defaults = _.clone(FactorRange::defaults)
_.extend(FactorRange::defaults
  ,
    values : []
)


class DataFactorRange extends FactorRange
  type : 'DataFactorRange'

  _get_values : () =>
    columns = (@get_obj('data_source').getcolumn(x) for x in @get('columns'))
    columns = _.reduce(columns, ((x, y) -> return x.concat(y)), [])
    temp = {}
    for val in columns
      temp[val] = true
    uniques = _.keys(temp)
    uniques = _.sortBy(uniques, ((x) -> return x))
    return uniques

  dinitialize : (attrs, options) ->
    super(attrs, options)
    @register_property
    @register_property('values', @_get_values, true)
    @add_dependencies('values', this, ['data_source', 'columns'])
    @add_dependencies('values', @get_obj('data_source'),
      ['data_source', 'columns'])


DataFactorRange::defaults = _.clone(DataFactorRange::defaults)
_.extend(DataFactorRange::defaults
  ,
    values : []
    columns : []
    data_source : null
)

class DataFactorRanges extends Backbone.Collection
  model : DataFactorRange

class FactorRanges extends Backbone.Collection
  model : FactorRange

exports.Range1d = Range1d
exports.range1ds = new Range1ds
exports.datarange1ds = new DataRange1ds
exports.datafactorranges = new DataFactorRanges
