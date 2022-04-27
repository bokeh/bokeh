import {DataRenderer, DataRendererView} from "./data_renderer"
import {LineView} from "../glyphs/line"
import {PatchView} from "../glyphs/patch"
import {HAreaView} from "../glyphs/harea"
import {VAreaView} from "../glyphs/varea"
import {Glyph, GlyphView} from "../glyphs/glyph"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {CDSView, CDSViewView} from "../sources/cds_view"
import {Color, Indices} from "core/types"
import * as p from "core/properties"
import {filter} from "core/util/arrayable"
import {extend, clone, entries} from "core/util/object"
import {HitTestResult} from "core/hittest"
import {Geometry} from "core/geometry"
import {SelectionManager} from "core/selection_manager"
import {build_view} from "core/build_views"
import {Context2d} from "core/util/canvas"
import {is_equal} from "core/util/eq"
import {FactorRange} from "../ranges/factor_range"
import {Decoration} from "../graphics/decoration"
import {Marking} from "../graphics/marking"
import {OpaqueIndices, MultiIndices, ImageIndex} from "../selections/selection"

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
  override model: GlyphRenderer

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
      if (has_fill) extend(attrs, defaults.fill)
      if (has_line) extend(attrs, defaults.line)
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

    if (hover_glyph != null)
      this.hover_glyph = await this.build_glyph_view(hover_glyph)

    muted_glyph = glyph_from_mode(muted_defaults, muted_glyph)
    this.muted_glyph = await this.build_glyph_view(muted_glyph)

    const decimated_glyph = glyph_from_mode(decimated_defaults, "auto")
    this.decimated_glyph = await this.build_glyph_view(decimated_glyph)

    this.selection_glyph.set_base(this.glyph)
    this.nonselection_glyph.set_base(this.glyph)
    this.hover_glyph?.set_base(this.glyph)
    this.muted_glyph.set_base(this.glyph)
    this.decimated_glyph.set_base(this.glyph)

    this.set_data()
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

    const render = () => this.request_render()
    const update = () => this.update_data()

    this.connect(this.model.change, render)

    this.connect(this.glyph.model.change, update)
    this.connect(this.selection_glyph.model.change, update)
    this.connect(this.nonselection_glyph.model.change, update)
    if (this.hover_glyph != null)
      this.connect(this.hover_glyph.model.change, update)
    this.connect(this.muted_glyph.model.change, update)
    this.connect(this.decimated_glyph.model.change, update)

    this.connect(this.model.data_source.change, update)
    this.connect(this.model.data_source.streaming, update)
    this.connect(this.model.data_source.patching, (indices) => this.update_data(indices))
    this.connect(this.model.data_source.selected.change, render)
    this.connect(this.model.data_source._select, render)
    if (this.hover_glyph != null)
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
    this.connect(this.model.properties.view.change, async () => {
      this.cds_view.remove()
      this.cds_view = await build_view(this.model.view, {parent: this})
      update()
    })
    this.connect(this.model.view.properties.indices.change, update)
    this.connect(this.model.view.properties.masked.change, () => this.set_visuals())
    this.connect(this.model.properties.visible.change, () => this.parent.range_manager.invalidate())

    const {x_ranges, y_ranges} = this.parent

    for (const [, range] of x_ranges) {
      if (range instanceof FactorRange)
        this.connect(range.change, update)
    }

    for (const [, range] of y_ranges) {
      if (range instanceof FactorRange)
        this.connect(range.change, update)
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

  update_data(indices?: number[]): void {
    this.set_data(indices)
    this.request_render()
  }

  // in case of partial updates like patching, the list of indices that actually
  // changed may be passed as the "indices" parameter to afford any optional optimizations
  set_data(indices?: number[]): void {
    const source = this.model.data_source

    this.all_indices = this.model.view.indices
    const {all_indices} = this

    this.glyph.set_data(source, all_indices, indices)
    this.set_visuals()

    this._update_masked_indices()

    const {lod_factor} = this.plot_view.model
    const n = this.all_indices.count
    this.decimated = new Indices(n)
    for (let i = 0; i < n; i += lod_factor) {
      this.decimated.set(i)
    }

    this.parent.range_manager.invalidate()
  }

  set_visuals(): void {
    const source = this.model.data_source
    const {all_indices} = this

    this.glyph.set_visuals(source, all_indices)
    this.decimated_glyph.set_visuals(source, all_indices)
    this.selection_glyph.set_visuals(source, all_indices)
    this.nonselection_glyph.set_visuals(source, all_indices)
    this.hover_glyph?.set_visuals(source, all_indices)
    this.muted_glyph.set_visuals(source, all_indices)
  }

  override get has_webgl(): boolean {
    return this.glyph.has_webgl
  }

  protected _render(): void {
    const glsupport = this.has_webgl

    this.glyph.map_data()

    // all_indices is in full data space, indices is converted to subset space by mask_data (that may use the spatial index)
    const all_indices = [...this.all_indices]
    let indices = [...this._update_masked_indices()]

    const {ctx} = this.layer
    ctx.save()

    // selected is in full set space
    const {selected} = this.model.data_source
    let selected_full_indices: number[]
    if (selected.is_empty())
      selected_full_indices = []
    else {
      if (this.glyph instanceof LineView && selected.selected_glyph === this.glyph.model)
        selected_full_indices = this.model.view.convert_indices_from_subset(indices)
      else
        selected_full_indices = selected.indices
    }

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
      if (inspected.is_empty())
        return []
      else {
        if (inspected.selected_glyph)
          return this.model.view.convert_indices_from_subset(indices)
        else if (inspected.indices.length > 0)
          return inspected.indices
        else {
          // TODO: return inspected.multiline_indices.keys()
          return Object.keys(inspected.multiline_indices).map((i) => parseInt(i))
        }
      }
    })())

    // inspected is transformed to subset space
    const inspected_subset_indices = filter(indices, (i) => inspected_full_indices.has(all_indices[i]))

    const {lod_threshold} = this.plot_view.model
    let glyph: GlyphView
    let nonselection_glyph: GlyphView
    let selection_glyph: GlyphView
    if ((this.model.document != null ? this.model.document.interactive_duration() > 0 : false)
        && !glsupport && lod_threshold != null && all_indices.length > lod_threshold) {
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

    if (this.hover_glyph != null && inspected_subset_indices.length) {
      // TODO: keep working on Indices instead of converting back and forth
      const set = new Set(indices)
      for (const i of inspected_subset_indices) {
        set.delete(i)
      }
      indices = [...set]
    }

    // Render with no selection
    if (!selected_full_indices.length) {
      if (this.glyph instanceof LineView) {
        if (this.hover_glyph != null && inspected_subset_indices.length)
          this.hover_glyph.render(ctx, this.model.view.convert_indices_from_subset(inspected_subset_indices))
        else
          glyph.render(ctx, all_indices)
      } else if (this.glyph instanceof PatchView || this.glyph instanceof HAreaView || this.glyph instanceof VAreaView) {
        if (inspected.selected_glyphs.length == 0 || this.hover_glyph == null) {
          glyph.render(ctx, all_indices)
        } else {
          for (const sglyph of inspected.selected_glyphs) {
            if (sglyph == this.glyph.model)
              this.hover_glyph.render(ctx, all_indices)
          }
        }
      } else {
        glyph.render(ctx, indices)
        if (this.hover_glyph != null && inspected_subset_indices.length)
          this.hover_glyph.render(ctx, inspected_subset_indices)
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
          if (selected_mask.has(i))
            selected_subset_indices.push(i)
          else
            nonselected_subset_indices.push(i)
        }
      } else {
        for (const i of indices) {
          if (selected_mask.has(all_indices[i]))
            selected_subset_indices.push(i)
          else
            nonselected_subset_indices.push(i)
        }
      }

      nonselection_glyph.render(ctx, nonselected_subset_indices)
      selection_glyph.render(ctx, selected_subset_indices)
      if (this.hover_glyph != null) {
        if (this.glyph instanceof LineView)
          this.hover_glyph.render(ctx, this.model.view.convert_indices_from_subset(inspected_subset_indices))
        else
          this.hover_glyph.render(ctx, inspected_subset_indices)
      }
    }

    ctx.restore()
  }

  get_reference_point(field: string | null, value?: any): number {
    if (field != null) {
      const array = this.model.data_source.get_column(field)
      if (array != null) {
        for (const [key, index] of entries(this.model.view.indices_map)) {
          if (array[parseInt(key)] == value)
            return index
        }
      }
    }
    return 0
  }

  draw_legend(ctx: Context2d, x0: number, x1: number, y0: number, y1: number, field: string | null, label: string, index: number | null): void {
    if (this.glyph.data_size == 0)
      return
    if (index == null)
      index = this.get_reference_point(field, label)
    this.glyph.draw_legend_for_index(ctx, {x0, x1, y0, y1}, index)
  }

  hit_test(geometry: Geometry): HitTestResult {
    if (!this.model.visible)
      return null

    const hit_test_result = this.glyph.hit_test(geometry)

    // glyphs that don't have hit-testing implemented will return null
    if (hit_test_result == null)
      return null

    return this.model.view.convert_selection_from_subset(hit_test_result)
  }
}

