
define [
  "underscore",
  "backbone",
  "sprintf",
  "./tool",
], (_, Backbone, sprintf, Tool) ->

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

  class HoverToolView extends Tool.View
    initialize: (options) ->
      super(options)
      @div = $('<div class="bokeh_tooltip" />').appendTo('body')
      @div.hide()
      @active = false
      @xmapper = @plot_view.frame.get('x_mappers')[@x_range_name]
      @ymapper = @plot_view.frame.get('y_mappers')[@y_range_name]

    bind_bokeh_events: () ->

      tool_name = "hover_tool"

      if not @mget('always_active')
        @tool_button = $("<button class='bk-toolbar-button hover'>
          <img class='bk-btn-icon' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA8ElEQVQ4T42T0Q2CMBCGaQjPxgmMG/jelIQN3ECZQEfADRwBJzBuQCC81wlkBHxvqP8lmhTsUfpSWvp/vfvvKiJn1HVdpml6dPdC38I90DSNxVobYzKMPiSm/z5AZK3t4zjOpJQ6BPECfiKAcqRUzkFmASQEhHzJOUgQ8BWyviwFsL4sBnC+LAE84YMWQnSAVCixdkvMAiB6Q7TCfJtrLq4PHkmSnHHbi0LHvOYa6w/g3kitjSgOYFyUUoWvlCPA9C1gvQfgDmiHNLZBgO8A3geZt+G6chQBA7hi/0QVQBrZ9EwQ0LbtbhgGghQAVFPAB25HmRH8b2/nAAAAAElFTkSuQmCC'/>
            <span class='tip'>Hover</span>
          </button>")
        @plot_view.$el.find('.bk-button-bar').append(@tool_button)
        @tool_button.click(=>
          if @active
            @plot_view.eventSink.trigger("clear_active_tool")
          else
            @plot_view.eventSink.trigger("active_tool", tool_name)
          )

        @plot_view.eventSink.on("#{tool_name}:deactivated", =>
          @active=false;
          @tool_button.removeClass('active')
          @div.hide()
        )

        @plot_view.eventSink.on("#{tool_name}:activated", =>
          @active=true;
          @tool_button.addClass('active')
        )

      @plot_view.canvas_view.canvas.bind("mousemove", (e) =>
        if not @active and not @mget('always_active')
          return
        offset = $(e.currentTarget).offset()
        left = if offset? then offset.left else 0
        top = if offset? then offset.top else 0
        e.bokehX = e.pageX - left
        e.bokehY = e.pageY - top

        [vx, vy] = @view_coords(e.bokehX, e.bokehY)

        irh = @plot_view.frame.get('h_range')
        irv = @plot_view.frame.get('v_range')
        xstart = irh.get('start')
        xend = irh.get('end')
        ystart = irv.get('start')
        yend = irv.get('end')
        if vx < xstart  or vx > xend or vy < ystart or vy > yend
          @div.hide()
          return

        @_select(vx, vy, e)
      )
      @plot_view.canvas_view.canvas_wrapper.css('cursor', 'crosshair')

    view_coords: (sx, sy) ->
      [vx, vy] = [
        @plot_view.canvas.sx_to_vx(sx),
        @plot_view.canvas.sy_to_vy(sy)
      ]
      return [vx, vy]

    _select: (vx, vy, e) ->
      geometry = {
        type: 'point'
        vx: vx
        vy: vy
      }
      datasources = {}
      datasource_selections = {}
      for renderer in @mget('renderers')
        datasource = renderer.get('data_source')
        datasources[datasource.id] = datasource
      for renderer in @mget('renderers')
        datasource_id = renderer.get('data_source').id
        _.setdefault(datasource_selections, datasource_id, [])
        selected = @plot_view.renderers[renderer.id].hit_test(geometry)
        ds = datasources[datasource_id]

        xmapper = @plot_view.frame.get('x_mappers')[renderer.get('x_range_name')]
        ymapper = @plot_view.frame.get('y_mappers')[renderer.get('y_range_name')]
        x = xmapper.map_from_target(vx)
        y = ymapper.map_from_target(vy)

        if selected == null
          continue
        if selected.length > 0
          i = selected[0]
          @div.empty()
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
              value = value.replace("$sx", "#{ e.bokehX }")
              value = value.replace("$sy", "#{ e.bokehY }")
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

          @div.append(table)
          ow = @plot_view.frame.get('width')
          if vx < ow/2
            @div.removeClass('right')
            @div.addClass('left')
            @div.css({
              top: e.pageY - @div.height()/2,
              left: e.pageX + 18,
            })
          else
            @div.removeClass('left')
            @div.addClass('right')
            @div.css({
              top: e.pageY - @div.height()/2,
              left: e.pageX - @div.width() - 23,
            })
          @div.show()
          break
        else
          @div.hide()
        datasource_selections[datasource_id].push(selected)

      return null

  class HoverTool extends Tool.Model
    default_view: HoverToolView
    type: "HoverTool"

    initialize: (attrs, options) ->
      super(attrs, options)
      names = @get('names')
      all_renderers = @get('plot').get('renderers')
      renderers = (r for r in all_renderers when r.type == "Glyph")
      if names.length > 0
        renderers = (r for r in renderers when names.indexOf(r.get('name')) >= 0)
      @set('renderers', renderers)

    defaults: () ->
      return _.extend(super(), {
        renderers: []
        names: []
        tooltips: {
          "index": "$index"
          "data (x, y)": "($x, $y)"
          "canvas (x, y)": "($sx, $sy)"
        }
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
