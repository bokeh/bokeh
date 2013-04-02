base = require("../base")
HasProperties = base.HasProperties

class ObjectArrayDataSource extends HasProperties
  type : 'ObjectArrayDataSource'
  initialize : (attrs, options) ->
    super(attrs, options)
    @cont_ranges = {}
    @discrete_ranges = {}

  getcolumn: (colname) ->
    return (x[colname] for x in @get('data'))

  compute_cont_range : (field) ->
    data = @getcolumn(field)
    return [_.max(data), _.min(data)]

  compute_discrete_factor : (field) ->
    temp = {}
    for val in @getcolumn(field)
      temp[val] = true
    uniques = _.keys(temp)
    uniques = _.sortBy(uniques, ((x) -> return x))

  get_cont_range : (field, padding) ->
    padding = 1.0 if _.isUndefined(padding)
    if not _.exists(@cont_ranges, field)
      [min, max] = @compute_cont_range(field)
      span = (max - min) * (1 + padding)
      center = (max + min) / 2.0
      [min, max] = [center - span/2.0, center + span/2.0]

      @cont_ranges[field] = Collections('Range1d').create(
          start : min
          end : max
      )
      @on('change:data'
        ,
        () =>
          [max, min] = @compute_cont_range(field)
          @cont_ranges[field].set('start', min)
          @cont_ranges[field].set('end', max)
      )
    return @cont_ranges[field]

  get_discrete_range : (field) ->
    if not _.exists(@discrete_ranges, field)
      factors = @compute_discrete_factor(field)
      @discrete_ranges[field] = Collections('FactorRange').create(
          values : factors
      )
      @on('change:data'
        ,
          () =>
            factors = @compute_discrete_factor(field)
            @discrete_ranges[field] = Collections('FactorRange').set(
              'values', factors)
      )
    return @discrete_ranges[field]

  select : (fields, func) ->
    selected = []
    for val, idx in @get('data')
      args = (val[x] for x in fields)
      if func.apply(func, args)
        selected.push(idx)
    selected.sort()
    return selected
ObjectArrayDataSource::defaults = _.clone(ObjectArrayDataSource::defaults)
_.extend(ObjectArrayDataSource::defaults
  ,
    data : [{}]
    name : 'data'
    selected : []
    selecting : false
)

class ObjectArrayDataSources extends Backbone.Collection
  model : ObjectArrayDataSource


class ColumnDataSource extends ObjectArrayDataSource
  # Datasource where the data is defined column-wise, i.e. each key in the
  # the data attribute is a column name, and its value is an array of scalars.
  # Each column should be the same length.
  type : 'ColumnDataSource'
  initialize : (attrs, options) ->
    super(attrs, options)
    @cont_ranges = {}
    @discrete_ranges = {}

  getcolumn: (colname) ->
    return @get('data')[colname]

  datapoints: () ->
    data = @get('data')
    fields = _.keys(data)
    points = []
    for i in [0..data[fields[0]].length-1]
      point = {}
      for field in fields
        point[field] = data[field][i]
      points.push(point)
    return points


class ColumnDataSources extends Backbone.Collection
  model : ColumnDataSource

exports.objectarraydatasources = new ObjectArrayDataSources
exports.columndatasources = new ColumnDataSources

exports.ObjectArrayDataSource = ObjectArrayDataSource
exports.ColumnDataSource = ColumnDataSource
