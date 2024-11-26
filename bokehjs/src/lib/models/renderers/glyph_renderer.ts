import {DataRenderer, DataRendererView} from "./data_renderer"
import {LineView} from "../glyphs/line"
import {PatchView} from "../glyphs/patch"
import {HAreaStepView} from "../glyphs/harea_step"
import {HAreaView} from "../glyphs/harea"
import {VAreaStepView} from "../glyphs/varea_step"
import {VAreaView} from "../glyphs/varea"
import type {GlyphView} from "../glyphs/glyph"
import {Glyph} from "../glyphs/glyph"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import type {CDSViewView} from "../sources/cds_view"
import {CDSView} from "../sources/cds_view"
import type {Color} from "core/types"
import {Indices} from "core/types"
import type * as p from "core/properties"
import {filter} from "core/util/arrayable"
import {extend, clone} from "core/util/object"
import type {HitTestResult} from "core/hittest"
import type {Geometry} from "core/geometry"
import type {SelectionManager} from "core/selection_manager"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import type {Context2d} from "core/util/canvas"
import {is_equal} from "core/util/eq"
import type {BBox} from "core/util/bbox"
import {FactorRange} from "../ranges/factor_range"
import {Decoration} from "../graphics/decoration"
import type {Marking} from "../graphics/marking"
import type {OpaqueIndices, MultiIndices, ImageIndex} from "../selections/selection"

type Defaults = {
  fill: {fill_alpha?: number, fill_color?: Color}
  line: {line_alpha?: number, line_color?: Color}
}

const selection_defaults: Defaults = {
  fill: {},
  line: {},
}

const decimated_defaults: Defaults = {
  fill: {fill_alpha: 0.3, fill_color: "grey"},
  line: {line_alpha: 0.3, line_color: "grey"},
}

const nonselection_defaults: Defaults = {
  fill: {fill_alpha: 0.2},
  line: {},
}

const muted_defaults: Defaults = {
  fill: {fill_alpha: 0.2},
  line: {},
}

export class GlyphRendererView extends DataRendererView {
  declare model: GlyphRenderer

  cds_view: CDSViewView

  glyph: GlyphView
  selection_glyph: GlyphView
  nonselection_glyph: GlyphView
  hover_glyph?: GlyphView
  muted_glyph: GlyphView
  decimated_glyph: GlyphView

  get glyph_view(): GlyphView {
    return this.glyph
  }

  override *children(): IterViews {
    yield* super.children()
    yield this.cds_view
    yield this.glyph
    yield this.selection_glyph
    yield this.nonselection_glyph
    if (this.hover_glyph != null) {
      yield this.hover_glyph
    }
    yield this.muted_glyph
    yield this.decimated_glyph
  }

  protected all_indices: Indices
  protected decimated: Indices

  protected last_dtrender: number

  get data_source(): p.Property<ColumnarDataSource> {
    return this.model.properties.data_source
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    this.cds_view = await build_view(this.model.view, {parent: this})

    const base_glyph = this.model.glyph
    this.glyph = await this.build_glyph_view(base_glyph)

    const has_fill = "fill" in this.glyph.visuals
    const has_line = "line" in this.glyph.visuals

    const glyph_attrs = {...base_glyph.attributes}
    delete glyph_attrs.id

    function mk_glyph(defaults: Defaults): typeof base_glyph {
      const attrs = clone(glyph_attrs)
      if (has_fill) {
        extend(attrs, defaults.fill)
      }
      if (has_line) {
        extend(attrs, defaults.line)
      }
      return new (base_glyph.constructor as any)(attrs)
    }

    function glyph_from_mode(defaults: Defaults, glyph?: Glyph | "auto" | null): typeof base_glyph {
      if (glyph instanceof Glyph) {
        return glyph
      } else if (glyph == "auto") {
        return mk_glyph(defaults)
      }
      return mk_glyph({fill: {}, line: {}})
    }

    let {selection_glyph, nonselection_glyph, hover_glyph, muted_glyph} = this.model

    selection_glyph = glyph_from_mode(selection_defaults, selection_glyph)
    this.selection_glyph = await this.build_glyph_view(selection_glyph)

    nonselection_glyph = glyph_from_mode(nonselection_defaults, nonselection_glyph)
    this.nonselection_glyph = await this.build_glyph_view(nonselection_glyph)

    if (hover_glyph != null) {
      this.hover_glyph = await this.build_glyph_view(hover_glyph)
    }

    muted_glyph = glyph_from_mode(muted_defaults, muted_glyph)
    this.muted_glyph = await this.build_glyph_view(muted_glyph)

    const decimated_glyph = glyph_from_mode(decimated_defaults, "auto")
    this.decimated_glyph = await this.build_glyph_view(decimated_glyph)

    this.selection_glyph.set_base(this.glyph)
    this.nonselection_glyph.set_base(this.glyph)
    this.hover_glyph?.set_base(this.glyph)
    this.muted_glyph.set_base(this.glyph)
    this.decimated_glyph.set_base(this.glyph)

    await this.set_data()
  }

