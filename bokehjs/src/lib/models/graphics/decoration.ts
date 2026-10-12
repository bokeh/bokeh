import type {MarkingView} from "./marking"
import {Marking} from "./marking"
import type {RendererView} from "../renderers/renderer"
import {Model} from "../../model"
import {View} from "core/view"
import {build_views, remove_views} from "core/build_views"
import type {ChildView, ViewStorage} from "core/build_views"
import type * as visuals from "core/visuals"
import * as p from "core/properties"
import type {Indices} from "core/types"
import type {ColumnarDataSource} from "../sources/columnar_data_source"

export class DecorationView extends View {
  declare model: Decoration
  visuals: Decoration.Visuals
  declare readonly parent: RendererView

  marking: MarkingView
  private readonly _marking_views: ViewStorage<Marking> = new Map()
  inset: p.Uniform<number>

  private _source?: ColumnarDataSource
  private _indices?: Indices

  override _children_views(): ChildView[] {
    return [...super._children_views(), ...this._marking_views.values()]
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._build_marking()
  }

  private async _build_marking(): Promise<void> {
    await build_views(this._marking_views, [this.model.marking], {parent: this.parent})
    if (this.is_destroyed) {
      return
    }
    const marking = this._marking_views.get(this.model.marking)
    if (marking != null) {
      this.marking = marking
      if (this._source != null && this._indices != null) {
        this.set_data(this._source, this._indices)
      }
    }
  }

  override remove(): void {
    remove_views(this._marking_views)
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.marking.change, async () => {
      await this._build_marking()
      if (!this.is_destroyed) {
        this.parent.request_paint()
      }
    })
    this.connect(this.model.change, () => {
      if (this._source != null && this._indices != null) {
        this.set_data(this._source, this._indices)
      }
      this.parent.request_paint()
    })
  }

  set_data(source: ColumnarDataSource, indices: Indices): void {
    this._source = source
    this._indices = indices
    this.inset = this.model.properties.inset.uniform(source).select(indices)
    this.marking.set_data(source, indices)
  }
}

export namespace Decoration {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    marking: p.Property<Marking>
    node: p.Property<"start" | "middle" | "end">
    inset: p.NumberSpec
  }

  export type Visuals = visuals.Visuals
}

export interface Decoration extends Decoration.Attrs {}

export class Decoration extends Model {
  declare properties: Decoration.Props
  declare __view_type__: DecorationView

  static {
    this.prototype.default_view = DecorationView

    this.define<Decoration.Props>(({Enum, Ref}) => ({
      marking: [ Ref(Marking) ],
      node: [ Enum("start", "middle", "end") ],
      inset: [ p.NumberSpec, 0 ],
    }))
  }
}
