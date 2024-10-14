import type {MarkingView} from "./marking"
import {Marking} from "./marking"
import type {RendererView} from "../renderers/renderer"
import {Model} from "../../model"
import {View} from "core/view"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"

export class DecorationView extends View {
  declare model: Decoration
  visuals: Decoration.Visuals
  declare readonly parent: RendererView

  marking: MarkingView

  override *children(): IterViews {
    yield* super.children()
    yield this.marking
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this.marking = await build_view(this.model.marking, {parent: this.parent})
    this.mark_finished()
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
  declare properties: Decoration.Props
  declare __view_type__: DecorationView

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
