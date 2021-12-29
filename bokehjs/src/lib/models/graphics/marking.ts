import {Model} from "../../model"
import {View} from "core/view"
import {Indices} from "core/types"
import {Context2d} from "core/util/canvas"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {RendererView} from "../renderers/renderer"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export abstract class MarkingView extends View implements visuals.Renderable {
  override model: Marking
  visuals: Marking.Visuals
  override readonly parent: RendererView

  size: p.Uniform<number>

  override initialize(): void {
    super.initialize()
    this.visuals = new visuals.Visuals(this)
  }

  request_render(): void {
    this.parent.request_render()
  }

  get canvas() {
    return this.parent.canvas
  }

  set_data(source: ColumnarDataSource, indices: Indices): void {
    const self = this as any
    for (const prop of this.model) {
      if (!(prop instanceof p.VectorSpec || prop instanceof p.ScalarSpec))
        continue
      const uniform = prop.uniform(source).select(indices)
      self[`${prop.attr}`] = uniform
    }
  }

  abstract render(ctx: Context2d, i: number): void
}

export namespace Marking {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {}

  export type Visuals = visuals.Visuals
}

export interface Marking extends Marking.Attrs {}

export abstract class Marking extends Model {
  override properties: Marking.Props
  override __view_type__: MarkingView

  constructor(attrs?: Partial<Marking.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Marking.Props>(({}) => ({
    }))
  }
}
