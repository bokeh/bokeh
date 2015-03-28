define [
  "jquery"
  "underscore"
  "common/collection"
  "renderer/annotation/tooltip"
  "./inspect_tool"
  "util/util"
], ($, _, Collection, Tooltip, InspectTool, Util) ->

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
      for r in @mget('renderers')
        @listenTo(r.get('data_source'), 'inspect', @_update)

      @plot_view.canvas_view.canvas_wrapper.css('cursor', 'crosshair')

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
          vx: vx
          vy: vy
        }
      if @mget('mode') == 'point'
        geometry['type'] = 'point'
      else
        geometry['type'] = 'span'
        if @mget('mode') == 'vline'
          geometry.direction = 'v'
        else
          geometry.direction = 'h'

      for r in @mget('renderers')
        sm = r.get('data_source').get('selection_manager')
        sm.inspect(@, @plot_view.renderers[r.id], geometry, {"geometry": geometry})
      return

    _update: (indices, tool, renderer, ds, {geometry}) ->
      tooltip = @mget('ttmodels')[renderer.model.id] ? null
      if not tooltip?
        return

      tooltip.clear()

      if indices['0d'].flag == false
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
        # get x, y values from the rendered glyph
        if @mget('hit_value_mode') == "hit_interpolate"
          hit_point = renderer.glyph.check_interpolation_hit(i, geometry)
#          x = hit_point.x
#          y = hit_point.y
#          [vx, vy] = [x, y]

          rx = renderer.xmapper.v_map_to_target([hit_point.x])[0]
          ry = renderer.ymapper.v_map_to_target([hit_point.y])[0]
        else
          if @mget('snap_to_data') and renderer.glyph.sx? and renderer.glyph.sy?
            rx = canvas.sx_to_vx(renderer.glyph.sx[i])
            ry = canvas.sy_to_vy(renderer.glyph.sy[i])
            x = renderer.glyph.x[i]
            y = renderer.glyph.y[i]
          else
            [rx, ry] = [vx, vy]

        # TODO: Color is temp, to be removed before merging!
        color = renderer.glyph.props.line.line_color.value
        vars = {index: i, x: x, y: y, vx: vx, vy: vy, sx: sx, sy: sy, color: color, rx: rx, ry: ry}
        tooltip.add(rx, ry, @_render_tooltips(ds, i, vars))

      return null

    _render_tooltips: (ds, i, vars) ->
      tooltips = @mget("tooltips")

      if _.isString(tooltips)
        return $('<div>').html(Util.replace_placeholders(tooltips, ds, i, vars))
      else
        table = $('<table></table>')
        table.css({ backgroundColor: vars.color})

        for [label, value] in tooltips
          row = $("<tr></tr>")
          row.append($("<td class='bk-tooltip-row-label'>#{ label }: </td>"))
          td = $("<td class='bk-tooltip-row-value'></td>")


          if value.indexOf("$color") >= 0
            [match, opts, colname] = value.match(/\$color(\[.*\])?:(\w*)/)
            column = ds.get_column(colname)
            if not column?
              span = $("<span>#{ colname } unknown</span>")
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
            span = $("<span>#{ color }</span>")
            td.append(span)
            if swatch
              span = $("<span class='bk-tooltip-color-block'> </span>")
              span.css({ backgroundColor: color})
            td.append(span)
          else
            value = Util.replace_placeholders(value, ds, i, vars)
            td.append($('<span>').text(value))

          row.append(td)
          table.append(row)

        return table

  class HoverTool extends InspectTool.Model
    default_view: HoverToolView
    type: "HoverTool"
    tool_name: "Hover Tool"
    icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA8ElEQVQ4T42T0Q2CMBCGaQjPxgmMG/jelIQN3ECZQEfADRwBJzBuQCC81wlkBHxvqP8lmhTsUfpSWvp/vfvvKiJn1HVdpml6dPdC38I90DSNxVobYzKMPiSm/z5AZK3t4zjOpJQ6BPECfiKAcqRUzkFmASQEhHzJOUgQ8BWyviwFsL4sBnC+LAE84YMWQnSAVCixdkvMAiB6Q7TCfJtrLq4PHkmSnHHbi0LHvOYa6w/g3kitjSgOYFyUUoWvlCPA9C1gvQfgDmiHNLZBgO8A3geZt+G6chQBA7hi/0QVQBrZ9EwQ0LbtbhgGghQAVFPAB25HmRH8b2/nAAAAAElFTkSuQmCC'

    initialize: (attrs, options) ->
      super(attrs, options)
      ttmodels = {}
      renderers = @get('plot').get('renderers')
      for r in @get('renderers')
        tooltip = new Tooltip.Model()
        tooltip.set("custom", _.isString(@get("tooltips")))
        ttmodels[r.id] = tooltip
        renderers.push(tooltip)
      @set('ttmodels', ttmodels)
      @get('plot').set('renderers', renderers)
      return

    defaults: () ->
      return _.extend({}, super(), {
        snap_to_data: true
        hit_value_mode: 'snap_to_data' # 'glyph_center', 'hit_interpolate', 'mouse_point',

        point_policy: "snap_to_data" #, "follow_mouse", "none"
        line_policy: "prev" # "next", "nearest", "interp", "none"
        conflict_policy: "line" #, "point", "both"

        tooltips: [
          ["index",         "$index"]
          ["data (x, y)",   "($x, $y)"]
          ["canvas (x, y)", "($sx, $sy)"]
        ]
        mode: 'point'
      })

  class HoverTools extends Collection
    model: HoverTool

  return {
    Model: HoverTool
    Collection: new HoverTools()
    View: HoverToolView
  }
