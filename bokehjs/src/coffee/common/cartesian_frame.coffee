_ = require "underscore"
LayoutBox = require "./layout_box"
{logging} = require "./logging"
LinearMapper = require "../mapper/linear_mapper"
LogMapper = require "../mapper/log_mapper"
CategoricalMapper = require "../mapper/categorical_mapper"
GridMapper = require "../mapper/grid_mapper"

class CartesianFrame extends LayoutBox.Model
  type: 'CartesianFrame'

  initialize: (attrs, options) ->
    super(attrs, options)

    @register_property('x_ranges',
        () -> @_get_ranges('x')
      , true)
    @add_dependencies('x_ranges', this, ['x_range', 'extra_x_ranges'])

    @register_property('y_ranges',
        () -> @_get_ranges('y')
      , true)
    @add_dependencies('y_ranges', this, ['y_range', 'extra_y_ranges'])

    @register_property('x_mappers',
        () -> @_get_mappers('x', @get('x_ranges'), @get('h_range'))
      , true)
    @add_dependencies('x_ranges', this, ['x_ranges', 'h_range'])

    @register_property('y_mappers',
        () -> @_get_mappers('y', @get('y_ranges'), @get('v_range'))
      , true)
    @add_dependencies('y_ranges', this, ['y_ranges', 'v_range'])

    @register_property('mapper',
      () ->
        new GridMapper.Model({
          domain_mapper: @get('x_mapper')
          codomain_mapper: @get('y_mapper')
        })
      , true)
    @add_dependencies('mapper', this, ['x_mapper', 'y_mapper'])

    @listenTo(@solver, 'layout_update', @_update_mappers)

  map_to_screen: (x, y, canvas, x_name='default', y_name='default') ->
    vx = @get('x_mappers')[x_name].v_map_to_target(x)
    sx = canvas.v_vx_to_sx(vx)

    vy = @get('y_mappers')[y_name].v_map_to_target(y)
    sy = canvas.v_vy_to_sy(vy)

    return [sx, sy]

  _get_ranges: (dim) ->
    ranges = {}
    ranges['default'] = @get("#{dim}_range")
    extra_ranges = @get("extra_#{dim}_ranges")
    if extra_ranges?
      for name, range of extra_ranges
        # resolve ref needed because dicts are not auto-resolved
        ranges[name] = @resolve_ref(range)
    return ranges

  _get_mappers: (dim, ranges, frame_range) ->
    mappers = {}
    for name, range of ranges
      if range.type == "Range1d" or range.type == "DataRange1d"
        if @get("#{dim}_mapper_type") == "log"
          mapper_type = LogMapper.Model
        else
          mapper_type = LinearMapper.Model
      else if range.type == "FactorRange"
        mapper_type = CategoricalMapper.Model
      else
        logger.warn("unknown range type for range '#{name}': #{range}")
        return null
      mappers[name] = new mapper_type({
        source_range: range
        target_range: frame_range
      })
    return mappers

  _update_mappers: () ->
    for name, mapper of @get('x_mappers')
      mapper.set('target_range', @get('h_range'))
    for name, mapper of @get('y_mappers')
      mapper.set('target_range', @get('v_range'))

  defaults: ->
    return _.extend {}, super(), {
      extra_x_ranges: {}
      extra_y_ranges: {}
    }

module.exports =
  Model: CartesianFrame