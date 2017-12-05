import {DOMView} from "core/dom_view"
import {Visuals as CoreVisuals} from "core/visuals"
import {RenderLevel} from "core/enums"
import * as p from "core/properties"
import * as proj from "core/util/projections"
import {extend} from "core/util/object"
import {Model} from "../../model"

# This shouldn't be a DOMView, but annotations create a mess.
export class RendererView extends DOMView

  `
  plot_view: any // PlotCanvasView
  visuals: Renderer.Visuals
  `

  initialize: (options) ->
    super(options)
    @plot_view = options.plot_view
    @visuals = new Visuals(@model)
    @_has_finished = true # XXX: should be in render() but subclasses don't respect super()

  @getters {
    plot_model: () -> @plot_view.model
  }

  request_render: () ->
    @plot_view.request_render()

  set_data: (source) ->
    data = @model.materialize_dataspecs(source)
    extend(@, data)

    if @plot_model.use_map
      if @_x?
        [@_x, @_y] = proj.project_xy(@_x, @_y)
      if @_xs?
        [@_xs, @_ys] = proj.project_xsys(@_xs, @_ys)

  map_to_screen: (x, y) ->
    return @plot_view.map_to_screen(x, y, @model.x_range_name, @model.y_range_name)

export class Renderer extends Model
  type: "Renderer"

  `
  level: RenderLevel
  visible: boolean
  `

  @define {
    level: [ p.RenderLevel, null ]
    visible: [ p.Bool, true ]
  }

`
export module Renderer {
  export type Visuals = CoreVisuals
}
`
