import {Model} from "../../model"
import {View} from "core/view"
import {type CanvasView} from "./canvas"
import {Renderer} from "../renderers/renderer"
import * as p from "core/properties"

export class LayerView extends View {
  override model: Layer
  override parent: CanvasView
}

export namespace Layer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    renderers: p.Property<Renderer[]>
    z_index: p.Property<"auto" | number>
  }
}

export interface Layer extends Layer.Attrs {}

export class Layer extends Model {
  override properties: Layer.Props
  override __view_type__: LayerView

  constructor(attrs?: Partial<Layer.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LayerView

    this.define<Layer.Props>(({Int, Auto, Array, Ref, Or}) => ({
      renderers: [ Array(Ref(Renderer)), [] ],
      z_index:   [ Or(Auto, Int), "auto" ],
    }))
  }
}
