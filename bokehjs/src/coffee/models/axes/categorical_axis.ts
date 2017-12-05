import {Axis, AxisView} from "./axis"

import {CategoricalTickFormatter} from "../formatters/categorical_tick_formatter"
import {CategoricalTicker} from "../tickers/categorical_ticker"
import {logger} from "core/logging"
import {uniq} from "core/util/array"
import {isArray, isString} from "core/util/types"

export class CategoricalAxisView extends AxisView

  _render: (ctx, extents, tick_coords) ->
    @_draw_group_separators(ctx, extents, tick_coords)

  _draw_group_separators: (ctx, extents, tick_coords) ->
    [range, cross_range] = @model.ranges
    [start, end] = @model.computed_bounds
    loc = @model.loc

    ticks = @model.ticker.get_ticks(start, end, range, loc, {})

    [range, cross_range] = @model.ranges

    if not range.tops or range.tops.length < 2 or not @visuals.separator_line.doit
      return

    dim = @model.dimension
    alt = (dim + 1) % 2

    coords = [[], []]

    ind = 0
    for i in [0...range.tops.length-1]
      for j in [ind...range.factors.length]
        if range.factors[j][0] == range.tops[i+1]
          [first, last] = [range.factors[j-1], range.factors[j]]
          ind = j
          break

      pt = (range.synthetic(first) + range.synthetic(last))/2
      if pt > start and pt < end
        coords[dim].push(pt)
        coords[alt].push(@model.loc)

    tex = @_tick_label_extent()

    @_draw_ticks(ctx, coords, -3, (tex-6), @visuals.separator_line)

    return

  _draw_major_labels: (ctx, extents, tick_coords) ->
    info = @_get_factor_info()

    loc = @model.loc
    dim = @model.dimension
    alt = (dim + 1) % 2

    standoff = extents.tick + @model.major_label_standoff
    for i in [0...info.length]
      [labels, coords, orient, visuals] = info[i]
      @_draw_oriented_labels(ctx, labels, coords, orient, @model.panel.side, standoff, visuals)
      standoff += extents.tick_label[i]

    return

  _tick_label_extents: () ->
    info = @_get_factor_info()

    extents = []
    for [labels, dim_coords, orient, visuals] in info
      extent = @_oriented_labels_extent(labels, orient, @model.panel.side, @model.major_label_standoff, visuals)
      extents.push(extent)

    return extents

  _get_factor_info: () ->
    [range, cross_range] = @model.ranges
    [start, end] = @model.computed_bounds
    loc = @model.loc

    ticks = @model.ticker.get_ticks(start, end, range, loc, {})
    coords = @model.tick_coords

    info = []

    if range.levels == 1
      labels = @model.formatter.doFormat(ticks.major, @)
      info.push([ labels, coords.major, @model.major_label_orientation, @visuals.major_label_text ])

    else if range.levels == 2
      labels = @model.formatter.doFormat((x[1] for x in ticks.major), @)
      info.push([ labels,     coords.major, @model.major_label_orientation, @visuals.major_label_text ])
      info.push([ ticks.tops, coords.tops,  'parallel',                     @visuals.group_text       ])

    else if range.levels == 3
      labels = @model.formatter.doFormat((x[2] for x in ticks.major), @)
      mid_labels = (x[1] for x in ticks.mids)
      info.push([ labels,     coords.major, @model.major_label_orientation, @visuals.major_label_text ])
      info.push([ mid_labels, coords.mids,  'parallel',                     @visuals.subgroup_text    ])
      info.push([ ticks.tops, coords.tops,  'parallel',                     @visuals.group_text       ])

    return info

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

  _tick_coords: () ->
    i = @dimension
    j = (i + 1) % 2
    [range, cross_range] = @ranges
    [start, end] = @computed_bounds

    ticks = @ticker.get_ticks(start, end, range, @loc, {})

    coords = {
      major: [ [], [] ]
      mids:  [ [], [] ]
      tops:  [ [], [] ]
      minor: []
    }

    coords.major[i] = ticks.major
    coords.major[j] = (@loc for x in ticks.major)

    if range.levels == 3
      coords.mids[i] = ticks.mids
      coords.mids[j] = (@loc for x in ticks.mids)

    if range.levels > 1
      coords.tops[i] = ticks.tops
      coords.tops[j] = (@loc for x in ticks.tops)

    return coords
