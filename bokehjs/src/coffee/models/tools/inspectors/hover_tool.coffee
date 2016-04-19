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
      @listenTo(r.get('data_source'), 'inspect', @_update)

    @plot_view.canvas_view.$el.css('cursor', 'crosshair')

  _move: (e) ->
    if not @mget('active')
      return
    canvas = @plot_view.canvas
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)
    if not @plot_view.frame.contains(vx, vy)
      for rid, tt of @mget('ttmodels')
        tt.clear()
      return
    @_inspect(vx, vy)

  _move_exit: ()->
    for rid, tt of @mget('ttmodels')
      tt.clear()

  _inspect: (vx, vy, e) ->
    geometry = {
      type: 'point'
      vx: vx
      vy: vy
    }

    if @mget('mode') == 'mouse'
      geometry['type'] = 'point'
    else
        geometry['type'] = 'span'
        if @mget('mode') == 'vline'
          geometry.direction = 'h'
        else
          geometry.direction = 'v'

    hovered_indexes = []
    hovered_renderers = []

    for r in @mget('computed_renderers')
      sm = r.get('data_source').get('selection_manager')
      sm.inspect(@, @plot_view.renderers[r.id], geometry, {"geometry": geometry})

    if @mget('callback')?
      @_emit_callback(geometry)

    return

  _update: (indices, tool, renderer, ds, {geometry}) ->
    tooltip = @mget('ttmodels')[renderer.model.id] ? null
    if not tooltip?
      return

    tooltip.clear()

    [i1d, i2d] = [indices['1d'].indices, indices['2d'].indices]
    if indices['0d'].glyph == null and i1d.length == 0 and i2d.length == 0
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
      data_x = renderer.glyph.x[i+1]
      data_y = renderer.glyph.y[i+1]

      if @mget('line_policy') == "interp"# and renderer.get_interpolation_hit?
        [data_x, data_y] = renderer.glyph.get_interpolation_hit(i, geometry)
        rx = xmapper.map_to_target(data_x)
        ry = ymapper.map_to_target(data_y)

      else if @mget('line_policy') == "prev"
        rx = canvas.sx_to_vx(renderer.glyph.sx[i])
        ry = canvas.sy_to_vy(renderer.glyph.sy[i])

      else if @mget('line_policy') == "next"
        rx = canvas.sx_to_vx(renderer.glyph.sx[i+1])
        ry = canvas.sy_to_vy(renderer.glyph.sy[i+1])

      else if @mget('line_policy') == "nearest"
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

        data_x = renderer.glyph.x[i]
        data_y = renderer.glyph.y[i]
        rx = canvas.sx_to_vx(sdatax)
        ry = canvas.sy_to_vy(sdatay)

      else
          [rx, ry] = [vx, vy]

      vars = {index: i, x: x, y: y, vx: vx, vy: vy, sx: sx, sy: sy, data_x: data_x, data_y: data_y, rx:rx, ry:ry}
      tooltip.add(rx, ry, @_render_tooltips(ds, i, vars))

    for i in indices['1d'].indices
      # patches will not have .x, .y attributes, for instance
      data_x = renderer.glyph.x?[i]
      data_y = renderer.glyph.y?[i]
      if @mget('point_policy') == 'snap_to_data'# and renderer.glyph.sx? and renderer.glyph.sy?
        # Pass in our screen position so we can determine
        # which patch we're over if there are discontinuous
        # patches.
        rx = canvas.sx_to_vx(renderer.glyph.scx(i, sx, sy))
        ry = canvas.sy_to_vy(renderer.glyph.scy(i, sx, sy))
      else
        [rx, ry] = [vx, vy]

      vars = {index: i, x: x, y: y, vx: vx, vy: vy, sx: sx, sy: sy, data_x: data_x, data_y: data_y}

      tooltip.add(rx, ry, @_render_tooltips(ds, i, vars))

    return null

  _emit_callback: (geometry) ->
    r = @mget('computed_renderers')[0]
    indices = @plot_view.renderers[r.id].hit_test(geometry)

    canvas = @plot_model.get('canvas')
    frame = @plot_model.get('frame')

    geometry['sx'] = canvas.vx_to_sx(geometry.vx)
    geometry['sy'] = canvas.vy_to_sy(geometry.vy)

    xmapper = frame.get('x_mappers')[r.get('x_range_name')]
    ymapper = frame.get('y_mappers')[r.get('y_range_name')]
    geometry['x'] = xmapper.map_from_target(geometry.vx)
    geometry['y'] = ymapper.map_from_target(geometry.vy)

    callback = @mget('callback')
    [obj, data] = [@model, {index: indices, geometry: geometry}]

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
            tooltip = new Tooltip.Model()
            tooltip.set("custom", _.isString(tooltips) or _.isFunction(tooltips))
            ttmodels[r.id] = tooltip

        return ttmodels
      , true)
    @add_dependencies('ttmodels', this, ['computed_renderers', 'tooltips'])

    @override_computed_property('synthetic_renderers', (() -> _.values(@get("ttmodels"))), true)
    @add_dependencies('synthetic_renderers', this, ['ttmodels'])

module.exports =
  Model: HoverTool
  View: HoverToolView
