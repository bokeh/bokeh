_ = require "underscore"
$ = require "jquery"

InspectTool = require "./inspect_tool"
Tooltip = require "../../annotations/tooltip"
GlyphRenderer = require "../../renderers/glyph_renderer"
hittest = require "../../../common/hittest"
{logger} = require "../../../core/logging"
p = require "../../../core/properties"
Util = require "../../../util/util"

_color_to_hex = (color) ->
  if (color.substr(0, 1) == '#')
      return color
  digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color)

  red = parseInt(digits[2])
  green = parseInt(digits[3])
  blue = parseInt(digits[4])

  rgb = blue | (green << 8) | (red << 16)
  return digits[1] + '#' + rgb.toString(16)

class HoverToolView extends InspectTool.View

  bind_bokeh_events: () ->
    for r in @mget('computed_renderers')
      @listenTo(r.data_source, 'inspect', @_update)

    @plot_view.canvas_view.$el.css('cursor', 'crosshair')

  _clear: () ->

    @_inspect(Infinity, Infinity)

    for rid, tt of @mget('ttmodels')
      tt.clear()

  _move: (e) ->
    if not @mget('active')
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

    hovered_indexes = []
    hovered_renderers = []

    for r in @mget('computed_renderers')
      sm = r.data_source.get('selection_manager')
      sm.inspect(@, @plot_view.renderer_views[r.id], geometry, {"geometry": geometry})

    if @mget('callback')?
      @_emit_callback(geometry)

    return

  _update: (indices, tool, renderer, ds, {geometry}) ->
    tooltip = @mget('ttmodels')[renderer.model.id] ? null
    if not tooltip?
      return
    tooltip.clear()

    if indices['0d'].glyph == null and indices['1d'].indices.length == 0
      return

    vx = geometry.vx
    vy = geometry.vy

    canvas = @plot_model.get('canvas')
    frame = @plot_model.get('frame')

    sx = canvas.vx_to_sx(vx)
    sy = canvas.vy_to_sy(vy)

    xmapper = frame.get('x_mappers')[renderer.mget('x_range_name')]
    ymapper = frame.get('y_mappers')[renderer.mget('y_range_name')]
    x = xmapper.map_from_target(vx)
    y = ymapper.map_from_target(vy)

    for i in indices['0d'].indices
      data_x = renderer.glyph._x[i+1]
      data_y = renderer.glyph._y[i+1]

      if @model.line_policy == "interp" # and renderer.get_interpolation_hit?
        [data_x, data_y] = renderer.glyph.get_interpolation_hit(i, geometry)
        rx = xmapper.map_to_target(data_x)
        ry = ymapper.map_to_target(data_y)

      else if @model.line_policy == "prev"
        rx = canvas.sx_to_vx(renderer.glyph.sx[i])
        ry = canvas.sy_to_vy(renderer.glyph.sy[i])

      else if @model.line_policy == "next"
        rx = canvas.sx_to_vx(renderer.glyph.sx[i+1])
        ry = canvas.sy_to_vy(renderer.glyph.sy[i+1])

      else if @model.line_policy == "nearest"
        d1x = renderer.glyph.sx[i]
        d1y = renderer.glyph.sy[i]
        dist1 = hittest.dist_2_pts(d1x, d1y, sx, sy)

        d2x = renderer.glyph.sx[i+1]
        d2y = renderer.glyph.sy[i+1]
        dist2 = hittest.dist_2_pts(d2x, d2y, sx, sy)

        if dist1 < dist2
          [sdatax, sdatay] = [d1x, d1y]
        else
          [sdatax, sdatay] = [d2x, d2y]
          i = i+1

        data_x = renderer.glyph._x[i]
        data_y = renderer.glyph._y[i]
        rx = canvas.sx_to_vx(sdatax)
        ry = canvas.sy_to_vy(sdatay)

      else
          [rx, ry] = [vx, vy]

      vars = {index: i, x: x, y: y, vx: vx, vy: vy, sx: sx, sy: sy, data_x: data_x, data_y: data_y, rx:rx, ry:ry}

      tooltip.add(rx, ry, @_render_tooltips(ds, i, vars))

    for i in indices['1d'].indices
      # multiglyphs will set '1d' and '2d' results, but have different tooltips
      if not _.isEmpty(indices['2d'])
        for pair in _.pairs(indices['2d'])
          [i, j] = [pair[0], pair[1][0]]
          data_x = renderer.glyph._xs[i][j]
          data_y = renderer.glyph._ys[i][j]

          if @model.line_policy == "interp" # and renderer.get_interpolation_hit?
            [data_x, data_y] = renderer.glyph.get_interpolation_hit(i, j, geometry)
            rx = xmapper.map_to_target(data_x)
            ry = ymapper.map_to_target(data_y)

          else if @model.line_policy == "prev"
            rx = canvas.sx_to_vx(renderer.glyph.sxs[i][j])
            ry = canvas.sy_to_vy(renderer.glyph.sys[i][j])

          else if @model.line_policy == "next"
            rx = canvas.sx_to_vx(renderer.glyph.sxs[i][j+1])
            ry = canvas.sy_to_vy(renderer.glyph.sys[i][j+1])

          else if @model.line_policy == "nearest"
            d1x = renderer.glyph.sx[i][j]
            d1y = renderer.glyph.sy[i][j]
            dist1 = hittest.dist_2_pts(d1x, d1y, sx, sy)

            d2x = renderer.glyph.sx[i][j+1]
            d2y = renderer.glyph.sy[i][j+1]
            dist2 = hittest.dist_2_pts(d2x, d2y, sx, sy)

            if dist1 < dist2
              [sdatax, sdatay] = [d1x, d1y]
            else
              [sdatax, sdatay] = [d2x, d2y]
              j = j+1

            data_x = renderer.glyph._x[i][j]
            data_y = renderer.glyph._y[i][j]
            rx = canvas.sx_to_vx(sdatax)
            ry = canvas.sy_to_vy(sdatay)

          vars = {index: i, segment_index: j, x: x, y: y, vx: vx, vy: vy, sx: sx, sy: sy, data_x: data_x, data_y: data_y}

          tooltip.add(rx, ry, @_render_tooltips(ds, i, vars))

      else
        # handle non-multiglyphs
        data_x = renderer.glyph._x?[i]
        data_y = renderer.glyph._y?[i]
        if @model.point_policy == 'snap_to_data' # and renderer.glyph.sx? and renderer.glyph.sy?
          # Pass in our screen position so we can determine
          # which patch we're over if there are discontinuous
          # patches.
          pt = renderer.glyph.get_anchor_point(@model.anchor, i, [sx, sy])
          if pt?
            {x, y} = pt
          else
            {x, y} = renderer.glyph.get_anchor_point("center", i, [sx, sy])

          rx = canvas.sx_to_vx(x)
          ry = canvas.sy_to_vy(y)
        else
          [rx, ry] = [vx, vy]

        vars = {index: i, x: x, y: y, vx: vx, vy: vy, sx: sx, sy: sy, data_x: data_x, data_y: data_y}

        tooltip.add(rx, ry, @_render_tooltips(ds, i, vars))

    return null

  _emit_callback: (geometry) ->
    r = @mget('computed_renderers')[0]
    indices = @plot_view.renderer_views[r.id].hit_test(geometry)

    canvas = @plot_model.canvas
    frame = @plot_model.frame

    geometry['sx'] = canvas.vx_to_sx(geometry.vx)
    geometry['sy'] = canvas.vy_to_sy(geometry.vy)

    xmapper = frame.get('x_mappers')[r.get('x_range_name')]
    ymapper = frame.get('y_mappers')[r.get('y_range_name')]
    geometry['x'] = xmapper.map_from_target(geometry.vx)
    geometry['y'] = ymapper.map_from_target(geometry.vy)

    callback = @model.callback
    [obj, data] = [callback, {index: indices, geometry: geometry}]

    if _.isFunction(callback)
      callback(obj, data)
    else
      callback.execute(obj, data)

    return

  _render_tooltips: (ds, i, vars) ->
    tooltips = @mget("tooltips")
    if _.isString(tooltips)
      return $('<div>').html(Util.replace_placeholders(tooltips, ds, i, vars))
    else if _.isFunction(tooltips)
      return tooltips(ds, vars)
    else
      table = $('<table></table>')

      for [label, value] in tooltips
        row = $("<tr></tr>")
        row.append($("<td class='bk-tooltip-row-label'>").text("#{label}: "))
        td = $("<td class='bk-tooltip-row-value'></td>")

        if value.indexOf("$color") >= 0
          [match, opts, colname] = value.match(/\$color(\[.*\])?:(\w*)/)
          column = ds.get_column(colname)
          if not column?
            span = $("<span>").text("#{colname} unknown")
            td.append(span)
            continue
          hex = opts?.indexOf("hex") >= 0
          swatch = opts?.indexOf("swatch") >= 0
          color = column[i]
          if not color?
            span = $("<span>(null)</span>")
            td.append(span)
            continue
          if hex
            color = _color_to_hex(color)
          span = $("<span>").text(color)
          td.append(span)
          if swatch
            span = $("<span class='bk-tooltip-color-block'> </span>")
            span.css({ backgroundColor: color})
          td.append(span)
        else
          value = value.replace("$~", "$data_")
          value = Util.replace_placeholders(value, ds, i, vars)
          td.append($('<span>').html(value))

        row.append(td)
        table.append(row)

      return table

