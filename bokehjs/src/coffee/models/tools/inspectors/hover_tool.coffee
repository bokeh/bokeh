import {InspectTool, InspectToolView} from "./inspect_tool"
import {Tooltip} from "../../annotations/tooltip"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {GraphRenderer} from "../../renderers/graph_renderer"
import * as hittest from "core/hittest"
import {replace_placeholders} from "core/util/templating"
import {div, span} from "core/dom"
import * as p from "core/properties"
import {values, isEmpty} from "core/util/object"
import {isString, isFunction} from "core/util/types"
import {build_views, remove_views} from "core/build_views"

_color_to_hex = (color) ->
  if (color.substr(0, 1) == '#')
      return color
  digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color)

  red = parseInt(digits[2])
  green = parseInt(digits[3])
  blue = parseInt(digits[4])

  rgb = blue | (green << 8) | (red << 16)
  return digits[1] + '#' + rgb.toString(16)

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

    new_views = build_views(@ttviews, values(ttmodels), {parent: @, plot_view: @plot_view})
    # XXX: we shouldn't maintain this, but currently connection of signals is a mess.
    for view in new_views
      view.connect_signals()

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
    canvas = @plot_view.canvas
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)
    if not @plot_view.frame.contains(vx, vy)
      @_clear()
    else
      @_inspect(vx, vy)

  _move_exit: () -> @_clear()

  _inspect: (vx, vy, e) ->
    geometry = {
      type: 'point'
      vx: vx
      vy: vy
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
    ds = renderer_view.model.get_selection_manager().source

    if indices.is_empty()
      return

    vx = geometry.vx
    vy = geometry.vy

    canvas = @plot_model.canvas
    frame = @plot_model.frame

    sx = canvas.vx_to_sx(vx)
    sy = canvas.vy_to_sy(vy)

    xscale = frame.xscales[renderer_view.model.x_range_name]
    yscale = frame.yscales[renderer_view.model.y_range_name]
    x = xscale.invert(vx)
    y = yscale.invert(vy)

    for i in indices['0d'].indices
      data_x = renderer_view.glyph._x[i+1]
      data_y = renderer_view.glyph._y[i+1]
      ii = i

      switch @model.line_policy
        when "interp" # and renderer.get_interpolation_hit?
          [data_x, data_y] = renderer_view.glyph.get_interpolation_hit(i, geometry)
          rx = xscale.compute(data_x)
          ry = yscale.compute(data_y)

        when "prev"
          rx = canvas.sx_to_vx(renderer_view.glyph.sx[i])
          ry = canvas.sy_to_vy(renderer_view.glyph.sy[i])

        when "next"
          rx = canvas.sx_to_vx(renderer_view.glyph.sx[i+1])
          ry = canvas.sy_to_vy(renderer_view.glyph.sy[i+1])
          ii = i+1

        when "nearest"
          d1x = renderer_view.glyph.sx[i]
          d1y = renderer_view.glyph.sy[i]
          dist1 = hittest.dist_2_pts(d1x, d1y, sx, sy)

          d2x = renderer_view.glyph.sx[i+1]
          d2y = renderer_view.glyph.sy[i+1]
          dist2 = hittest.dist_2_pts(d2x, d2y, sx, sy)

          if dist1 < dist2
            [sdatax, sdatay] = [d1x, d1y]
          else
            [sdatax, sdatay] = [d2x, d2y]
            ii = i+1

          data_x = renderer_view.glyph._x[i]
          data_y = renderer_view.glyph._y[i]
          rx = canvas.sx_to_vx(sdatax)
          ry = canvas.sy_to_vy(sdatay)

        else
          [rx, ry] = [vx, vy]

      vars = {index: ii, x: x, y: y, vx: vx, vy: vy, sx: sx, sy: sy, data_x: data_x, data_y: data_y, rx:rx, ry:ry}


      tooltip.add(rx, ry, @_render_tooltips(ds, ii, vars))

    for i in indices['1d'].indices
      # multiglyphs will set '1d' and '2d' results, but have different tooltips
      if not isEmpty(indices['2d'].indices)
        for i, [j] of indices['2d'].indices
          data_x = renderer_view.glyph._xs[i][j]
          data_y = renderer_view.glyph._ys[i][j]
          jj = j

          switch @model.line_policy
            when "interp" # and renderer.get_interpolation_hit?
              [data_x, data_y] = renderer_view.glyph.get_interpolation_hit(i, j, geometry)
              rx = xscale.compute(data_x)
              ry = yscale.compute(data_y)

            when "prev"
              rx = canvas.sx_to_vx(renderer_view.glyph.sxs[i][j])
              ry = canvas.sy_to_vy(renderer_view.glyph.sys[i][j])

            when "next"
              rx = canvas.sx_to_vx(renderer_view.glyph.sxs[i][j+1])
              ry = canvas.sy_to_vy(renderer_view.glyph.sys[i][j+1])
              jj = j+1

            when "nearest"
              d1x = renderer_view.glyph.sxs[i][j]
              d1y = renderer_view.glyph.sys[i][j]
              dist1 = hittest.dist_2_pts(d1x, d1y, sx, sy)

              d2x = renderer_view.glyph.sxs[i][j+1]
              d2y = renderer_view.glyph.sys[i][j+1]
              dist2 = hittest.dist_2_pts(d2x, d2y, sx, sy)

              if dist1 < dist2
                [sdatax, sdatay] = [d1x, d1y]
              else
                [sdatax, sdatay] = [d2x, d2y]
                jj = j+1

              data_x = renderer_view.glyph._xs[i][j]
              data_y = renderer_view.glyph._ys[i][j]
              rx = canvas.sx_to_vx(sdatax)
              ry = canvas.sy_to_vy(sdatay)

          vars = {index: i, segment_index: jj, x: x, y: y, vx: vx, vy: vy, sx: sx, sy: sy, data_x: data_x, data_y: data_y}

          tooltip.add(rx, ry, @_render_tooltips(ds, i, vars))

      else
        # handle non-multiglyphs
        data_x = renderer_view.glyph._x?[i]
        data_y = renderer_view.glyph._y?[i]
        if @model.point_policy == 'snap_to_data' # and renderer.glyph.sx? and renderer.glyph.sy?
          # Pass in our screen position so we can determine
          # which patch we're over if there are discontinuous
          # patches.
          pt = renderer_view.glyph.get_anchor_point(@model.anchor, i, [sx, sy])
          if not pt?
            pt = renderer_view.glyph.get_anchor_point("center", i, [sx, sy])

          rx = canvas.sx_to_vx(pt.x)
          ry = canvas.sy_to_vy(pt.y)
        else
          [rx, ry] = [vx, vy]

        vars = {index: i, x: x, y: y, vx: vx, vy: vy, sx: sx, sy: sy, data_x: data_x, data_y: data_y}

        tooltip.add(rx, ry, @_render_tooltips(ds, i, vars))

    return null

  _emit_callback: (geometry) ->
    r = @computed_renderers[0]
    indices = @plot_view.renderer_views[r.id].hit_test(geometry)

    canvas = @plot_model.canvas
    frame = @plot_model.frame

    geometry['sx'] = canvas.vx_to_sx(geometry.vx)
    geometry['sy'] = canvas.vy_to_sy(geometry.vy)

    xscale = frame.xscales[r.x_range_name]
    yscale = frame.yscales[r.y_range_name]
    geometry['x'] = xscale.invert(geometry.vx)
    geometry['y'] = yscale.invert(geometry.vy)

    callback = @model.callback
    [obj, data] = [callback, {index: indices, geometry: geometry, renderer: r}]

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
            color = _color_to_hex(color)
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
    ]] # TODO (bev)
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