  async build_glyph_view<T extends Glyph>(glyph: T): Promise<GlyphView> {
    return build_view(glyph, {parent: this}) as Promise<GlyphView>
  }

  override remove(): void {
    this.cds_view.remove()
    this.glyph.remove()
    this.selection_glyph.remove()
    this.nonselection_glyph.remove()
    this.hover_glyph?.remove()
    this.muted_glyph.remove()
    this.decimated_glyph.remove()
    super.remove()
  }

  private _previous_inspected?: {
    indices: OpaqueIndices
    line_indices: OpaqueIndices
    multiline_indices: MultiIndices
    image_indices: ImageIndex[]
    selected_glyphs: Glyph[]
  }

  override connect_signals(): void {
    super.connect_signals()

    const render = () => this.request_paint()
    const update = () => this.update_data()

    this.connect(this.model.change, render)

    this.connect(this.glyph.model.change, update)
    this.connect(this.selection_glyph.model.change, update)
    this.connect(this.nonselection_glyph.model.change, update)
    if (this.hover_glyph != null) {
      this.connect(this.hover_glyph.model.change, update)
    }
    this.connect(this.muted_glyph.model.change, update)
    this.connect(this.decimated_glyph.model.change, update)

    this.connect(this.model.data_source.change, update)
    this.connect(this.model.data_source.streaming, update)
    this.connect(this.model.data_source.patching, (indices) => this.update_data(indices))
    this.connect(this.model.data_source.selected.change, render)
    this.connect(this.model.data_source._select, render)
    if (this.hover_glyph != null) {
      this.connect(this.model.data_source.inspect, () => {
        // XXX: hoping for the best, assuming no in-place mutation
        const {inspected} = this.model.data_source
        const current_inspected = {
          indices: inspected.indices,
          line_indices: inspected.line_indices,
          multiline_indices: inspected.multiline_indices,
          image_indices: inspected.image_indices,
          selected_glyphs: inspected.selected_glyphs,
        }
        if (!is_equal(this._previous_inspected, current_inspected)) {
          this._previous_inspected = current_inspected
          render()
        }
      })
    }
    this.connect(this.model.properties.view.change, async () => {
      this.cds_view.remove()
      this.cds_view = await build_view(this.model.view, {parent: this})
      await update()
    })
    this.connect(this.model.view.properties.indices.change, update)
    this.connect(this.model.view.properties.masked.change, async () => await this.set_visuals())
    this.connect(this.model.properties.visible.change, () => this.plot_view.invalidate_dataranges = true)

    const {x_ranges, y_ranges} = this.plot_view.frame

    for (const [, range] of x_ranges) {
      if (range instanceof FactorRange) {
        this.connect(range.invalidate_synthetic, update)
      }
    }

    for (const [, range] of y_ranges) {
      if (range instanceof FactorRange) {
        this.connect(range.invalidate_synthetic, update)
      }
    }

    const {transformchange, exprchange} = this.model.glyph
    this.connect(transformchange, update)
    this.connect(exprchange, update)
  }

  _update_masked_indices(): Indices {
    const masked = this.glyph.mask_data()
    this.model.view.masked = masked
    return masked
  }

  async update_data(indices?: number[]): Promise<void> {
    await this.set_data(indices)
    this.request_paint()
  }

