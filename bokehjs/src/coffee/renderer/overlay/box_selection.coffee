
define [
  "underscore",
  "common/has_parent",
  "common/plot_widget",
], (_, HasParent, PlotWidget) ->

  class BoxSelectionView extends PlotWidget

    initialize: (options) ->
      @selecting = false
      @xrange = [null, null]
      @yrange = [null, null]
      super(options)
      @plot_view.$el.find('.bokeh_canvas_wrapper').append(@$el)

    boxselect: (xrange, yrange) ->
      @xrange = xrange
      @yrange = yrange
      @request_render()

    startselect: () ->
      @selecting = true
      @xrange = [null, null]
      @yrange = [null, null]
      @request_render()

    stopselect: () ->
      @selecting = false
      @xrange = [null, null]
      @yrange = [null, null]
      @request_render()

    bind_bokeh_events: (options) ->
      @toolview = @plot_view.tools[@mget('tool').id]
      @listenTo(@toolview, 'boxselect', @boxselect)
      @listenTo(@toolview, 'startselect', @startselect)
      @listenTo(@toolview, 'stopselect', @stopselect)

    render: () ->
      if not @selecting
        @$el.removeClass('shading')
        return
      xrange = @xrange
      yrange = @yrange
      if _.any(_.map(xrange, _.isNullOrUndefined)) or
        _.any(_.map(yrange, _.isNullOrUndefined))
          @$el.removeClass('shading')
          return
      style_string = ""
      if xrange
        xpos = @plot_view.view_state.vx_to_sx(Math.min(xrange[0], xrange[1]))
        width = Math.abs(xrange[1] - xrange[0])
      else
        xpos = 0
        width = @plot_view.view_state.get('width')
      style_string += "; left:#{xpos}px; width:#{width}px; "
      if yrange
        ypos = @plot_view.view_state.vy_to_sy(Math.max(yrange[0], yrange[1]))
        height = Math.abs(yrange[1] - yrange[0])
      else
        ypos = 0
        height = @plot_view.view_state.get('height')
      @$el.addClass('shading')
      style_string += "top:#{ypos}px; height:#{height}px"
      @$el.attr('style', style_string)

  class BoxSelection extends HasParent
    default_view: BoxSelectionView
    type: "BoxSelection"

    defaults: () ->
      return {
        tool: null
        level: 'overlay'
      }

  class BoxSelections extends Backbone.Collection
    model: BoxSelection

  return {
    "Model": BoxSelection,
    "Collection": new BoxSelections(),
    "View": BoxSelectionView
  }

