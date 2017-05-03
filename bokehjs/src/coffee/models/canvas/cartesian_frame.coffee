import {CategoricalScale} from "../scales/categorical_scale"
import {LinearScale} from "../scales/linear_scale"
import {LogScale} from "../scales/log_scale"
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

    @_configure_scales()
    @connectTo(@change, () => @_configure_scales())

    return null

  contains: (vx, vy) ->
    return (
      vx >= @_left.value   and vx <= @_right.value and
      vy >= @_bottom.value and vy <= @_top.value
    )

  map_to_screen: (x, y, canvas, x_name='default', y_name='default') ->
    vx = @xscales[x_name].v_compute(x)
    sx = canvas.v_vx_to_sx(vx)

    vy = @yscales[y_name].v_compute(y)
    sy = canvas.v_vy_to_sy(vy)
    return [sx, sy]

  _get_ranges: (range, extra_ranges) ->
    ranges = {}
    ranges['default'] = range
    if extra_ranges?
      for name, extra_range of extra_ranges
        ranges[name] = extra_range
    return ranges

  _get_scales: (scale_type_name, ranges, frame_range) ->
    scales = {}
    for name, range of ranges
      if range.type == "Range1d" or range.type == "DataRange1d"
        if scale_type_name == "log"
          scale_type = LogScale
        else
          scale_type = LinearScale
        range.scale_hint = scale_type_name
      else if range.type == "FactorRange"
        scale_type = CategoricalScale
      else
        logger.warn("unknown range type for range '#{name}': #{range}")
        return null
      scales[name] = new scale_type({
        source_range: range
        target_range: frame_range
      })
    return scales

  _configure_frame_ranges: () ->
    @_h_range = new Range1d({start: @_left.value,   end: @_left.value   + @_width.value})
    @_v_range = new Range1d({start: @_bottom.value, end: @_bottom.value + @_height.value})

  _configure_scales: () ->
    @_configure_frame_ranges()

    @_x_ranges = @_get_ranges(@x_range, @extra_x_ranges)
    @_y_ranges = @_get_ranges(@y_range, @extra_y_ranges)

    @_xscales = @_get_scales(@x_mapper_type, @_x_ranges, @_h_range)
    @_yscales = @_get_scales(@y_mapper_type, @_y_ranges, @_v_range)

  _update_scales: () ->
    @_configure_frame_ranges()

    for name, scale of @_xscales
      scale.target_range = @_h_range
    for name, scale of @_yscales
      scale.target_range = @_v_range
    return null

  @getters {
    h_range:  () -> @_h_range
    v_range:  () -> @_v_range
    x_ranges: () -> @_x_ranges
    y_ranges: () -> @_y_ranges
    xscales:  () -> @_xscales
    yscales:  () -> @_yscales

    # These are deprecated and should not be used in new code
    x_mappers: () ->
      logger.warn("x_mappers attr is deprecated, use xscales")
      @_xscales
    y_mappers: () ->
      logger.warn("y_mappers attr is deprecated, use yscales")
      @_yscales
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
    return [
      GE(@_top),
      GE(@_bottom),
      GE(@_left),
      GE(@_right),
      GE(@_width),
      GE(@_height),
      EQ(@_left, @_width, [-1, @_right]),
      EQ(@_bottom, @_height, [-1, @_top]),
    ]
