import {SidePanel} from "core/layout/side_panel";
import {Side} from "core/enums"
import * as p from "core/properties";

import {Renderer, RendererView} from "../renderers/renderer"
import {Plot} from "../plots/plot"

export abstract class AnnotationView extends RendererView {
  model: Annotation

  protected _get_size(): number {
    throw new Error("not implemented")
  }

  get_size(): number {
    return this.model.visible ? Math.round(this._get_size()) : 0
  }
}

export namespace Annotation {
  export interface Attrs extends Renderer.Attrs {
    plot: Plot
  }

  export interface Opts extends Renderer.Opts {}
}

export interface Annotation extends Annotation.Attrs {
  panel?: SidePanel
}

export abstract class Annotation extends Renderer {

  constructor(attrs?: Partial<Annotation.Attrs>, opts?: Annotation.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'Annotation';

    this.define({
      plot:  [ p.Instance ],
    });

    this.override({
      level: 'annotation',
    });
  }

  add_panel(side: Side): void {
    if (this.panel == null || side !== this.panel.side) {
      const panel = new SidePanel({side});
      panel.attach_document(this.document!);
      this.set_panel(panel);
    }
  }

  set_panel(panel: SidePanel): void {
    this.panel = panel;
    // If the annotation is in a side panel, we need to set level to overlay, so it is visible.
    this.level = 'overlay';
  }
}
Annotation.initClass();
