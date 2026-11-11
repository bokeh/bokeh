import type {MarkingView} from "./marking"
import {Marking} from "./marking"
import type {GlyphView} from "../glyphs/glyph"
import {Model} from "../../model"
import {View} from "core/view"
import {build_views, remove_views} from "core/build_views"
import type {ChildView, ViewStorage} from "core/build_views"
import type * as visuals from "core/visuals"
import {AngleReference} from "core/enums"
import * as p from "core/properties"
import type {Arrayable, Indices} from "core/types"
import {isArrayable} from "core/util/types"
import type {ColumnarDataSource} from "../sources/columnar_data_source"

export class PathMarkingView extends View {
  declare model: PathMarking | PathMarkings
  visuals: Decoration.Visuals
  declare readonly parent: GlyphView

  marking: MarkingView
  private readonly _marking_views: ViewStorage<Marking> = new Map()
  inset: p.Uniform<number>
  angle: p.Uniform<number>
  private positions?: p.Uniform<Arrayable<number>>

  resolve_angle(i: number, automatic: number, tangent: number): number {
    const offset = this.angle.get(i)
    switch (this.model.angle_reference) {
      case "auto": return automatic + offset
      case "left": return tangent - Math.PI/2 + offset
      case "right": return tangent + Math.PI/2 + offset
      case "screen": return offset
    }
  }

  /** The distance to trim from a named endpoint of the shaft.
   *
   * With the automatic orientation and zero rotation, trim by the marking's
   * rear extent plus its inset. For other orientations, keep the full shaft
   * because the marking's rear extent may point away from the shaft.
   */
  shaft_inset(i: number): number {
    return this.model.angle_reference == "auto" && this.angle.get(i) == 0
      ? Math.max(0, this.inset.get(i) + this.marking.line_extent(i))
      : 0
  }

  get node(): PathMarking["node"] | null {
    return this.model instanceof PathMarking ? this.model.node : null
  }

  placements(i: number): (PathMarking["node"] | number)[] {
    if (this.model instanceof PathMarking) {
      return [this.model.node]
    }
    const positions = this.positions!.get(i)
    if (!valid_positions(positions)) {
      throw new Error("Path marking positions must be lists of finite fractions between 0 and 1")
    }
    return Array.from(positions)
  }

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
    await build_views(this._marking_views, [this.model.marking], {parent: this})
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

  request_paint(): void {
    this.parent.request_paint()
  }

  get canvas() {
    return this.parent.canvas
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
    this.connect<void, PathMarking | PathMarkings>(this.model.change, () => {
      if (this._source != null && this._indices != null) {
        this.set_data(this._source, this._indices)
      }
      this.parent.request_paint()
    })
  }

  set_data(source: ColumnarDataSource, indices: Indices): void {
    this._source = source
    this._indices = indices
    this.inset = this.model instanceof PathMarking
      ? this.model.properties.inset.uniform(source).select(indices)
      : new p.UniformScalar(0, indices.count)
    if (this.model instanceof PathMarkings) {
      this.positions = this.model.properties.positions.uniform(source).select(indices)
    }
    this.angle = this.model.properties.angle.uniform(source).select(indices)
    this.marking.set_data(source, indices)
  }
}

export namespace Decoration {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
  export type Visuals = visuals.Visuals
}
export interface Decoration extends Decoration.Attrs {}
export abstract class Decoration extends Model {
  declare properties: Decoration.Props
}

export namespace PathMarking {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Decoration.Props & {
    angle: p.AngleSpec
    angle_reference: p.Property<AngleReference>
    marking: p.Property<Marking>
    node: p.Property<"start" | "middle" | "end">
    inset: p.NumberSpec
  }
}
export interface PathMarking extends PathMarking.Attrs {}
export class PathMarking extends Decoration {
  declare properties: PathMarking.Props
  declare __view_type__: PathMarkingView
  static {
    this.prototype.default_view = PathMarkingView
    this.define<PathMarking.Props>(({Enum, Ref}) => ({
      angle: [p.AngleSpec, 0],
      angle_reference: [AngleReference, "auto"],
      marking: [Ref(Marking)],
      node: [Enum("start", "middle", "end")],
      inset: [p.NumberSpec, 0],
    }))
  }
}

function valid_positions(value: unknown): value is Arrayable<number> {
  return isArrayable(value) && Array.from(value).every(fraction => typeof fraction == "number" && Number.isFinite(fraction) && fraction >= 0 && fraction <= 1)
}
class PositionsSpec extends p.DataSpec<Arrayable<number>> {
  override valid(value: unknown): boolean {
    return valid_positions(value)
  }
}
export namespace PathMarkings {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Decoration.Props & {
    angle: p.AngleSpec
    angle_reference: p.Property<AngleReference>
    marking: p.Property<Marking>
    positions: PositionsSpec
  }
}
export interface PathMarkings extends PathMarkings.Attrs {}
export class PathMarkings extends Decoration {
  declare properties: PathMarkings.Props
  declare __view_type__: PathMarkingView
  static {
    this.prototype.default_view = PathMarkingView
    this.define<PathMarkings.Props>(({Ref}) => ({
      angle: [p.AngleSpec, 0],
      angle_reference: [AngleReference, "auto"],
      marking: [Ref(Marking)],
      positions: [PositionsSpec, [0.5]],
    }))
  }
}
