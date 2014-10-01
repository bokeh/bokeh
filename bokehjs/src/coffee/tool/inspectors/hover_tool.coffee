
define [
  "underscore"
  "sprintf"
  "common/collection"
  "renderer/annotation/tooltip"
  "tool/inspect_tool"
], (_, sprintf, Collection, Tooltip, InspectTool) ->

  _color_to_hex = (color) ->
    if (color.substr(0, 1) == '#')
        return color
    digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color)

    red = parseInt(digits[2])
    green = parseInt(digits[3])
    blue = parseInt(digits[4])

    rgb = blue | (green << 8) | (red << 16)
    return digits[1] + '#' + rgb.toString(16)

  _format_number = (number) ->
    # will get strings for categorical types, just pass back
    if typeof(number) == "string"
      return number
    if Math.floor(number) == number
      return sprintf("%d", number)
    if Math.abs(number) > 0.1 and Math.abs(number) < 1000
      return sprintf("%0.3f", number)
    return sprintf("%0.3e", number)

  _hover_icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA8ElEQVQ4T42T0Q2CMBCGaQjPxgmMG/jelIQN3ECZQEfADRwBJzBuQCC81wlkBHxvqP8lmhTsUfpSWvp/vfvvKiJn1HVdpml6dPdC38I90DSNxVobYzKMPiSm/z5AZK3t4zjOpJQ6BPECfiKAcqRUzkFmASQEhHzJOUgQ8BWyviwFsL4sBnC+LAE84YMWQnSAVCixdkvMAiB6Q7TCfJtrLq4PHkmSnHHbi0LHvOYa6w/g3kitjSgOYFyUUoWvlCPA9C1gvQfgDmiHNLZBgO8A3geZt+G6chQBA7hi/0QVQBrZ9EwQ0LbtbhgGghQAVFPAB25HmRH8b2/nAAAAAElFTkSuQmCC'

  class HoverToolView extends InspectTool.View

    bind_bokeh_events: () ->
      for r in @mget('renderers')
        @listenTo(r.get('data_source'), 'inspect', @_update)

      @plot_view.canvas_view.canvas_wrapper.css('cursor', 'crosshair')

    _exit_inner: ()->
      @tooltip.clear()

    _inspect: (vx, vy, e) ->
      geometry = {
        type: 'point'
        vx: vx
        vy: vy
      }
      for r in @mget('renderers')
        sm = r.get('data_source').get('selection_manager')
        sm.inspect(@, @plot_view.renderers[r.id], geometry, {"geometry": geometry})

    _update: (indices, tool, renderer, ds, {geometry}) ->

      @mget('tooltip').clear()

      if indices.length == 0
        return

      canvas = @plot_model.get('canvas')
      frame = @plot_model.get('frame')

      sx = canvas.vx_to_sx(vx)
      sy = canvas.vy_to_sy(vy)

      xmapper = frame.get('x_mappers')[renderer.mget('x_range_name')]
      ymapper = frame.get('y_mappers')[renderer.mget('y_range_name')]
      x = xmapper.map_from_target(vx)
      y = ymapper.map_from_target(vy)

      for i in  indices

        if @mget('snap_to_marker')
          rx = canvas.sx_to_vx(renderer.sx[i])
          ry = canvas.sy_to_vy(renderer.sy[i])
        else
          [rx, ry] = [vx, vy]

        table = $('<table></table>')

        for label, value of @mget("tooltips")
          row = $("<tr></tr>")
          row.append($("<td class='bokeh_tooltip_row_label'>#{ label }: </td>"))
          td = $("<td class='bokeh_tooltip_row_value'></td>")

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
              span = $("<span class='bokeh_tooltip_color_block'> </span>")
              span.css({ backgroundColor: color})
            td.append(span)

          else
            value = value.replace("$index", "#{ i }")
            value = value.replace("$x", "#{ _format_number(x) }")
            value = value.replace("$y", "#{ _format_number(y) }")
            value = value.replace("$vx", "#{ vx }")
            value = value.replace("$vy", "#{ vy }")
            value = value.replace("$sx", "#{ sx }")
            value = value.replace("$sy", "#{ sy }")
            while value.indexOf("@") >= 0
              [match, unused, column_name] = value.match(/(@)(\w*)/)
              column = ds.get_column(column_name)
              if not column?
                value = value.replace(column_name, "#{ column_name } unknown")
                break
              column = ds.get_column(column_name)
              dsvalue = column[i]
              if typeof(dsvalue) == "number"
                value = value.replace(match, "#{ _format_number(dsvalue) }")
              else
                value = value.replace(match, "#{ dsvalue }")
            span = $("<span>#{ value }</span>")
            td.append(span)

          row.append(td)
          table.append(row)

        @mget('tooltip').add(rx, ry, table)

      return null

  class HoverTool extends InspectTool.Model
    default_view: HoverToolView
    type: "HoverTool"
    tool_name: "Hover Tool"

    initialize: (attrs, options) ->
      super(attrs, options)
      @set('tooltip', new Tooltip.Model())
      plot_renderers = @get('plot').get('renderers')
      plot_renderers.push(@get('tooltip'))

    defaults: () ->
      return _.extend({}, super(), {
        snap_to_marker: true
        tooltips: {
          "index": "$index"
          "data (x, y)": "($x, $y)"
          "canvas (x, y)": "($sx, $sy)"
        }
      })

  class HoverTools extends Collection
    model: HoverTool

  return {
    "Model": HoverTool,
    "Collection": new HoverTools(),
    "View": HoverToolView,
  }
