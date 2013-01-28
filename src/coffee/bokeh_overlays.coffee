class Bokeh.BoxSelectionOverlayView extends Bokeh.PlotWidget
  bind_events : () ->

  initialize : (options) ->
    @selecting = false
    super(options)
    @toolview = @plot_view.tools[@mget('tool').id]

  boxselect : (xrange, yrange) ->
    @xrange = xrange
    @yrange = yrange
    @request_render()

  startselect : () ->
    @selecting = true
    @request_render()

  stopselect : () ->
    @selecting = false
    @request_render()

  bind_bokeh_events : (options) ->
    Continuum.safebind(this, @toolview, 'boxselect', @boxselect)
    Continuum.safebind(this, @toolview, 'startselect', @startselect)
    Continuum.safebind(this, @toolview, 'stopselect', @stopselect)

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
    xpos = @plot_view.viewstate.rxpos(Math.min(xrange[0], xrange[1]))
    if xrange
      width = Math.abs(xrange[1] - xrange[0])
    else
      width = @plot_view.viewstate.get('width')
    style_string += "; left:#{xpos}px; width:#{width}px; "
    ypos = @plot_view.viewstate.rypos(Math.max(yrange[0], yrange[1]))
    if yrange
      height = yrange[1] - yrange[0]
    else
      height = @plot_view.viewstate.get('height')
    @$el.addClass('shading')
    style_string += "top:#{ypos}px; height:#{height}px"
    @$el.attr('style', style_string)

class Bokeh.BoxSelectionOverlay extends Continuum.HasParent
  type : 'BoxSelectionOverlay'
  default_view : Bokeh.BoxSelectionOverlayView
_.extend(Bokeh.BoxSelectionOverlay::defaults
  ,
    tool : null
)

class Bokeh.BoxSelectionOverlays extends Continuum.Collection
  model : Bokeh.BoxSelectionOverlay

if not Continuum.Collections.BoxSelectionOverlay
  Continuum.Collections.BoxSelectionOverlay = new Bokeh.BoxSelectionOverlays