  // in case of partial updates like patching, the list of indices that actually
  // changed may be passed as the "indices" parameter to afford any optional optimizations
  async set_data(indices?: number[]): Promise<void> {
    const source = this.model.data_source

    this.all_indices = this.model.view.indices
    const {all_indices} = this

    await this.glyph.set_data(source, all_indices, indices)
    await this.decimated_glyph.set_data(source, all_indices, indices)
    await this.selection_glyph.set_data(source, all_indices, indices)
    await this.nonselection_glyph.set_data(source, all_indices, indices)
    await this.hover_glyph?.set_data(source, all_indices, indices)
    await this.muted_glyph.set_data(source, all_indices, indices)

    await this.set_visuals()

    this._update_masked_indices()

    const {lod_factor} = this.plot_model
    const n = this.all_indices.count
    this.decimated = new Indices(n)
    for (let i = 0; i < n; i += lod_factor) {
      this.decimated.set(i)
    }

    this.plot_view.invalidate_dataranges = true
  }

  async set_visuals(): Promise<void> {
    const source = this.model.data_source
    const {all_indices} = this

    this.glyph.set_visuals(source, all_indices)
    this.glyph.after_visuals()
    await this.glyph.after_lazy_visuals()

    this.decimated_glyph.set_visuals(source, all_indices)
    this.decimated_glyph.after_visuals()
    await this.decimated_glyph.after_lazy_visuals()

    this.selection_glyph.set_visuals(source, all_indices)
    this.selection_glyph.after_visuals()
    await this.selection_glyph.after_lazy_visuals()

    this.nonselection_glyph.set_visuals(source, all_indices)
    this.nonselection_glyph.after_visuals()
    await this.nonselection_glyph.after_lazy_visuals()

    this.hover_glyph?.set_visuals(source, all_indices)
    this.hover_glyph?.after_visuals()
    await this.hover_glyph?.after_lazy_visuals()

    this.muted_glyph.set_visuals(source, all_indices)
    this.muted_glyph.after_visuals()
    await this.muted_glyph.after_lazy_visuals()
  }

  map_data(): void {
    this.glyph.map_data()
    this.decimated_glyph.map_data()
    this.selection_glyph.map_data()
    this.nonselection_glyph.map_data()
    this.hover_glyph?.map_data()
    this.muted_glyph.map_data()
  }

  override get bbox(): BBox {
    return this.glyph.bbox!
  }

  override get has_webgl(): boolean {
    return this.glyph.has_webgl()
  }

