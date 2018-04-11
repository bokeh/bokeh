import {SidePanel} from "core/layout/side_panel";
import {Side} from "core/enums"
import * as p from "core/properties";
import * as proj from "core/util/projections"
import {extend} from "core/util/object"

import {Renderer, RendererView} from "../renderers/renderer"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Plot} from "../plots/plot"

export abstract class AnnotationView extends RendererView {
  model: Annotation

  protected _get_size(): number {
    throw new Error("not implemented")
  }

  get_size(): number {
    return this.model.visible ? Math.round(this._get_size()) : 0
  }

  set_data(source: ColumnarDataSource): void {
    const data = this.model.materialize_dataspecs(source)
    extend(this as any, data)

    if (this.plot_model.use_map) {
      const self = this as any
      if (self._x != null)
        [self._x, self._y] = proj.project_xy(self._x, self._y)
      if (self._xs != null)
        [self._xs, self._ys] = proj.project_xsys(self._xs, self._ys)
    }
  }
}

export namespace Annotation {
  export interface Attrs extends Renderer.Attrs {
    plot: Plot
  }

  export interface Props extends Renderer.Props {
    plot: p.Property<Plot>
  }

  export type Visuals = Renderer.Visuals
}

export interface Annotation extends Annotation.Attrs {
  panel?: SidePanel
}

export abstract class Annotation extends Renderer {

  properties: Annotation.Props

  constructor(attrs?: Partial<Annotation.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
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
