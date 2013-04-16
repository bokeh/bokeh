base = require('../base')
safebind = base.safebind

ContinuumView = require("./continuum_view").ContinuumView

class PlotWidget extends ContinuumView
  # Everything that lives inside a plot container should
  # inherit from this class.  All plot widgets are
  # passed in the plot model and view
  # This class also contains some basic canvas rendering primitives
  # we also include the request_render function, which
  # calls a throttled version of the plot canvas rendering function

  tagName : 'div'

  initialize: (options) ->
    @plot_model = options.plot_model
    @plot_view = options.plot_view

    # work around canvas incompatibilities
    @_fixup_line_dash(@plot_view.ctx)
    @_fixup_line_dash_offset(@plot_view.ctx)
    @_fixup_image_smoothing(@plot_view.ctx)

    super(options)

  _fixup_line_dash: (ctx) ->
    if (!ctx.setLineDash)
      ctx.setLineDash = (dash) ->
        ctx.mozDash = dash
        ctx.webkitLineDash = dash
    if (!ctx.getLineDash)
      ctx.getLineDash = () ->
        return ctx.mozDash

  _fixup_line_dash_offset: (ctx) ->
    ctx.setLineDashOffset = (dash_offset) ->
      ctx.lineDashOffset = dash_offset
      ctx.mozDashOffset = dash_offset
      ctx.webkitLineDashOffset = dash_offset

  _fixup_image_smoothing: (ctx) ->
    ctx.setImageSmoothingEnabled = (value) ->
      ctx.imageSmoothingEnabled = value;
      ctx.mozImageSmoothingEnabled = value;
      ctx.oImageSmoothingEnabled = value;
      ctx.webkitImageSmoothingEnabled = value;
    ctx.getImageSmoothingEnabled = () ->
      return ctx.imageSmoothingEnabled ? true

  bind_bokeh_events: () ->
    #safebind(this, @plot_view.viewstate, 'change', ()-> @request_render())

  request_render: () ->
    @plot_view.throttled()


exports.PlotWidget = PlotWidget