class HoverTool extends InspectTool.Model
  default_view: HoverToolView
  type: "HoverTool"
  tool_name: "Hover Tool"
  icon: "bk-tool-icon-hover"

  @define {
      tooltips: [ p.Any,
        [
          ["index",         "$index"]
          ["data (x, y)",   "($x, $y)"]
          ["canvas (x, y)", "($sx, $sy)"]
        ] ] # TODO (bev)
      renderers:    [ p.Array,  []             ]
      names:        [ p.Array,  []             ]
      mode:         [ p.String, 'mouse'        ] # TODO (bev)
      point_policy: [ p.String, 'snap_to_data' ] # TODO (bev) "follow_mouse", "none"
      line_policy:  [ p.String, 'prev'         ] # TODO (bev) "next", "nearest", "interp", "none"
      show_arrow:   [ p.Boolean, true          ]
      anchor:       [ p.String, 'center'       ] # TODO: enum
      attachment:   [ p.String, 'horizontal'   ] # TODO: enum
      callback:     [ p.Any                    ] # TODO: p.Either(p.Instance(Callback), p.Function) ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)

    @define_computed_property('computed_renderers',
      () ->
        renderers = @get('renderers')
        names = @get('names')

        if renderers.length == 0
          all_renderers = @get('plot').get('renderers')
          renderers = (r for r in all_renderers when r instanceof GlyphRenderer.Model)

        if names.length > 0
          renderers = (r for r in renderers when names.indexOf(r.get('name')) >= 0)

        return renderers
      , true)
    @add_dependencies('computed_renderers', this, ['renderers', 'names', 'plot'])
    @add_dependencies('computed_renderers', @get('plot'), ['renderers'])

    @define_computed_property('ttmodels',
      () ->
        ttmodels = {}
        tooltips = @get("tooltips")

        if tooltips?
          for r in @get('computed_renderers')
            tooltip = new Tooltip.Model({
              custom: _.isString(tooltips) or _.isFunction(tooltips)
              attachment: @attachment
              show_arrow: @show_arrow
            })
            ttmodels[r.id] = tooltip

        return ttmodels
      , true)
    @add_dependencies('ttmodels', this, ['computed_renderers', 'tooltips'])

    @override_computed_property('synthetic_renderers', (() -> _.values(@get("ttmodels"))), true)
    @add_dependencies('synthetic_renderers', this, ['ttmodels'])

module.exports =
  Model: HoverTool
  View: HoverToolView
