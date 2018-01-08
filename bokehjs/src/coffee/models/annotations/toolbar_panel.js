import {Annotation, AnnotationView} from "./annotation"
import {build_views, remove_views} from "core/build_views"
import {empty, show, hide} from "core/dom"
import * as p from "core/properties"

export class ToolbarPanelView extends AnnotationView

  initialize: (options) ->
    super(options)
    @plot_view.canvas_events.appendChild(@el)
    @_toolbar_views = {}
    build_views(@_toolbar_views, [@model.toolbar], {parent: @})

  remove: () ->
    remove_views(@_toolbar_views)
    super()

  render: () ->
    super()

    if not @model.visible
      hide(@el)
      return

    panel = @model.panel

    @el.style.position = "absolute"
    @el.style.left = "#{panel._left.value}px"
    @el.style.top = "#{panel._top.value}px"
    @el.style.width = "#{panel._width.value}px"
    @el.style.height = "#{panel._height.value}px"

    @el.style.overflow = "hidden"

    toolbar = @_toolbar_views[@model.toolbar.id]
    toolbar.render()

    empty(@el)
    @el.appendChild(toolbar.el)
    show(@el)

  _get_size: () ->
    return 30

export class ToolbarPanel extends Annotation
  type: 'ToolbarPanel'
  default_view: ToolbarPanelView

  @define {
    toolbar: [ p.Instance ]
  }
