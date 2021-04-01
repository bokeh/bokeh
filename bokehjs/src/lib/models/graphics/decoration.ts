import {Marking, MarkingView} from "./marking"
import {RendererView} from "../renderers/renderer"
import {Model} from "../../model"
import {View} from "core/view"
import {build_view} from "core/build_views"
import * as visuals from "core/visuals"
import * as p from "core/properties"

export class DecorationView extends View {
  override model: Decoration
  visuals: Decoration.Visuals
  override parent: RendererView

  marking: MarkingView

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this.marking = await build_view(this.model.marking, {parent: this.parent})
  }
}

export namespace Decoration {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    marking: p.Property<Marking>
    node: p.Property<"start" | "middle" | "end">
  }

  export type Visuals = visuals.Visuals
}

export interface Decoration extends Decoration.Attrs {}

export class Decoration extends Model {
  override properties: Decoration.Props
  override __view_type__: DecorationView

  constructor(attrs?: Partial<Decoration.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DecorationView

    this.define<Decoration.Props>(({Enum, Ref}) => ({
      marking: [ Ref(Marking) ],
      node: [ Enum("start", "middle", "end") ],
    }))
  }
}
/*
      if (end != null) {
        ctx.save()
        ctx.translate(_sx_end[i], _sy_end[i])
        ctx.rotate(_angles[i])
        end.render(ctx, i)
        ctx.restore()
      }

      if (start != null) {
        ctx.save()
        ctx.translate(_sx_start[i], _sy_start[i])
        ctx.rotate(_angles[i] + Math.PI)
        start.render(ctx, i)
        ctx.restore()
      }
*/
