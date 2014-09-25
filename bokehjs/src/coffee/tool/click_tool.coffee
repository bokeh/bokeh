
define [
  "underscore",
  "common/collection",
  "./tool",
], (_, Collection, Tool) ->

  class ClickToolView extends Tool.View
    initialize: (options) ->
      super(options)
      @active = false

    bind_bokeh_events: () ->
      tool_name = "click_tool"

      if not @mget('always_active')
        @tool_button = $("<button class='bk-toolbar-button'> Click </button>")
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

        offset = $(e.currentTarget).offset()
        left = if offset? then offset.left else 0
        top = if offset? then offset.top else 0
        e.bokehX = e.pageX - left
        e.bokehY = e.pageY - top

        if @mget('style') == "button"
          [vx, vy] = @view_coords(e.bokehX, e.bokehY)
          @_select(vx, vy, e)

        else
          @start_posx = e.pageX
          @start_posy = e.pageY

      )

      @plot_view.canvas_view.canvas_wrapper.bind("mouseup", (e) =>
        if not @active and not @mget('always_active')
          return

        offset = $(e.currentTarget).offset()
        left = if offset? then offset.left else 0
        top = if offset? then offset.top else 0
        e.bokehX = e.pageX - left
        e.bokehY = e.pageY - top

        if @mget('style') == "button"
          @_clear()

        else
          if @start_posx != e.pageX or @start_posy != e.pageY
            return
          [vx, vy] = @view_coords(e.bokehX, e.bokehY)
          @_select(vx, vy, e)

      )

    _clear: () ->
      for r in @mget('renderers')
        ds = r.get('data_source')
        sm = ds.get('selection_manager')
        sm.clear(@)

    _select: (vx, vy, e) ->
      geometry = {
        type: 'point'
        vx: vx
        vy: vy
      }
      append = @mget('style') == "click" and e.shiftKey
      for r in @mget('renderers')
        ds = r.get('data_source')
        sm = ds.get('selection_manager')
        sm.select(@, @plot_view.renderers[r.id], geometry, true, append)

  class ClickTool extends Tool.Model
    default_view: ClickToolView
    type: "ClickTool"

    initialize: (attrs, options) ->
      super(attrs, options)
      names = @get('names')
      renderers = @get('renderers')
      if renderers.length == 0
        all_renderers = @get('plot').get('renderers')
        renderers = (r for r in all_renderers when r.type == "Glyph")
      if names.length > 0
        renderers = (r for r in renderers when names.indexOf(r.get('name')) >= 0)
      @set('renderers', renderers)

    defaults: ->
      return _.extend {}, super(), {
        renderers: []
        names: []
        always_active: true
        style: "click"
      }

  class ClickTools extends Collection
    model: ClickTool

  return {
    "Model": ClickTool,
    "Collection": new ClickTools(),
    "View": ClickToolView,
  }
