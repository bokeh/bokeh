import {InspectTool, InspectToolView} from "./inspect_tool"
import {Tooltip} from "../../annotations/tooltip"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {GraphRenderer} from "../../renderers/graph_renderer"
import * as hittest from "core/hittest"
import {replace_placeholders} from "core/util/templating"
import {div, span} from "core/dom"
import * as p from "core/properties"
import {color2hex} from "core/util/color"
import {values, isEmpty} from "core/util/object"
import {isString, isFunction} from "core/util/types"
import {build_views, remove_views} from "core/build_views"

export _nearest_line_hit = (canvas, i, geometry, sx, sy, dx, dy) ->
  d1x = dx[i]
  d1y = dy[i]

  d2x = dx[i+1]
  d2y = dy[i+1]

  if geometry.type == "span"
    switch geometry.direction
      when "h"
        dist1 = Math.abs(d1x-sx)
        dist2 = Math.abs(d2x-sx)
      when "v"
        dist1 = Math.abs(d1y-sy)
        dist2 = Math.abs(d2y-sy)
  else
    dist1 = hittest.dist_2_pts(d1x, d1y, sx, sy)
    dist2 = hittest.dist_2_pts(d2x, d2y, sx, sy)

  if dist1 < dist2
    rx = canvas.sx_to_vx(d1x)
    ry = canvas.sy_to_vy(d1y)
    return [[rx, ry], i]
  else
    rx = canvas.sx_to_vx(d2x)
    ry = canvas.sy_to_vy(d2y)
    return [[rx, ry], i+1]

export _line_hit = (canvas, xs, ys, ind) ->
  return [[canvas.sx_to_vx(xs[ind]), canvas.sy_to_vy(ys[ind])], ind]

