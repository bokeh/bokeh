
define [
  "underscore",
  "backbone",
  "./tool",
  "./event_generators",
], (_, Backbone, Tool, EventGenerators) ->

  TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator

  class BoxSelectToolView extends Tool.View
    initialize: (options) ->
      super(options)
      @select_every_mousemove = @mget('select_every_mousemove')

    bind_bokeh_events: () ->
      super()
      for renderer in @mget ('renderers')
        rendererview = @plot_view.renderers[renderer.id]
        @listenTo(rendererview.xrange(), 'change', @select_callback)
        @listenTo(rendererview.yrange(), 'change', @select_callback)
        @listenTo(renderer, 'change', @select_callback)

    eventGeneratorClass: TwoPointEventGenerator
    toolType: "BoxSelectTool"

    evgen_options:
      keyName: "shiftKey"
      buttonText: "Select"
      buttonHook: "select"
      buttonIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAgCAYAAAB6kdqOAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpBODVDNDBCRjIwQjMxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpBODVDNDBDMDIwQjMxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkE4NUM0MEJEMjBCMzExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkE4NUM0MEJFMjBCMzExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+hdQ7dQAAAJdJREFUeNpiXLhs5X8GBPgIxAJQNjZxfiD+wIAKGCkUZ0SWZGIYZIAF3YVoPkEHH6kojhUMyhD6jydEaAlgaWnwh9BAgf9DKpfxDxYHjeay0Vw2bHMZw2guG81lwyXKRnMZWlt98JdDTFAX/x9NQwPkIH6kGMAVEyjyo7lstC4jouc69Moh9L42rlyBTZyYXDS00xBAgAEAqsguPe03+cYAAAAASUVORK5CYII="
      cursor: "crosshair"
      restrict_to_innercanvas: true

    tool_events:
      SetBasepoint: "_start_selecting"
      UpdatingMouseMove: "_selecting"
      deactivated: "_stop_selecting"
      DragEnd: "_dragend"

    pause:()->
      return null

    view_coords: (sx, sy) ->
      [vx, vy] = [
        @plot_view.canvas.sx_to_vx(sx),
        @plot_view.canvas.sy_to_vy(sy)
      ]
      return [vx, vy]

    _stop_selecting: () ->
      @trigger('stopselect')
      @basepoint_set = false
      @plot_view.unpause()

    _start_selecting: (e) ->
      @plot_view.pause()
      @trigger('startselect')
      [vx, vy] = @view_coords(e.bokehX, e.bokehY)
      @mset({'start_vx': vx, 'start_vy': vy, 'current_vx': null, 'current_vy': null})
      @basepoint_set = true

    _get_selection_range: ->
      if @mget('select_x')
        xrange = [@mget('start_vx'), @mget('current_vx')]
        xrange = [_.min(xrange), _.max(xrange)]
      else
        range = @plot_view.frame.get('h_range')
        xrange = [range.get('start'), range.get('end')]
      if @mget('select_y')
        yrange = [@mget('start_vy'), @mget('current_vy')]
        yrange = [_.min(yrange), _.max(yrange)]
      else
        range = @plot_view.frame.get('v_range')
        yrange = [range.get('start'), range.get('end')]
      return [xrange, yrange]

    _selecting: (e, x_, y_) ->
      [vx, vy] = @view_coords(e.bokehX, e.bokehY)
      @mset({'current_vx': vx, 'current_vy': vy})

      [@xrange, @yrange] = @_get_selection_range()
      @trigger('boxselect', @xrange, @yrange)

      if @select_every_mousemove
        @_select_data()

      @plot_view._render_levels(@plot_view.canvas_view.ctx, ['overlay'])
      return null

    _dragend : () ->
      @_select_data()

    _select_data: () ->
      if not @basepoint_set
        return

      geometry = {
        type: 'rect'
        vx0: @xrange[0]
        vx1: @xrange[1]
        vy0: @yrange[0]
        vy1: @yrange[1]
      }

      datasources = {}
      datasource_selections = {}
      for renderer in @mget('renderers')
        datasource = renderer.get('data_source')
        datasources[datasource.id] = datasource

      for renderer in @mget('renderers')
        datasource_id = renderer.get('data_source').id
        _.setdefault(datasource_selections, datasource_id, [])
        #the select call of the render converts the screen coordinates
        #of @xrange and @yrange into data space coordinates
        selected = @plot_view.renderers[renderer.id].hit_test(geometry)
        datasource_selections[datasource_id].push(selected)

      for own k,v of datasource_selections

        #FIXME: I'm not sure why this is here, when will v have more than one element?
        #
        # This next line is the equivalent of calling
        #_.intersection(v[0], v[1], v[2]...) for however many
        #subelements v has.  each member of the v list will have another
        #list inside it.  thus this line finds the intersection of the
        #lists of v.
        selected = _.intersection.apply(_, v)
        ds = datasources[k]
        ds.save(
          selected:selected
        ,
          {patch: true}
        )
        @plot_view.unpause()
      return null

  class BoxSelectTool extends Tool.Model
    default_view: BoxSelectToolView
    type: "BoxSelectTool"

    defaults: ->
      _.extend {}, super(), {
        renderers: []
        select_x: true
        select_y: true
        select_every_mousemove: false
        data_source_options: {} # backbone options for save on datasource
      }

  class BoxSelectTools extends Backbone.Collection
    model: BoxSelectTool

  return {
    "Model": BoxSelectTool,
    "Collection": new BoxSelectTools(),
    "View": BoxSelectToolView,
  }