export namespace GlyphRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataRenderer.Props & {
    data_source: p.Property<ColumnarDataSource>
    view: p.Property<CDSView>
    glyph: p.Property<Glyph>
    hover_glyph: p.Property<Glyph | null>
    nonselection_glyph: p.Property<Glyph | "auto" | null>
    selection_glyph: p.Property<Glyph | "auto" | null>
    muted_glyph: p.Property<Glyph | "auto" | null>
    muted: p.Property<boolean>
  }
}

export interface GlyphRenderer extends GlyphRenderer.Attrs {}

export class GlyphRenderer extends DataRenderer {
  override properties: GlyphRenderer.Props
  override __view_type__: GlyphRendererView

  constructor(attrs?: Partial<GlyphRenderer.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GlyphRendererView

    this.define<GlyphRenderer.Props>(({Boolean, Auto, Or, Ref, Null, Nullable}) => ({
      data_source:        [ Ref(ColumnarDataSource) ],
      view:               [ Ref(CDSView), () => new CDSView() ],
      glyph:              [ Ref(Glyph) ],
      hover_glyph:        [ Nullable(Ref(Glyph)), null ],
      nonselection_glyph: [ Or(Ref(Glyph), Auto, Null), "auto" ],
      selection_glyph:    [ Or(Ref(Glyph), Auto, Null), "auto" ],
      muted_glyph:        [ Or(Ref(Glyph), Auto, Null), "auto" ],
      muted:              [ Boolean, false ],
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
      if (glyph instanceof Glyph)
        glyph.decorations = [...glyph.decorations, decoration]
    }

    return decoration
  }
}
