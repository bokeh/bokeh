import {CategoricalScale} from "../scales/categorical_scale"
import {LinearScale} from "../scales/linear_scale"
import {LogScale} from "../scales/log_scale"
import {Range1d} from "../ranges/range1d"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"

import {LayoutCanvas} from "core/layout/layout_canvas"
import {logger} from "core/logging"
import * as p from "core/properties"

export class CartesianFrame extends LayoutCanvas
  type: 'CartesianFrame'

  initialize: (attrs, options) ->
    super(attrs, options)
    @panel = @

    @_configure_scales()
    @connect(@change, () => @_configure_scales())

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

  _get_scales: (scale, ranges, frame_range) ->
    scales = {}

    for name, range of ranges
      if range instanceof DataRange1d or range instanceof Range1d
        if scale not instanceof LogScale and scale not instanceof LinearScale
          throw new Error("Range #{range.type} is incompatible is Scale #{scale.type}")
        # special case because CategoricalScale is a subclass of LinearScale, should be removed in future
        if scale instanceof CategoricalScale
          throw new Error("Range #{range.type} is incompatible is Scale #{scale.type}")

      if range instanceof FactorRange
        if scale not instanceof CategoricalScale
          throw new Error("Range #{range.type} is incompatible is Scale #{scale.type}")

      if scale instanceof LogScale and range instanceof DataRange1d
        range.scale_hint = "log"

      s = scale.clone()
      s.setv({source_range: range, target_range: frame_range})
      scales[name] = s
    return scales

  _configure_frame_ranges: () ->
    @_h_range = new Range1d({start: @_left.value,   end: @_left.value   + @_width.value})
    @_v_range = new Range1d({start: @_bottom.value, end: @_bottom.value + @_height.value})

  _configure_scales: () ->
    @_configure_frame_ranges()

    @_x_ranges = @_get_ranges(@x_range, @extra_x_ranges)
    @_y_ranges = @_get_ranges(@y_range, @extra_y_ranges)

    @_xscales = @_get_scales(@x_scale, @_x_ranges, @_h_range)
    @_yscales = @_get_scales(@y_scale, @_y_ranges, @_v_range)

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
    x_scale:        [ p.Instance ]
    y_scale:        [ p.Instance ]
  }
