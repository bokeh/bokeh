
define [
  "underscore",
  "backbone",
  "./tool",
], (_, Backbone, Tool) ->

  colorToHex = (color) ->
    if (color.substr(0, 1) == '#')
        return color
    digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color)

    red = parseInt(digits[2])
    green = parseInt(digits[3])
    blue = parseInt(digits[4])

    rgb = blue | (green << 8) | (red << 16)
    return digits[1] + '#' + rgb.toString(16)

  class HoverToolView extends Tool.View
    initialize: (options) ->
      @div = $('<div class="bokeh_tooltip" />').appendTo('body')
      @div.hide()
      super(options)

    bind_bokeh_events: () ->
      @plot_view.canvas.bind("mousemove", (e) =>
        offset = $(e.currentTarget).offset()
        left = if offset? then offset.left else 0
        top = if offset? then offset.top else 0
        e.bokehX = e.pageX - left
        e.bokehY = e.pageY - top
        [vx, vy] = @view_coords(e.bokehX, e.bokehY)
        @_select(vx, vy, e)
      )
      @plot_view.canvas_wrapper.css('cursor', 'crosshair')

    pause:()->
      return null

    view_coords: (sx, sy) ->
      [vx, vy] = [
        @plot_view.view_state.sx_to_vx(sx),
        @plot_view.view_state.sy_to_vy(sy)
      ]
      return [vx, vy]

    _select: (vx, vy, e) ->
      geometry = {
        type: 'point'
        vx: vx
        vy: vy
      }
      x = @plot_view.xmapper.map_from_target(vx)
      y = @plot_view.ymapper.map_from_target(vy)

      datasources = {}
      datasource_selections = {}
      for renderer in @mget_obj('renderers')
        datasource = renderer.get_obj('data_source')
        datasources[datasource.id] = datasource

      for renderer in @mget_obj('renderers')
        datasource_id = renderer.get_obj('data_source').id
        _.setdefault(datasource_selections, datasource_id, [])
        selected = @plot_view.renderers[renderer.id].hit_test(geometry)
        ds = datasources[datasource_id]
        if selected == null
          continue
        if selected.length > 0
          i = selected[0]
          @div.empty()
          table = $('<table></table>')

          tooltips = {
            "index": "$index"
            "color": "$color[hex,swatch]:color"
            "radius": "@radius"
            "(dx, dy)": "(@x, @y)"
            "(x,y)": "($x, $y)"
            "(vx,vy)": "($vx, $vy)"
          }

          for label, value of tooltips
            row = $("<tr></tr>")
            row.append($("<td class='bokeh_tooltip_row_label'>#{ label }: </td>"))
            td = $("<td class='bokeh_tooltip_row_value'></td>")

            if value.indexOf("$color") >= 0
              [match, opts, colname] = value.match(/\$color(\[.*\])?:(\w*)/)
              column = ds.getcolumn(colname)
              if column?
                hex = opts?.indexOf("hex") >= 0
                swatch = opts?.indexOf("swatch") >= 0
                color = column[i]
                if hex
                  color = colorToHex(color)
                span = $("<span>#{ color }</span>")
                td.append(span)
                if swatch
                  span = $("<span class='bokeh_tooltip_color_block'> </span>")
                  span.css({ backgroundColor: color})
                td.append(span)

            else
              value = value.replace("$index", "#{ i }")
              value = value.replace("$x", "#{ x }")
              value = value.replace("$y", "#{ y }")
              value = value.replace("$vx", "#{ vx }")
              value = value.replace("$vy", "#{ vy }")

              while value.indexOf("@") >= 0
                [match, unused, column] = value.match(/(@)(\w*)/)
                column = ds.getcolumn(column)
                if column?
                  dsvalue = column[i]
                  value = value.replace(match, "#{ dsvalue }")
              span = $("<span>#{ value }</span>")
              td.append(span)

            row.append(td)
            table.append(row)

          @div.append(table)
          @div.css({
            top: e.pageY - @div.height()/2,
            left: e.pageX + 18
          })
          @div.show()
        else
          @div.hide()
        datasource_selections[datasource_id].push(selected)

      return null

  class HoverTool extends Tool.Model
    default_view: HoverToolView
    type: "HoverTool"

    defaults: () ->
      return _.extend(super(), {
        renderers: []
      })

    display_defaults: () ->
      super()

  class HoverTools extends Backbone.Collection
    model: HoverTool

  return {
    "Model": HoverTool,
    "Collection": new HoverTools(),
    "View": HoverToolView,
  }
