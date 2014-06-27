

define [
  "./continuum_view",
  "./safebind"
], (ContinuumView, safebind) ->

  class PlotWidget extends ContinuumView.View
    # Everything that lives inside a plot container should
    # inherit from this class.  All plot widgets are
    # passed in the plot model and view
    # This class also contains some basic canvas rendering primitives
    # we also include the request_render function, which
    # calls a throttled version of the plot canvas rendering function

    tagName: 'div'

    initialize: (options) ->
      @plot_model = options.plot_model
      @plot_view = options.plot_view

    bind_bokeh_events: () ->
      #safebind(this, @plot_view.viewstate, 'change', ()-> @request_render())

    request_render: () ->
      @plot_view.request_render()
