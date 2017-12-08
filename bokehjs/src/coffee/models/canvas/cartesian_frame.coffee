import {CategoricalScale} from "../scales/categorical_scale"
import {LinearScale} from "../scales/linear_scale"
import {LogScale} from "../scales/log_scale"
import {Scale} from "../scales/scale"
import {Range} from "../ranges/range"
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
    @_configure_scales()
    @connect(@change, () => @_configure_scales())

  @getters {
    panel: () -> @
  }

  get_editables: () ->
    return super().concat([@_width, @_height])

  map_to_screen: (x, y, x_name='default', y_name='default') ->
    sx = @xscales[x_name].v_compute(x)
    sy = @yscales[y_name].v_compute(y)
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
    # data to/from screen space transform (left-bottom <-> left-top origin)
    @_h_target = new Range1d({start: @_left.value, end: @_right.value})
    @_v_target = new Range1d({start: @_bottom._value, end: @_top.value})

  _configure_scales: () ->
    @_configure_frame_ranges()

    @_x_ranges = @_get_ranges(@x_range, @extra_x_ranges)
    @_y_ranges = @_get_ranges(@y_range, @extra_y_ranges)

    @_xscales = @_get_scales(@x_scale, @_x_ranges, @_h_target)
    @_yscales = @_get_scales(@y_scale, @_y_ranges, @_v_target)

  _update_scales: () ->
    @_configure_frame_ranges()

    for name, scale of @_xscales
      scale.target_range = @_h_target
    for name, scale of @_yscales
      scale.target_range = @_v_target
    return null

  `
  get x_ranges(): {[key: string]: Range} { return this._x_ranges }
  get y_ranges(): {[key: string]: Range} { return this._y_ranges }
  get xscales(): {[key: string]: Scale} { return this._xscales }
  get yscales(): {[key: string]: Scale} { return this._yscales }
  `

  @internal {
    extra_x_ranges: [ p.Any, {} ]
    extra_y_ranges: [ p.Any, {} ]
    x_range:        [ p.Instance ]
    y_range:        [ p.Instance ]
    x_scale:        [ p.Instance ]
    y_scale:        [ p.Instance ]
  }
