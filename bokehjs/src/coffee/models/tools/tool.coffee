import * as p from "core/properties"
import {View} from "core/view"
import {min, max} from "core/util/array"
import {Model} from "../../model"

export class ToolView extends View

  initialize: (options) ->
    super(options)
    @plot_view = options.plot_view

  @getters {
    plot_model: () -> @plot_view.model
  }

  connect_signals: () ->
    super()
    @connect(@model.properties.active.change, () =>
      if @model.active
        @activate()
      else
        @deactivate()
    )

  # activate is triggered by toolbar ui actions
  activate: () ->

  # deactivate is triggered by toolbar ui actions
  deactivate: () ->

export class Tool extends Model

  @getters {
    synthetic_renderers: () -> []
  }

  @internal {
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
  _get_dim_limits: ([sx0, sy0], [sx1, sy1], frame, dims) ->
    hr = frame.h_range
    if dims == 'width' or dims == 'both'
      sxlim = [min([sx0, sx1]),         max([sx0, sx1])]
      sxlim = [max([sxlim[0], hr.min]), min([sxlim[1], hr.max])]
    else
      sxlim = [hr.min, hr.max]

    vr = frame.v_range
    if dims == 'height' or dims == 'both'
      sylim = [min([sy0, sy1]),         max([sy0, sy1])]
      sylim = [max([sylim[0], vr.min]), min([sylim[1], vr.max])]
    else
      sylim = [vr.min, vr.max]

    return [sxlim, sylim]
