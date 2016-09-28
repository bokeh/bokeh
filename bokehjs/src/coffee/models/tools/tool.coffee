_ = require "underscore"

Renderer = require "../renderers/renderer"
{logger} = require "../../core/logging"
p = require "../../core/properties"
Model = require "../../model"

class ToolView extends Renderer.View

  bind_bokeh_events: () ->
    @listenTo(@model, 'change:active', () =>
      if @model.active
        @activate()
      else
        @deactivate()
    )

  # activate is triggered by toolbar ui actions
  activate: () ->

  # deactivate is triggered by toolbar ui actions
  deactivate: () ->

class Tool extends Model

  @getters {
    synthetic_renderers: () -> []
  }

  @define {
    plot: [ p.Instance ]
  }

  @internal {
    level: [ p.RenderLevel, 'overlay' ]
    active: [ p.Boolean, false ]
  }

  # utility function to return a tool name, modified
  # by the active dimenions. Used by tools that have dimensions
  _get_dim_tooltip: (name, dims) ->
    switch dims
      when 'width'  then "#{name} (x-axis)"
      when 'height' then "#{name} (y-axis)"
      when 'both'   then name

  # utility function to get limits along both dimensions, given
  # optional dimensional constraints
  _get_dim_limits: ([vx0, vy0], [vx1, vy1], frame, dims) ->
    hr = frame.h_range
    if dims == 'width' or dims == 'both'
      vxlim = [_.min([vx0, vx1]), _.max([vx0, vx1])]
      vxlim = [_.max([vxlim[0], hr.min]), _.min([vxlim[1], hr.max])]
    else
      vxlim = [hr.min, hr.max]

    vr = frame.v_range
    if dims == 'height' or dims == 'both'
      vylim = [_.min([vy0, vy1]), _.max([vy0, vy1])]
      vylim = [_.max([vylim[0], vr.min]), _.min([vylim[1], vr.max])]
    else
      vylim = [vr.min, vr.max]

    return [vxlim, vylim]

module.exports =
  Model: Tool
  View: ToolView
