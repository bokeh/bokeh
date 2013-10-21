base = require("../base")
PlotWidget = require("../common/plot_widget").PlotWidget
HasParent = base.HasParent

class BoxSelectionOverlayView extends PlotWidget

  initialize : (options) ->
    @selecting = false
    @xrange = [null, null]
    @yrange = [null, null]
    super(options)
    @plot_view.$el.find('.bokeh_canvas_wrapper').append(@$el)

  boxselect : (xrange, yrange) ->
    @xrange = xrange
    @yrange = yrange
    @request_render()

  startselect : () ->
    @selecting = true
    @xrange = [null, null]
    @yrange = [null, null]
    @request_render()

  stopselect : () ->
    @selecting = false
    @xrange = [null, null]
    @yrange = [null, null]
    @request_render()

  bind_bokeh_events : (options) ->
    @toolview = @plot_view.tools[@mget('tool').id]
    @listenTo(@toolview, 'boxselect', @boxselect)
    @listenTo(@toolview, 'startselect', @startselect)
    @listenTo(@toolview, 'stopselect', @stopselect)

  render : () ->
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
    xpos = @plot_view.view_state.sx_to_device(Math.min(xrange[0], xrange[1]))
    if xrange
      width = Math.abs(xrange[1] - xrange[0])
    else
      width = @plot_view.view_state.get('width')
    style_string += "; left:#{xpos}px; width:#{width}px; "
    ypos = @plot_view.view_state.sy_to_device(Math.max(yrange[0], yrange[1]))
    if yrange
      height = yrange[1] - yrange[0]
    else
      height = @plot_view.view_state.get('height')
    @$el.addClass('shading')
    style_string += "top:#{ypos}px; height:#{height}px"
    @$el.attr('style', style_string)

class BoxSelectionOverlay extends HasParent
  type : 'BoxSelectionOverlay'
  default_view : BoxSelectionOverlayView
BoxSelectionOverlay::defaults = _.clone(BoxSelectionOverlay::defaults)
_.extend(BoxSelectionOverlay::defaults
  ,
    tool : null
    level : 'overlay'
)

class BoxSelectionOverlays extends Backbone.Collection
  model : BoxSelectionOverlay

exports.boxselectionoverlays = new BoxSelectionOverlays
exports.BoxSelectionOverlayView = BoxSelectionOverlayView
exports.BoxSelectionOverlay = BoxSelectionOverlay
