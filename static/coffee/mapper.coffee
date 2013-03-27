base = require("./base")

Collections = base.Collections
safebind = base.safebind
HasParent = base.HasParent
HasProperties = base.HasProperties

class LinearMapper extends HasParent
  # XY View state - handles mapper functionality
  # along 2 axes
  initialize : (attrs, options) ->
    super(attrs, options)
    @data_range = options.data_range
    @viewstate = options.viewstate
    @screendim = options.screendim #height or width
    @border_offset = options.border_offset ? 0

    @register_property('scalestate', @_get_scale, true)
    #if height/width changes, updated mapper
    @add_dependencies('scalestate', @viewstate, @screendim)
    #if range limits change, update
    @add_dependencies('scalestate', @data_range,
      ['start', 'end'])

  _get_scale : () ->
    screendim = @viewstate.get(@screendim)
    scale_factor = @viewstate.get(@screendim)
    scale_factor = scale_factor/(@data_range.get('end')-@data_range.get('start'))
    offset = -(scale_factor * @data_range.get('start'))
    return [scale_factor, offset]

  v_map_screen : (datav) ->
    [scale_factor, offset] = @get('scalestate')
    result = new Array(datav.length)
    for data, idx in datav
      result[idx] = scale_factor * data + offset + @border_offset
    return result

  map_screen : (data) ->
    [scale_factor, offset] = @get('scalestate')
    return scale_factor * data + offset + @border_offset

  map_data : (screen) ->
    [scale_factor, offset] = @get('scalestate')
    return (screen - offset) / scale_factor


class DiscreteColorMapper extends HasProperties
  type : 'DiscreteColorMapper'

  _get_factor_map : () =>
    domain_map = {}
    for val, index in @get_obj('data_range').get('values')
      domain_map[val] = index
    return domain_map

  _get_scale : () =>
    return d3.scale.ordinal().domain(_.values(@get('factor_map')))
      .range(@get('colors'))

  dinitialize : (attrs, options) ->
    super(attrs, options)
    @register_property('factor_map', @_get_factor_map, true)
    @add_dependencies('factor_map', this, 'data_range')
    @register_property('scale', @_get_scale, true)
    @add_dependencies('scale', this, ['colors', 'factor_map'])

  map_screen : (data) ->
    @get('scale')(@get('factor_map')[data]);

DiscreteColorMapper::defaults = _.clone(DiscreteColorMapper::defaults)
_.extend(DiscreteColorMapper::defaults
  ,
    colors : [
      "#1f77b4", "#aec7e8",
      "#ff7f0e", "#ffbb78",
      "#2ca02c", "#98df8a",
      "#d62728", "#ff9896",
      "#9467bd", "#c5b0d5",
      "#8c564b", "#c49c94",
      "#e377c2", "#f7b6d2",
      "#7f7f7f", "#c7c7c7",
      "#bcbd22", "#dbdb8d",
      "#17becf", "#9edae5"
    ],
    data_range : null
)

class DiscreteColorMappers extends Backbone.Collection
  model : DiscreteColorMapper


exports.discretecolormappers = new DiscreteColorMappers

exports.LinearMapper = LinearMapper
exports.DiscreteColorMapper = DiscreteColorMapper
