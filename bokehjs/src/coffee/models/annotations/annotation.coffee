import {SidePanel} from "core/layout/side_panel"
import * as p from "core/properties"

import {Renderer, RendererView} from "../renderers/renderer"

export class AnnotationView extends RendererView

  _get_size: () ->
    return new Error("not implemented")

export class Annotation extends Renderer
  type: 'Annotation'
  default_view: AnnotationView

  @define {
      plot:  [ p.Instance                  ]
    }

  @override {
    level: 'annotation'
  }

  add_panel: (side) ->
    @panel = new SidePanel({side: side})
    @panel.attach_document(@document)
    # If the annotation is in a side panel, we need to set level to overlay, so it is visible.
    @level = 'overlay'