  protected _paint(ctx: Context2d): void {
    const {has_webgl} = this

    this.map_data()

    // all_indices is in full data space, indices is converted to subset space by mask_data (that may use the spatial index)
    const all_indices = [...this.all_indices]
    let indices = [...this._update_masked_indices()]

    // selected is in full set space
    const {selected} = this.model.data_source
    const selected_full_indices = (() => {
      if (selected.is_empty()) {
        return []
      } else {
        if (this.glyph instanceof LineView && selected.selected_glyph === this.glyph.model) {
          return this.model.view.convert_indices_from_subset(indices)
        } else {
          return selected.indices
        }
      }
    })()

    // inspected is in full set space
    const {inspected} = this.model.data_source

    this._previous_inspected = {
      indices: inspected.indices,
      line_indices: inspected.line_indices,
      multiline_indices: inspected.multiline_indices,
      image_indices: inspected.image_indices,
      selected_glyphs: inspected.selected_glyphs,
    }

    const inspected_full_indices = new Set((() => {
      if (inspected.is_empty()) {
        return []
      } else {
        if (inspected.selected_glyph != null) {
          return this.model.view.convert_indices_from_subset(indices)
        } else if (inspected.indices.length > 0) {
          return inspected.indices
        } else {
          // TODO: return inspected.multiline_indices.keys()
          return Object.keys(inspected.multiline_indices).map((i) => parseInt(i))
        }
      }
    })())

    // inspected is transformed to subset space
    const inspected_subset_indices = filter(indices, (i) => inspected_full_indices.has(all_indices[i]))

    const {lod_threshold} = this.plot_model
    let glyph: GlyphView
    let nonselection_glyph: GlyphView
    let selection_glyph: GlyphView
    if ((this.model.document != null ? this.model.document.interactive_duration() > 0 : false)
        && !has_webgl && lod_threshold != null && all_indices.length > lod_threshold) {
      // Render decimated during interaction if too many elements and not using GL
      indices = [...this.decimated]
      glyph = this.decimated_glyph
      nonselection_glyph = this.decimated_glyph
      selection_glyph = this.selection_glyph
    } else {
      glyph = this.model.muted ? this.muted_glyph : this.glyph
      nonselection_glyph = this.nonselection_glyph
      selection_glyph = this.selection_glyph
    }

    if (this.hover_glyph != null && inspected_subset_indices.length != 0) {
      // TODO: keep working on Indices instead of converting back and forth
      const set = new Set(indices)
      for (const i of inspected_subset_indices) {
        set.delete(i)
      }
      indices = [...set]
    }

    ctx.save()

    // Render with no selection
    if (selected_full_indices.length == 0) {
      if (this.glyph instanceof LineView) {
        if (this.hover_glyph != null && inspected_subset_indices.length != 0) {
          this.hover_glyph.paint(ctx, this.model.view.convert_indices_from_subset(inspected_subset_indices))
        } else {
          glyph.paint(ctx, all_indices)
        }
      } else if (this.glyph instanceof PatchView ||
                 this.glyph instanceof HAreaView ||
                 this.glyph instanceof VAreaView ||
                 this.glyph instanceof VAreaStepView ||
                 this.glyph instanceof HAreaStepView) {
        if (inspected.selected_glyphs.length == 0 || this.hover_glyph == null) {
          glyph.paint(ctx, all_indices)
        } else {
          for (const sglyph of inspected.selected_glyphs) {
            if (sglyph == this.glyph.model) {
              this.hover_glyph.paint(ctx, all_indices)
            }
          }
        }
      } else {
        glyph.paint(ctx, indices)
        if (this.hover_glyph != null && inspected_subset_indices.length != 0) {
          this.hover_glyph.paint(ctx, inspected_subset_indices)
        }
      }
    // Render with selection
    } else {
      // reset the selection mask
      const selected_mask = new Set(selected_full_indices)

      // intersect/different selection with render mask
      const selected_subset_indices: number[] = new Array()
      const nonselected_subset_indices: number[] = new Array()

      // now, selected is changed to subset space, except for Line glyph
      if (this.glyph instanceof LineView) {
        for (const i of all_indices) {
          if (selected_mask.has(i)) {
            selected_subset_indices.push(i)
          } else {
            nonselected_subset_indices.push(i)
          }
        }
      } else {
        for (const i of indices) {
          if (selected_mask.has(all_indices[i])) {
            selected_subset_indices.push(i)
          } else {
            nonselected_subset_indices.push(i)
          }
        }
      }

      nonselection_glyph.paint(ctx, nonselected_subset_indices)
      selection_glyph.paint(ctx, selected_subset_indices)
      if (this.hover_glyph != null) {
        if (this.glyph instanceof LineView) {
          this.hover_glyph.paint(ctx, this.model.view.convert_indices_from_subset(inspected_subset_indices))
        } else {
          this.hover_glyph.paint(ctx, inspected_subset_indices)
        }
      }
    }

    ctx.restore()
  }

  get_reference_point(field: string | null, value?: unknown): number {
    if (field != null) {
      const array = this.model.data_source.get_column(field)
      if (array != null) {
        for (const [key, index] of this.model.view.indices_map) {
          if (array[key] == value) {
            return index
          }
        }
      }
    }
    return 0
  }

  draw_legend(ctx: Context2d, x0: number, x1: number, y0: number, y1: number, field: string | null, label: unknown, index: number | null): void {
    if (this.glyph.data_size == 0) {
      return
    }
    const subset_index = (() => {
      if (index == null) {
        return this.get_reference_point(field, label)
      } else {
        const {indices_map} = this.model.view
        return indices_map.get(index)
      }
    })()
    if (subset_index != null) {
      this.glyph.draw_legend_for_index(ctx, {x0, x1, y0, y1}, subset_index)
    }
  }

