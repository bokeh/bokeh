import {CategoricalMapper} from "../mappers/categorical_mapper"
import {LinearMapper} from "../mappers/linear_mapper"
import {LogMapper} from "../mappers/log_mapper"
import {Range1d} from "../ranges/range1d"

import {EQ, GE} from "core/layout/solver"
import {LayoutCanvas} from "core/layout/layout_canvas"
import {logger} from "core/logging"
import * as p from "core/properties"

export class CartesianFrame extends LayoutCanvas
  type: 'CartesianFrame'

  initialize: (attrs, options) ->
    super(attrs, options)
    @panel = @

    @_configure_mappers()
    @listenTo(@, 'change', () => @_configure_mappers())

    return null

  contains: (vx, vy) ->
    return (
      vx >= @left and vx <= @right and
      vy >= @bottom and vy <= @top
    )

  map_to_screen: (x, y, canvas, x_name='default', y_name='default') ->
    vx = @x_mappers[x_name].v_map_to_target(x)
    sx = canvas.v_vx_to_sx(vx)

    vy = @y_mappers[y_name].v_map_to_target(y)
    sy = canvas.v_vy_to_sy(vy)
    return [sx, sy]

  _get_ranges: (range, extra_ranges) ->
    ranges = {}
    ranges['default'] = range
    if extra_ranges?
      for name, extra_range of extra_ranges
        ranges[name] = extra_range
    return ranges

  _get_mappers: (mapper_type, ranges, frame_range) ->
    mappers = {}
    for name, range of ranges
      if range.type == "Range1d" or range.type == "DataRange1d"
        if mapper_type == "log"
          mapper_model = LogMapper
        else
          mapper_model = LinearMapper
        range.mapper_hint = mapper_type
      else if range.type == "FactorRange"
        mapper_model = CategoricalMapper
      else
        logger.warn("unknown range type for range '#{name}': #{range}")
        return null
      mappers[name] = new mapper_model({
        source_range: range
        target_range: frame_range
      })
    return mappers

  _configure_frame_ranges: () ->
    @_h_range = new Range1d({start: @left,   end: @left   + @width})
    @_v_range = new Range1d({start: @bottom, end: @bottom + @height})

  _configure_mappers: () ->
    @_configure_frame_ranges()

    @_x_ranges = @_get_ranges(@x_range, @extra_x_ranges)
    @_y_ranges = @_get_ranges(@y_range, @extra_y_ranges)

    @_x_mappers = @_get_mappers(@x_mapper_type, @_x_ranges, @_h_range)
    @_y_mappers = @_get_mappers(@y_mapper_type, @_y_ranges, @_v_range)

  _update_mappers: () ->
    @_configure_frame_ranges()

    for name, mapper of @_x_mappers
      mapper.target_range = @_h_range
    for name, mapper of @_y_mappers
      mapper.target_range = @_v_range
    return null

  @getters {
    h_range:   () -> @_h_range
    v_range:   () -> @_v_range
    x_ranges:  () -> @_x_ranges
    y_ranges:  () -> @_y_ranges
    x_mappers: () -> @_x_mappers
    y_mappers: () -> @_y_mappers
  }

  @internal {
    extra_x_ranges: [ p.Any, {} ]
    extra_y_ranges: [ p.Any, {} ]
    x_range:        [ p.Instance ]
    y_range:        [ p.Instance ]
    x_mapper_type:  [ p.String, 'auto' ]
    y_mapper_type:  [ p.String, 'auto' ]
  }

  get_constraints: () ->
    constraints = []
    constraints.push(GE(@_top))
    constraints.push(GE(@_bottom))
    constraints.push(GE(@_left))
    constraints.push(GE(@_right))
    constraints.push(GE(@_width))
    constraints.push(GE(@_height))
    constraints.push(EQ(@_left, @_width, [-1, @_right]))
    constraints.push(EQ(@_bottom, @_height, [-1, @_top]))
    return constraints
