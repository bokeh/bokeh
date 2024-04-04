import {Model} from "../../model"
import {DOMComponentView} from "core/dom_view"
import type {Indices} from "core/types"
import type {Context2d} from "core/util/canvas"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import type {RendererView} from "../renderers/renderer"
import type {ColumnarDataSource} from "../sources/columnar_data_source"

export abstract class MarkingView extends DOMComponentView implements visuals.Paintable {
  declare model: Marking
  visuals: Marking.Visuals
  declare readonly parent: RendererView

  size: p.Uniform<number>

  override initialize(): void {
    super.initialize()
    this.visuals = new visuals.Visuals(this)
  }

  request_paint(): void {
    this.parent.request_paint()
  }

  get canvas() {
    return this.parent.canvas
  }

  set_data(source: ColumnarDataSource, indices: Indices): void {
    const self = this as any
    for (const prop of this.model) {
      if (!(prop instanceof p.VectorSpec || prop instanceof p.ScalarSpec)) {
        continue
      }
      const uniform = prop.uniform(source).select(indices)
      self[`${prop.attr}`] = uniform
    }
    this.mark_finished()
  }

  abstract paint(ctx: Context2d, i: number): void
}

export namespace Marking {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {}

  export type Visuals = visuals.Visuals
}

export interface Marking extends Marking.Attrs {}

export abstract class Marking extends Model {
  declare properties: Marking.Props
  declare __view_type__: MarkingView

  constructor(attrs?: Partial<Marking.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Marking.Props>(({}) => ({
    }))
  }
}