  hit_test(geometry: Geometry): HitTestResult {
    if (!this.model.visible) {
      return null
    }

    const hit_test_result = this.glyph.hit_test(geometry)

    // glyphs that don't have hit-testing implemented will return null
    if (hit_test_result == null) {
      return null
    }

    return this.model.view.convert_selection_from_subset(hit_test_result)
  }
}

export namespace GlyphRenderer {
  export type Attrs<
    BaseGlyph,
    HoverGlyph = BaseGlyph,
    NonSelectionGlyph = BaseGlyph,
    SelectionGlyph = BaseGlyph,
    MutedGlyph = BaseGlyph,
  > = p.AttrsOf<Props<BaseGlyph, HoverGlyph, NonSelectionGlyph, SelectionGlyph, MutedGlyph>>

  export type Props<
    BaseGlyph,
    HoverGlyph = BaseGlyph,
    NonSelectionGlyph = BaseGlyph,
    SelectionGlyph = BaseGlyph,
    MutedGlyph = BaseGlyph,
  > = DataRenderer.Props & {
    data_source: p.Property<ColumnarDataSource>
    view: p.Property<CDSView>
    glyph: p.Property<BaseGlyph>
    hover_glyph: p.Property<HoverGlyph | null>
    nonselection_glyph: p.Property<NonSelectionGlyph | "auto" | null>
    selection_glyph: p.Property<SelectionGlyph | "auto" | null>
    muted_glyph: p.Property<MutedGlyph | "auto" | null>
    muted: p.Property<boolean>
  }
}

export interface GlyphRenderer<
  BaseGlyph extends Glyph = Glyph,
  HoverGlyph extends Glyph = BaseGlyph,
  NonSelectionGlyph extends Glyph = BaseGlyph,
  SelectionGlyph extends Glyph = BaseGlyph,
  MutedGlyph extends Glyph = BaseGlyph,
> extends GlyphRenderer.Attrs<BaseGlyph, HoverGlyph, NonSelectionGlyph, SelectionGlyph, MutedGlyph> {}

export class GlyphRenderer<
  BaseGlyph extends Glyph = Glyph,
  HoverGlyph extends Glyph = BaseGlyph,
  NonSelectionGlyph extends Glyph = BaseGlyph,
  SelectionGlyph extends Glyph = BaseGlyph,
  MutedGlyph extends Glyph = BaseGlyph,
> extends DataRenderer {
  declare properties: GlyphRenderer.Props<BaseGlyph, HoverGlyph, NonSelectionGlyph, SelectionGlyph, MutedGlyph>
  declare __view_type__: GlyphRendererView

  constructor(attrs?: Partial<GlyphRenderer.Attrs<BaseGlyph, HoverGlyph, NonSelectionGlyph, SelectionGlyph, MutedGlyph>>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GlyphRendererView

    this.define<GlyphRenderer.Props<Glyph>>(({Bool, Auto, Or, Ref, Null, Nullable}) => ({
      data_source:        [ Ref(ColumnarDataSource) ],
      view:               [ Ref(CDSView), () => new CDSView() ],
      glyph:              [ Ref(Glyph) ],
      hover_glyph:        [ Nullable(Ref(Glyph)), null ],
      nonselection_glyph: [ Or(Ref(Glyph), Auto, Null), "auto" ],
      selection_glyph:    [ Or(Ref(Glyph), Auto, Null), "auto" ],
      muted_glyph:        [ Or(Ref(Glyph), Auto, Null), "auto" ],
      muted:              [ Bool, false ],
    }))
  }

  get_selection_manager(): SelectionManager {
    return this.data_source.selection_manager
  }

  add_decoration(marking: Marking, node: "start" | "middle" | "end"): Decoration {
    const decoration = new Decoration({marking, node})

    const glyphs = [
      this.glyph,
      this.selection_glyph,
      this.nonselection_glyph,
      this.hover_glyph,
      this.muted_glyph,
    ]

    for (const glyph of glyphs) {
      if (glyph instanceof Glyph) {
        glyph.decorations = [...glyph.decorations, decoration]
      }
    }

    return decoration
  }
}
