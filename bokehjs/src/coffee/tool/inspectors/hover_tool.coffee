
define [
  "underscore"
  "sprintf"
  "common/collection"
  "renderer/annotation/tooltip"
  "./inspect_tool"
  "numeral"
], (_, sprintf, Collection, Tooltip, InspectTool, Numeral) ->

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
        type: 'point'
        vx: vx
        vy: vy
      }
      for r in @mget('renderers')
        sm = r.get('data_source').get('selection_manager')
        sm.inspect(@, @plot_view.renderers[r.id], geometry, {"geometry": geometry})
      return

    _update: (indices, tool, renderer, ds, {geometry}) ->

      tooltip = @mget('ttmodels')[renderer.model.id] ? null
      if not tooltip?
        return

      tooltip.clear()

      if indices.length == 0
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

      for i in  indices

        if @mget('snap_to_data') and renderer.glyph.sx? and renderer.glyph.sy?
          rx = canvas.sx_to_vx(renderer.glyph.sx[i])
          ry = canvas.sy_to_vy(renderer.glyph.sy[i])
        else
          [rx, ry] = [vx, vy]

        table = $('<table></table>')

        for [label, value] in @mget("tooltips")
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
            value = value.replace /(^|[^\$])\$(\w+)/g, (match, prefix, name) =>
              replacement = switch name
                when "index" then "#{i}"
                when "x"     then "#{_format_number(x)}"
                when "y"     then "#{_format_number(y)}"
                when "vx"    then "#{vx}"
                when "vy"    then "#{vy}"
                when "sx"    then "#{sx}"
                when "sy"    then "#{sy}"
              if replacement? then "#{prefix}#{replacement}" else match

            value = value.replace /(^|[^@])@(?:(\w+)|{([^{}]+)})(?:{([^{}]+)})?/g, (match, prefix, name, long_name, format) =>
              name = if long_name? then long_name else name
              column = ds.get_column(name)
              replacement =
                if not column?
                  "#{name} unknown"
                else
                  value = column[i]
                  if format?
                    Numeral(value).format(format)
                  else if _.isNumber(value)
                    _format_number(value)
                  else
                    value
              "#{prefix}#{replacement}"

            span = $('<span>').text(value)
            td.append(span)

          row.append(td)
          table.append(row)

        tooltip.add(rx, ry, table)

      return null

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
        ttmodels[r.id] = tooltip
        renderers.push(tooltip)
      @set('ttmodels', ttmodels)
      @get('plot').set('renderers', renderers)
      return

    defaults: () ->
      return _.extend({}, super(), {
        snap_to_data: true
        tooltips: [
          ["index", "$index"]
          ["data (x, y)", "($x, $y)"]
          ["canvas (x, y)", "($sx, $sy)"]
        ]
      })

  class HoverTools extends Collection
    model: HoverTool

  return {
    "Model": HoverTool,
    "Collection": new HoverTools(),
    "View": HoverToolView,
  }
