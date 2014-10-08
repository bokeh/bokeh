
define [
  "common/plot_widget",
  "common/has_properties",
  "common/logging",
], (PlotWidget, HasProperties, Logging) ->

  logger = Logging.logger

  class ToolView extends PlotWidget

    bind_bokeh_events: () ->
      @listenTo(@model, 'change:active', () =>
        if @mget('active')
          @activate()
        else
          @deactivate()
      )

    # activate is triggered by toolbar ui actions
    activate: () ->

    # deactivate is triggered by toolbar ui actions
    deactivate: () ->

  class Tool extends HasProperties


    # TODO (bev) The following "dim" functions should probably
    # go in a helper util module, or something. Would be best
    # as a mixin but no MI built into CoffeeScript

    # this is a utility function that can be used by tools
    # to check their "dims" attribute, if they have one, and
    # return indicators for which ones are set
    _check_dims: (dims, tool_name) ->

      [wdim, hdim] = [false, false]

      if dims.length == 0
        logger.warn("#{tool_name} given empty dimensions")

      else if dims.length == 1
        if dims[0] != 'width' and dims[0] != 'height'
          logger.warn("#{tool_name} given unrecognized dimensions: #{dims}")

      else if dims.length == 2
        if dims.indexOf('width') < 0 or dims.indexOf('height') < 0
          logger.warn("#{tool_name} given unrecognized dimensions: #{dims}")

      else
        logger.warn("#{tool_name} given more than two dimensions: #{dims}")

      if dims.indexOf('width') >= 0
        wdim = true
      if dims.indexOf('height') >= 0
        hdim = true

      return [wdim, hdim]

    # utility function to return a tool name, modified
    # by the active dimenions. Used by tools that have dimensions
    _get_dim_tooltip: (name, [wdim, hdim]) ->
      if wdim and not hdim
        return "#{name} (x-axis)"
      else if hdim and not wdim
        return "#{name} (y-axis)"
      else
        return name

    # utility function to get limits along both dimensions, given
    # optional dimensional constraints
    _get_dim_limits: ([vx0, vy0], [vx1, vy1], frame, dims) ->
      hr = frame.get('h_range')
      if dims.indexOf('width') >= 0
        vxlim = [_.min([vx0, vx1]), _.max([vx0, vx1])]
        vxlim = [_.max([vxlim[0], hr.get('min')]), _.min([vxlim[1], hr.get('max')])]
      else
        vxlim = [hr.get('min'), hr.get('max')]

      vr = frame.get('v_range')
      if dims.indexOf('height') >= 0
        vylim = [_.min([vy0, vy1]), _.max([vy0, vy1])]
        vylim = [_.max([vylim[0], vr.get('min')]), _.min([vylim[1], vr.get('max')])]
      else
        vylim = [vr.get('min'), vr.get('max')]

      return [vxlim, vylim]

    defaults: () ->
      return _.extend({}, super(), {
        tool_name: @tool_name
        level: 'overlay'
      })

  return {
    "Model": Tool,
    "View": ToolView
  }