export class HoverToolView extends InspectToolView

  initialize: (options) ->
    super(options)
    @ttviews = {}

  remove: () ->
    remove_views(@ttviews)
    super()

  connect_signals: () ->
    super()

    for r in @computed_renderers
      if r instanceof GlyphRenderer
        @connect(r.data_source.inspect, @_update)
      else if r instanceof GraphRenderer
        @connect(r.node_renderer.data_source.inspect, @_update)
        @connect(r.edge_renderer.data_source.inspect, @_update)

    # TODO: @connect(@plot_model.plot.properties.renderers.change, () -> @_computed_renderers = @_ttmodels = null)
    @connect(@model.properties.renderers.change,      () -> @_computed_renderers = @_ttmodels = null)
    @connect(@model.properties.names.change,          () -> @_computed_renderers = @_ttmodels = null)
    @connect(@model.properties.tooltips.change,       () -> @_ttmodels = null)

  _compute_renderers: () ->
    renderers = @model.renderers
    names = @model.names

    if renderers.length == 0
      all_renderers = @plot_model.plot.renderers
      renderers = (r for r in all_renderers when r instanceof GlyphRenderer or r instanceof GraphRenderer)

    if names.length > 0
      renderers = (r for r in renderers when names.indexOf(r.name) >= 0)

    return renderers

  _compute_ttmodels: () ->
    ttmodels = {}
    tooltips = @model.tooltips

    if tooltips?
      for r in @computed_renderers
        if r instanceof GlyphRenderer
          tooltip = new Tooltip({
            custom: isString(tooltips) or isFunction(tooltips)
            attachment: @model.attachment
            show_arrow: @model.show_arrow
          })
          ttmodels[r.id] = tooltip
        else if r instanceof GraphRenderer
          tooltip = new Tooltip({
            custom: isString(tooltips) or isFunction(tooltips)
            attachment: @model.attachment
            show_arrow: @model.show_arrow
          })
          ttmodels[r.node_renderer.id] = tooltip
          ttmodels[r.edge_renderer.id] = tooltip

    build_views(@ttviews, values(ttmodels), {parent: @, plot_view: @plot_view})

    return ttmodels

  @getters {
    computed_renderers: () ->
      if not @_computed_renderers? then @_computed_renderers = @_compute_renderers()
      return @_computed_renderers
    ttmodels: () ->
      if not @_ttmodels? then @_ttmodels = @_compute_ttmodels()
      return @_ttmodels
  }

  _clear: () ->

    @_inspect(Infinity, Infinity)

    for rid, tt of @ttmodels
      tt.clear()

  _move: (e) ->
    if not @model.active
      return
    {sx, sy} = e.bokeh
    if not @plot_view.frame.bbox.contains(sx, sy)
      @_clear()
    else
      @_inspect(sx, sy)

  _move_exit: () -> @_clear()

  _inspect: (sx, sy) ->
    geometry = {
      type: 'point'
      sx: sx
      sy: sy
    }

    if @model.mode == 'mouse'
      geometry['type'] = 'point'
    else
        geometry['type'] = 'span'
        if @model.mode == 'vline'
          geometry.direction = 'h'
        else
          geometry.direction = 'v'

    for r in @computed_renderers
      sm = r.get_selection_manager()
      sm.inspect(@plot_view.renderer_views[r.id], geometry)

    if @model.callback?
      @_emit_callback(geometry)

    return

  _update: ([renderer_view, {geometry}]) ->
    if not @model.active
      return

    tooltip = @ttmodels[renderer_view.model.id] ? null
    if not tooltip?
      return
    tooltip.clear()

    indices = renderer_view.model.get_selection_manager().inspectors[renderer_view.model.id].indices
    if renderer_view.model instanceof GlyphRenderer
      indices = renderer_view.model.view.convert_selection_to_subset(indices)

    ds = renderer_view.model.get_selection_manager().source

    if indices.is_empty()
      return

    canvas = @plot_model.canvas
    frame = @plot_model.frame

    {sx, sy} = geometry

    vx = canvas.sx_to_vx(sx) # XXX: abs -> rel
    vy = canvas.sy_to_vy(sy) # XXX: abs -> rel
    xscale = frame.xscales[renderer_view.model.x_range_name]
    yscale = frame.yscales[renderer_view.model.y_range_name]
    x = xscale.invert(vx)
    y = yscale.invert(vy)

    glyph = renderer_view.glyph

    for i in indices['0d'].indices
      data_x = glyph._x[i+1]
      data_y = glyph._y[i+1]
      ii = i

      switch @model.line_policy
        when "interp" # and renderer.get_interpolation_hit?
          [data_x, data_y] = glyph.get_interpolation_hit(i, geometry)
          rx = xscale.compute(data_x)
          ry = yscale.compute(data_y)

        when "prev"
          [[rx, ry], ii] = _line_hit(canvas, glyph.sx, glyph.sy, i)

        when "next"
          [[rx, ry], ii] = _line_hit(canvas, glyph.sx, glyph.sy, i+1)

        when "nearest"
          [[rx, ry], ii] = _nearest_line_hit(canvas, i, geometry, sx, sy, glyph.sx, glyph.sy)
          data_x = glyph._x[ii]
          data_y = glyph._y[ii]

        else
          [rx, ry] = [vx, vy]

      vars = {index: ii, x: x, y: y, vx: vx, vy: vy, sx: sx, sy: sy, data_x: data_x, data_y: data_y, rx:rx, ry:ry}

      tooltip.add(rx, ry, @_render_tooltips(ds, ii, vars))

    for i in indices['1d'].indices
      # multiglyphs will set '1d' and '2d' results, but have different tooltips
      if not isEmpty(indices['2d'].indices)
        for i, [j] of indices['2d'].indices
          data_x = glyph._xs[i][j]
          data_y = glyph._ys[i][j]
          jj = j

          switch @model.line_policy
            when "interp" # and renderer.get_interpolation_hit?
              [data_x, data_y] = glyph.get_interpolation_hit(i, j, geometry)
              rx = xscale.compute(data_x)
              ry = yscale.compute(data_y)

            when "prev"
              [[rx, ry], jj] = _line_hit(canvas, glyph.sxs[i], glyph.sys[i], j)

            when "next"
              [[rx, ry], jj] = _line_hit(canvas, glyph.sxs[i], glyph.sys[i], j+1)

            when "nearest"
              [[rx, ry], jj] = _nearest_line_hit(canvas, j, geometry, sx, sy, glyph.sxs[i], glyph.sys[i])
              data_x = glyph._xs[i][jj]
              data_y = glyph._ys[i][jj]

          vars = {index: i, segment_index: jj, x: x, y: y, vx: vx, vy: vy, sx: sx, sy: sy, data_x: data_x, data_y: data_y}

          tooltip.add(rx, ry, @_render_tooltips(ds, i, vars))

      else
        # handle non-multiglyphs
        data_x = glyph._x?[i]
        data_y = glyph._y?[i]
        if @model.point_policy == 'snap_to_data' # and renderer.glyph.sx? and renderer.glyph.sy?
          # Pass in our screen position so we can determine
          # which patch we're over if there are discontinuous
          # patches.
          pt = glyph.get_anchor_point(@model.anchor, i, [sx, sy])
          if not pt?
            pt = glyph.get_anchor_point("center", i, [sx, sy])

          rx = canvas.sx_to_vx(pt.x)
          ry = canvas.sy_to_vy(pt.y)
        else
          [rx, ry] = [vx, vy]

        if renderer_view.model instanceof GlyphRenderer
          index = renderer_view.model.view.convert_indices_from_subset([i])[0]
        else
          index = i
        vars = {index: index, x: x, y: y, vx: vx, vy: vy, sx: sx, sy: sy, data_x: data_x, data_y: data_y}

        tooltip.add(rx, ry, @_render_tooltips(ds, i, vars))

    return null

  _emit_callback: (geometry) ->
    for r in  @computed_renderers

      index = r.data_source.inspected

      canvas = @plot_model.canvas
      frame = @plot_model.frame

      geometry['sx'] = canvas.vx_to_sx(geometry.vx)
      geometry['sy'] = canvas.vy_to_sy(geometry.vy)

      xscale = frame.xscales[r.x_range_name]
      yscale = frame.yscales[r.y_range_name]
      geometry['x'] = xscale.invert(geometry.vx)
      geometry['y'] = yscale.invert(geometry.vy)

      callback = @model.callback
      [obj, data] = [callback, {index: index, geometry: geometry, renderer: r}]

      if isFunction(callback)
        callback(obj, data)
      else
        callback.execute(obj, data)

    return

  _render_tooltips: (ds, i, vars) ->
    tooltips = @model.tooltips
    if isString(tooltips)
      el = div()
      el.innerHTML = replace_placeholders(tooltips, ds, i, @model.formatters, vars)
      return el
    else if isFunction(tooltips)
      return tooltips(ds, vars)
    else
      rows = div({style: {display: "table", borderSpacing: "2px"}})

      for [label, value] in tooltips
        row = div({style: {display: "table-row"}})
        rows.appendChild(row)

        cell = div({style: {display: "table-cell"}, class: 'bk-tooltip-row-label'}, "#{label}: ")
        row.appendChild(cell)

        cell = div({style: {display: "table-cell"}, class: 'bk-tooltip-row-value'})
        row.appendChild(cell)

        if value.indexOf("$color") >= 0
          [match, opts, colname] = value.match(/\$color(\[.*\])?:(\w*)/)
          column = ds.get_column(colname)
          if not column?
            el = span({}, "#{colname} unknown")
            cell.appendChild(el)
            continue
          hex = opts?.indexOf("hex") >= 0
          swatch = opts?.indexOf("swatch") >= 0
          color = column[i]
          if not color?
            el = span({}, "(null)")
            cell.appendChild(el)
            continue
          if hex
            color = color2hex(color)
          el = span({}, color)
          cell.appendChild(el)
          if swatch
            el = span({class: 'bk-tooltip-color-block', style: {backgroundColor: color}}, " ")
            cell.appendChild(el)
        else
          value = value.replace("$~", "$data_")
          el = span()
          el.innerHTML = replace_placeholders(value, ds, i, @model.formatters, vars)
          cell.appendChild(el)

      return rows

export class HoverTool extends InspectTool
  default_view: HoverToolView
  type: "HoverTool"
  tool_name: "Hover"
  icon: "bk-tool-icon-hover"

  @define {
    tooltips: [ p.Any, [
      ["index",         "$index"    ]
      ["data (x, y)",   "($x, $y)"  ]
      ["canvas (x, y)", "($sx, $sy)"]
    ]]
    formatters:   [ p.Any,    {}             ]
    renderers:    [ p.Array,  []             ]
    names:        [ p.Array,  []             ]
    mode:         [ p.String, 'mouse'        ] # TODO (bev)
    point_policy: [ p.String, 'snap_to_data' ] # TODO (bev) "follow_mouse", "none"
    line_policy:  [ p.String, 'nearest'      ] # TODO (bev) "next", "nearest", "interp", "none"
    show_arrow:   [ p.Boolean, true          ]
    anchor:       [ p.String, 'center'       ] # TODO: enum
    attachment:   [ p.String, 'horizontal'   ] # TODO: enum
    callback:     [ p.Any                    ] # TODO: p.Either(p.Instance(Callback), p.Function) ]
  }
