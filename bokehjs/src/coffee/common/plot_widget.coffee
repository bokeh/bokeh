define [
  "./continuum_view",
], (ContinuumView) ->

  class PlotWidget extends ContinuumView
    # Everything that lives inside a plot container should
    # inherit from this class.  All plot widgets are
    # passed in the plot model and view
    # we also include the request_render function, which
    # calls a throttled version of the plot canvas rendering function

    tagName: 'div'

    initialize: (options) ->
      @plot_model = options.plot_model
      @plot_view = options.plot_view

    bind_bokeh_events: () ->

    request_render: () ->
      @plot_view.request_render()
