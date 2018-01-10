import {SidePanel} from "core/layout/side_panel";
import * as p from "core/properties";

import {Renderer, RendererView} from "../renderers/renderer"

export class AnnotationView extends RendererView {

  _get_size() {
    return new Error("not implemented");
  }

  get_size() {
    if (this.model.visible) { return Math.round(this._get_size()); } else { return 0; }
  }
}

export class Annotation extends Renderer {
  static initClass() {
    this.prototype.type = 'Annotation';
    this.prototype.default_view = AnnotationView;

    this.define({
      plot:  [ p.Instance ]
    });

    this.override({
      level: 'annotation'
    });
  }

  add_panel(side) {
    if ((this.panel == null) || (side !== this.panel.side)) {
      const panel = new SidePanel({side});
      panel.attach_document(this.document);
      return this.set_panel(panel);
    }
  }

  set_panel(panel) {
    this.panel = panel;
    // If the annotation is in a side panel, we need to set level to overlay, so it is visible.
    return this.level = 'overlay';
  }
}
Annotation.initClass();
