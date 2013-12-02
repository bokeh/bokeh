
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
      #@select_callback = _.debounce((() => @_select_data()), 50)
      #@listenTo(@model, 'change', @select_callback)

    bind_bokeh_events: () ->
      super()
      for renderer in @mget_obj('renderers')
        rendererview = @plot_view.renderers[renderer.id]
        @listenTo(rendererview.xrange(), 'change',
          @select_callback)
        @listenTo(rendererview.yrange(), 'change',
          @select_callback)
        @listenTo(renderer, 'change', @select_callback)
        # @listenTo(renderer.get_obj('data_source'), 'change',
        #   @select_callback)
        @listenTo(renderer, 'change', @select_callback)

    eventGeneratorClass: TwoPointEventGenerator
    evgen_options:
      keyName:"ctrlKey",
      buttonText:"Select",
      restrict_to_innercanvas: true
    tool_events: {
      SetBasepoint: "_start_selecting",
      UpdatingMouseMove: "_selecting",
      deactivated: "_stop_selecting",
      #DragEnd : "_select_data"
      DragEnd : "_dragend",
      }

    pause:()->
      ""

    mouse_coords: (e, x, y) ->
      [x, y] = [@plot_view.view_state.device_to_sx(x),
        @plot_view.view_state.device_to_sy(y)]
      return [x, y]

    _stop_selecting: () ->
      @trigger('stopselect')
      @basepoint_set = false
      @plot_view.unpause()

    _start_selecting: (e) ->
      @plot_view.pause()
      @trigger('startselect')
      [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
      @mset({'start_x': x, 'start_y': y, 'current_x': null, 'current_y': null})
      @basepoint_set = true

    _get_selection_range: ->
      xrange = [@mget('start_x'), @mget('current_x')]
      yrange = [@mget('start_y'), @mget('current_y')]
      if @mget('select_x')
        xrange = [_.min(xrange), _.max(xrange)]
      else
        xrange = null
      if @mget('select_y')
        yrange = [_.min(yrange), _.max(yrange)]
      else
        yrange = null
      return [xrange, yrange]

    _selecting: (e, x_, y_) ->
      [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
      @mset({'current_x': x, 'current_y': y})
      [@xrange, @yrange] = @_get_selection_range(x, y)
      @trigger('boxselect', @xrange, @yrange)
      if @every_select
        @_select_data()
      else
        @plot_view.render_overlays(true)
      return null

    _dragend : () ->
      console.log("dragend")
      @_select_data()
    _select_data: () ->
      if not @basepoint_set
        return
      datasources = {}
      datasource_selections = {}
      for renderer in @mget_obj('renderers')
        datasource = renderer.get_obj('data_source')
        datasources[datasource.id] = datasource

      for renderer in @mget_obj('renderers')
        datasource_id = renderer.get_obj('data_source').id
        _.setdefault(datasource_selections, datasource_id, [])
        #the select call of the render converts the screen coordinates
        #of @xrange and @yrange into data space coordinates
        selected = @plot_view.renderers[renderer.id].select(@xrange, @yrange)
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

    _get_selection_range_fast: (current_x, current_y)->
      xrange = [@mget('start_x'), current_x]
      yrange = [@mget('start_y'), current_y]
      if @mget('select_x')
        xrange = [_.min(xrange), _.max(xrange)]
      else
        xrange = null
      if @mget('select_y')
        yrange = [_.min(yrange), _.max(yrange)]
      else
        yrange = null
      return [xrange, yrange]

  class BoxSelectTool extends Tool.Model
    default_view: BoxSelectToolView
    type: "BoxSelectTool"

    defaults: () ->
      return _.extend(super(), {
        renderers: []
        select_x: true
        select_y: true
        select_every_mousemove: true
        data_source_options: {} #backbone options for save on datasource
      })

    display_defaults: () ->
      super()

  class BoxSelectTools extends Backbone.Collection
    model: BoxSelectTool

  return {
    "Model": BoxSelectTool,
    "Collection": new BoxSelectTools(),
    "View": BoxSelectToolView,
  }
