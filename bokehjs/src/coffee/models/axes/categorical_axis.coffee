import {Axis, AxisView} from "./axis"
import {CategoricalTickFormatter} from "../formatters/categorical_tick_formatter"
import {CategoricalTicker} from "../tickers/categorical_ticker"
import {logger} from "core/logging"
import {uniq} from "core/util/array"
import {isArray, isString} from "core/util/types"

export class CategoricalAxisView extends AxisView

  _render: (ctx, extents) ->
    @_draw_group_separators(ctx, extents)

  _draw_group_separators: (ctx, extents) ->
    if not @visuals.separator_line.doit
      return

    [range, cross_range] = @model.ranges
    if range.levels == 1
      return

    tick_coords = @model.tick_coords.major
    info = @model.label_info(tick_coords)
    labels = @model.compute_labels(info.coords[info.dim])

    tops = {}
    tops_order = []
    if range.levels == 2
      for [f0, f1] in range.factors
        if f0 not of tops
          tops_order.push(f0)
          tops[f0] = {first: range.synthetic([f0, f1])}
        tops[f0].last = range.synthetic([f0, f1])
    else if range.levels == 3
      for [f0, f1, f2] in range.factors
        if f0 not of tops
          tops_order.push(f0)
          tops[f0] = {first: range.synthetic([f0, f1, f2])}
        tops[f0].last = range.synthetic([f0, f1, f2])

    if tops_order.length < 2
      return

    [pt0, pt1] = [[], []]
    for i in [0...tops_order.length-1]
      pt0.push(@model.loc)
      pt1.push((tops[tops_order[i]].last+tops[tops_order[i+1]].first)/2)

    if @model.dim == 0
      [sx, sy] = @plot_view.map_to_screen(pt0, pt1, @_x_range_name, @_y_range_name)
    else
      [sx, sy] = @plot_view.map_to_screen(pt1, pt0, @_x_range_name, @_y_range_name)

    ex = @_tick_label_extent()
    [nx, ny] = @model.normals
    [xoff, yoff]  = @model.offsets

    @visuals.separator_line.set_value(ctx)
    for i in [0...sx.length]
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[i]+nx*(xoff+3)),    Math.round(sy[i]+ny*(yoff+3)))
      ctx.lineTo(Math.round(sx[i]+nx*(xoff+3+ex)), Math.round(sy[i]+ny*(yoff+3+ex)))
      ctx.stroke()

  _draw_major_labels: (ctx, extents) ->
    [range, cross_range] = @model.ranges
    tick_coords = @model.tick_coords.major
    info = @model.label_info(tick_coords)

    labels = @model.compute_labels(info.coords[info.dim])
    if labels.length == 0
      return

    @visuals.major_label_text.set_value(ctx)

    if range.levels == 1
      @_draw_oriented_labels(labels, info, extents)

    else if range.levels == 2
      l1 = (x[1] for x in labels)
      @_draw_oriented_labels(l1, info, extents)

      @visuals.group_text.set_value(ctx)
      l0 = uniq(x[0] for x in labels)
      tick_coords[info.dim] = l0
      info = @model.label_info(tick_coords)
      info.orient = "parallel"
      info.standoff += extents.tick_label[0]
      @_draw_oriented_labels(l0, info, extents)

    else if range.levels == 3
      l2 = (x[2] for x in labels)
      @_draw_oriented_labels(l2, info, extents)

      @visuals.subgroup_text.set_value(ctx)

      # This sucks but then so does JavaScript
      l1 = []
      l1_seen = []
      for x in labels
        subx = x.slice(0, 2)
        if subx.toString() not in l1_seen
          l1_seen.push(subx.toString())
          l1.push(subx)

      tick_coords[info.dim] = l1
      info = @model.label_info(tick_coords)
      info.orient = "parallel"
      info.standoff += extents.tick_label[0]
      @_draw_oriented_labels((x[1] for x in l1), info, extents)

      @visuals.group_text.set_value(ctx)
      l0 = uniq(x[0] for x in labels)
      tick_coords[info.dim] = l0
      info = @model.label_info(tick_coords)
      info.orient = "parallel"
      info.standoff += extents.tick_label[0] + extents.tick_label[1]
      @_draw_oriented_labels(l0, info, extents)

  _tick_label_extents: () ->
    [range, cross_range] = @model.ranges
    tick_coords = @model.tick_coords.major
    info = @model.label_info(tick_coords)

    labels = @model.compute_labels(info.coords[info.dim])
    if labels.length == 0
      return 0

    ctx = @plot_view.canvas_view.ctx
    @visuals.major_label_text.set_value(ctx)

    extents = []

    if range.levels == 1
      extent = @_oriented_label_extent(labels, info)
      extents.push(extent)

    else if range.levels == 2
      l1 = (x[1] for x in labels)
      extents.push(@_oriented_label_extent(l1, info))

      @visuals.group_text.set_value(ctx)
      l0 = uniq(x[0] for x in labels)
      tick_coords[info.dim] = l0
      info = @model.label_info(tick_coords)
      info.orient = "parallel"

      extents.push(@_oriented_label_extent(l0, info))

    else if range.levels == 3
      l2 = (x[2] for x in labels)
      extents.push(@_oriented_label_extent(l2, info))

      @visuals.subgroup_text.set_value(ctx)
      l1 = (x.slice(0, 2) for x in labels)
      tick_coords[info.dim] = l1
      info = @model.label_info(tick_coords)
      info.orient = "parallel"
      extents.push(@_oriented_label_extent((x[1] for x in l1), info))

      @visuals.group_text.set_value(ctx)
      l0 = uniq(x[0] for x in labels)
      tick_coords[info.dim] = l0
      info = @model.label_info(tick_coords)
      info.orient = "parallel"
      extents.push(@_oriented_label_extent(l0, info))

    return extents

export class CategoricalAxis extends Axis
  default_view: CategoricalAxisView

  type: 'CategoricalAxis'

  @mixins [
    'line:separator_'
    'text:group_'
    'text:subgroup_'
  ]

  @override {
    ticker: () -> new CategoricalTicker()
    formatter: () -> new CategoricalTickFormatter()
    separator_line_color: "lightgrey"
    separator_line_width: 2
    group_text_font_style: "bold"
    group_text_font_size: "8pt"
    group_text_color: "grey"
    subgroup_text_font_style: "bold"
    subgroup_text_font_size: "8pt"
  }
