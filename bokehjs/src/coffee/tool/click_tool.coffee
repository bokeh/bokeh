
define [
  "underscore",
  "common/collection",
  "./tool",
], (_, Collection, Tool) ->

  class ClickToolView extends Tool.View
    initialize: (options) ->
      super(options)
      @listenTo(@, 'clicked', ((selected, ds) -> console.log selected, ds))
      @active = false

    view_coords: (sx, sy) ->
      [vx, vy] = [
        @plot_view.canvas.sx_to_vx(sx)
        @plot_view.canvas.sy_to_vy(sy)
      ]
      return [vx, vy]

    bind_bokeh_events: () ->

      tool_name = "click_tool"

      if not @mget('always_active')
        @tool_button = $("<button type='button' class='bk-toolbar-button'> Click </button>")
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
        )

        @plot_view.eventSink.on("#{tool_name}:activated", =>
          @active=true;
          @tool_button.addClass('active')
        )

      @plot_view.canvas_view.canvas_wrapper.bind("mousedown", (e) =>
        if not @active and not @mget('always_active')
          return
        @start_posx = e.pageX
        @start_posy = e.pageY
      )

      @plot_view.canvas_view.canvas_wrapper.bind("mouseup", (e) =>
        if not @active and not @mget('always_active')
          return
        if @start_posx != e.pageX or @start_posy != e.pageY
          return
        offset = $(e.currentTarget).offset()
        left = if offset? then offset.left else 0
        top = if offset? then offset.top else 0
        e.bokehX = e.pageX - left
        e.bokehY = e.pageY - top

        [vx, vy] = @view_coords(e.bokehX, e.bokehY)

        @_select(vx, vy, e)
      )

    _select: (vx, vy, e) ->
      geometry = {
        type: 'point'
        vx: vx
        vy: vy
      }

      datasources = {}
      datasource_selections = {}
      renderers = @mget('renderers')
      for renderer in renderers
        datasource = renderer.get('data_source')
        datasources[datasource.id] = datasource
      for renderer in renderers
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

        if selected.length == 0
          continue

        @trigger('clicked', selected, ds)

      return null

  class ClickTool extends Tool.Model
    default_view: ClickToolView
    type: "ClickTool"

    initialize: (attrs, options) ->
      super(attrs, options)
      names = @get('names')
      all_renderers = @get('plot').get('renderers')
      renderers = (r for r in all_renderers when r.type == "Glyph")
      if names.length > 0
        renderers = (r for r in renderers when names.indexOf(r.get('name')) >= 0)
      @set('renderers', renderers)

    defaults: ->
      return _.extend {}, super(), {
        renderers: []
        names: []
        always_active: []
      }

  class ClickTools extends Collection
    model: ClickTool

  return {
    "Model": ClickTool,
    "Collection": new ClickTools(),
    "View": ClickToolView,
  }
