import {SidePanel} from "core/layout/side_panel"
import * as p from "core/properties"

import {Renderer, RendererView} from "../renderers/renderer"

export class AnnotationView extends RendererView

  _get_size: () ->
    return new Error("not implemented")

  get_size: () ->
    return if this.model.visible then Math.round(this._get_size()) else 0

export class Annotation extends Renderer
  type: 'Annotation'
  default_view: AnnotationView

  @define {
    plot:  [ p.Instance ]
  }

  @override {
    level: 'annotation'
  }

  add_panel: (side) ->
    if not @panel? or side != @panel.side
      panel = new SidePanel({side: side})
      panel.attach_document(@document)
      @set_panel(panel)

  set_panel: (panel) ->
    @panel = panel
    # If the annotation is in a side panel, we need to set level to overlay, so it is visible.
    @level = 'overlay'
