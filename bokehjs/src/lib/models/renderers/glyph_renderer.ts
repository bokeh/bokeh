import {DataRenderer, DataRendererView} from "./data_renderer"
import {LineView} from "../glyphs/line"
import {PatchView} from "../glyphs/patch"
import {HAreaView} from "../glyphs/harea"
import {VAreaView} from "../glyphs/varea"
import {Glyph, GlyphView} from "../glyphs/glyph"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {CDSView} from "../sources/cds_view"
import {Color} from "core/types"
import {logger} from "core/logging"
import * as p from "core/properties"
import {indexOf, filter} from "core/util/arrayable"
import {difference, includes} from "core/util/array"
import {extend, clone} from "core/util/object"
import {HitTestResult} from "core/hittest"
import {Geometry} from "core/geometry"
import {SelectionManager} from "core/selection_manager"
import {build_view} from "core/build_views"
import {Context2d} from "core/util/canvas"
import {FactorRange} from "../ranges/factor_range"

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

export class GlyphRendererView extends DataRendererView {
  model: GlyphRenderer

  glyph: GlyphView
  selection_glyph: GlyphView
  nonselection_glyph: GlyphView
  hover_glyph?: GlyphView
  muted_glyph?: GlyphView
  decimated_glyph: GlyphView

  protected all_indices: number[]
  protected decimated: number[]

  set_data_timestamp: number

  async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const base_glyph = this.model.glyph
    const has_fill = includes(base_glyph._mixins, "fill")
    const has_line = includes(base_glyph._mixins, "line")
    const glyph_attrs = clone(base_glyph.attributes)
    delete glyph_attrs.id

    function mk_glyph(defaults: Defaults): typeof base_glyph {
      const attrs = clone(glyph_attrs)
      if (has_fill) extend(attrs, defaults.fill)
      if (has_line) extend(attrs, defaults.line)
      return new (base_glyph.constructor as any)(attrs)
    }

    this.glyph = await this.build_glyph_view(base_glyph)

    let {selection_glyph} = this.model
    if (selection_glyph == null)
      selection_glyph = mk_glyph({fill: {}, line: {}})
    else if (selection_glyph === "auto")
      selection_glyph = mk_glyph(selection_defaults)
    this.selection_glyph = await this.build_glyph_view(selection_glyph)

    let {nonselection_glyph} = this.model
    if ((nonselection_glyph == null))
      nonselection_glyph = mk_glyph({fill: {}, line: {}})
    else if (nonselection_glyph === "auto")
      nonselection_glyph = mk_glyph(nonselection_defaults)
    this.nonselection_glyph = await this.build_glyph_view(nonselection_glyph)

    const {hover_glyph} = this.model
    if (hover_glyph != null)
      this.hover_glyph = await this.build_glyph_view(hover_glyph)

    const {muted_glyph} = this.model
    if (muted_glyph != null)
      this.muted_glyph = await this.build_glyph_view(muted_glyph)

    const decimated_glyph = mk_glyph(decimated_defaults)
    this.decimated_glyph = await this.build_glyph_view(decimated_glyph)

    this.set_data(false)
  }

  async build_glyph_view<T extends Glyph>(glyph: T): Promise<GlyphView> {
    return build_view(glyph, {parent: this}) as Promise<GlyphView>
  }

  remove(): void {
    this.glyph.remove()
    this.selection_glyph.remove()
    this.nonselection_glyph.remove()
    this.hover_glyph?.remove()
    this.muted_glyph?.remove()
    this.decimated_glyph.remove()
    super.remove()
  }

  connect_signals(): void {
    super.connect_signals()

    this.connect(this.model.change, () => this.request_render())
    this.connect(this.model.glyph.change, () => this.set_data())
    this.connect(this.model.data_source.change, () => this.set_data())
    this.connect(this.model.data_source.streaming, () => this.set_data())
    this.connect(this.model.data_source.patching, (indices: number[] /* XXX: WHY? */) => this.set_data(true, indices))
    this.connect(this.model.data_source.selected.change, () => this.request_render())
    this.connect(this.model.data_source._select, () => this.request_render())
    if (this.hover_glyph != null)
      this.connect(this.model.data_source.inspect, () => this.request_render())
    this.connect(this.model.properties.view.change, () => this.set_data())
    this.connect(this.model.view.change, () => this.set_data())
    this.connect(this.model.properties.visible.change, () => this.plot_view.update_dataranges())

    const {x_ranges, y_ranges} = this.plot_view.frame

    for (const [, range] of x_ranges) {
      if (range instanceof FactorRange)
        this.connect(range.change, () => this.set_data())
    }

    for (const [, range] of y_ranges) {
      if (range instanceof FactorRange)
        this.connect(range.change, () => this.set_data())
    }

    this.connect(this.model.glyph.transformchange, () => this.set_data())
  }

  have_selection_glyphs(): boolean {
    return this.selection_glyph != null && this.nonselection_glyph != null
  }

  protected set_glyph_view_visuals(glyph_view: GlyphView | null | undefined): void {
    if (glyph_view == null)
      return
    const source = this.model.data_source
    glyph_view.set_visuals(source, this.all_indices)
  }

  // in case of partial updates like patching, the list of indices that actually
  // changed may be passed as the "indices" parameter to afford any optional optimizations
  set_data(request_render: boolean = true, indices: number[] | null = null): void {
    const t0 = Date.now()

    this.all_indices = this.model.view.indices

    const source = this.model.data_source
    this.glyph.set_data(source, this.all_indices, indices)

    this.set_glyph_view_visuals(this.glyph)
    this.set_glyph_view_visuals(this.decimated_glyph)
    this.set_glyph_view_visuals(this.selection_glyph)
    this.set_glyph_view_visuals(this.nonselection_glyph)
    this.set_glyph_view_visuals(this.hover_glyph)
    this.set_glyph_view_visuals(this.muted_glyph)

    const {lod_factor} = this.plot_model
    const N = Math.floor(this.all_indices.length/lod_factor)
    this.decimated = Array(N).fill(0).map((_, i) =>  {return i*lod_factor})

    this.set_data_timestamp = Date.now()

    if (request_render)
      this.request_render()

    logger.debug(`${this.glyph.model.type} ${this.model}): set_data finished in ${Date.now() - t0}ms`)
  }

  get has_webgl(): boolean {
    return this.glyph.has_webgl
  }

  protected should_decimate(): boolean {
    // Render decimated during interaction if too many elements and not using GL
    const {lod_threshold} = this.plot_model
    const {document} = this.model
    const {has_webgl, all_indices} = this
    if (document == null)
      return false
    return document.interactive_duration() > 0 && !has_webgl && lod_threshold != null && all_indices.length > lod_threshold
  }

  protected has_inspection(inspected_subset_indices: number[]): boolean {
    return (this.hover_glyph != null && inspected_subset_indices.length > 0)
  }

  protected _compute_inspected_full_indices(indices: number[]): Set<number> {
    const {inspected} = this.model.data_source

    if (!inspected || inspected.is_empty())
        return new Set()

    if (inspected.selected_glyph)
      return new Set(this.model.view.convert_indices_from_subset(indices))

    if (inspected.indices.length > 0)
      return new Set(inspected.indices)

    return new Set(Object.keys(inspected.multiline_indices).map((i) => parseInt(i)))
  }

  protected _compute_selected_full_indices(indices: number[]): number[] {
    const {selected} = this.model.data_source

    if (!selected || selected.is_empty())
      return []

    if (this.glyph instanceof LineView && selected.selected_glyph === this.glyph.model)
      return this.model.view.convert_indices_from_subset(indices)

    return selected.indices
  }

  protected _render(): void {
    logger.debug(`${this.glyph.model.type} ${this.model}: _render starting`)

    const t0 = Date.now()

    this.glyph.map_data()

    // indices is in subset data space
    const masked_indices = this.glyph.mask_data(this.all_indices)

    const {ctx} = this.layer

    ctx.save()

    // selected is in full set space
    const selected_full_indices = this._compute_selected_full_indices(masked_indices)

    // inspected is in full set space
    const inspected_full_indices = this._compute_inspected_full_indices(masked_indices)

    // inspected is transformed to subset space
    const inspected_subset_indices = filter(masked_indices, (i) => inspected_full_indices.has(this.all_indices[i]))

    const decimated_indices = this.should_decimate() ? this.decimated : masked_indices

    const uninspected_indices = this.has_inspection(inspected_subset_indices) ? difference(decimated_indices, inspected_subset_indices) : decimated_indices

    if (selected_full_indices.length && this.have_selection_glyphs())
      this._render_with_selection(uninspected_indices, inspected_subset_indices, selected_full_indices)
    else
      this._render_without_selection(uninspected_indices, inspected_subset_indices)

    ctx.restore()

    logger.debug(`${this.glyph.model.type} ${this.model}: _render finished in ${Date.now() - t0}ms`)
  }

  protected _render_without_selection(indices: number[], inspected_subset_indices: number[]): void {
    const trender = Date.now()

    const {ctx} = this.layer
    const {inspected} = this.model.data_source

    let glyph = this.model.muted && this.muted_glyph != null ? this.muted_glyph : this.glyph
    if (this.should_decimate())
      glyph = this.decimated_glyph

    if (this.glyph instanceof LineView) {
      if (this.hover_glyph && inspected_subset_indices.length)
        this.hover_glyph.render(ctx, this.model.view.convert_indices_from_subset(inspected_subset_indices), this.glyph)
      else
        glyph.render(ctx, this.all_indices, this.glyph)
    } else if (this.glyph instanceof PatchView || this.glyph instanceof HAreaView || this.glyph instanceof VAreaView) {
      if (inspected.selected_glyphs.length == 0 || this.hover_glyph == null) {
        glyph.render(ctx, this.all_indices, this.glyph)
      } else {
        for (const sglyph of inspected.selected_glyphs) {
          if (sglyph == this.glyph.model)
            this.hover_glyph.render(ctx, this.all_indices, this.glyph)
        }
      }
    } else {
      glyph.render(ctx, indices, this.glyph)
      if (this.hover_glyph && inspected_subset_indices.length)
        this.hover_glyph.render(ctx, inspected_subset_indices, this.glyph)
    }
    logger.trace(` - glyph renders finished in  : ${Date.now() - trender}ms`)
  }

  protected _render_with_selection(indices: number[], inspected_subset_indices: number[], selected_full_indices: number[]): void {
    const tselect = Date.now()

    const {ctx} = this.layer

    // reset the selection mask
    const selected_mask: {[key: number]: boolean} = {}
    for (const i of selected_full_indices) {
      selected_mask[i] = true
    }

    // intersect/different selection with render mask
    const selected_subset_indices: number[] = new Array()
    const nonselected_subset_indices: number[] = new Array()

    // now, selected is changed to subset space, except for Line glyph
    if (this.glyph instanceof LineView) {
      for (const i of this.all_indices) {
        if (selected_mask[i] != null)
          selected_subset_indices.push(i)
        else
          nonselected_subset_indices.push(i)
      }
    } else {
      for (const i of indices) {
        if (selected_mask[this.all_indices[i]] != null)
          selected_subset_indices.push(i)
        else
          nonselected_subset_indices.push(i)
      }
    }
    logger.trace(` - selection mask finished in : ${Date.now() - tselect}ms`)

    const trender = Date.now()
    const nonselection_glyph = this.should_decimate() ? this.decimated_glyph : this.nonselection_glyph
    nonselection_glyph.render(ctx, nonselected_subset_indices, this.glyph)
    this.selection_glyph.render(ctx, selected_subset_indices, this.glyph)
    if (this.hover_glyph != null) {
      if (this.glyph instanceof LineView)
        this.hover_glyph.render(ctx, this.model.view.convert_indices_from_subset(inspected_subset_indices), this.glyph)
      else
        this.hover_glyph.render(ctx, inspected_subset_indices, this.glyph)
    }
    logger.trace(` - glyph renders finished in  : ${Date.now() - trender}ms`)
  }

  draw_legend(ctx: Context2d, x0: number, x1: number, y0: number, y1: number, field: string | null, label: string, index: number | null): void {
    if (index == null)
      index = this.model.get_reference_point(field, label)
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
    hover_glyph: p.Property<Glyph>
    nonselection_glyph: p.Property<Glyph | "auto">
    selection_glyph: p.Property<Glyph | "auto">
    muted_glyph: p.Property<Glyph>
    muted: p.Property<boolean>
  }
}

export interface GlyphRenderer extends GlyphRenderer.Attrs {}

export class GlyphRenderer extends DataRenderer {
  properties: GlyphRenderer.Props
  __view_type__: GlyphRendererView

  constructor(attrs?: Partial<GlyphRenderer.Attrs>) {
    super(attrs)
  }

  static init_GlyphRenderer(): void {
    this.prototype.default_view = GlyphRendererView

    this.define<GlyphRenderer.Props>({
      data_source:        [ p.Instance           ],
      view:               [ p.Instance, () => new CDSView() ],
      glyph:              [ p.Instance           ],
      hover_glyph:        [ p.Instance           ],
      nonselection_glyph: [ p.Any,      'auto'   ], // Instance or "auto"
      selection_glyph:    [ p.Any,      'auto'   ], // Instance or "auto"
      muted_glyph:        [ p.Instance           ],
      muted:              [ p.Boolean,  false    ],
    })
  }

  initialize(): void {
    super.initialize()

    if (this.view.source == null) {
      this.view.source = this.data_source
      this.view.compute_indices()
    }
  }

  get_reference_point(field: string | null, value?: any): number {
    let index = 0
    if (field != null) {
      const data = this.data_source.get_column(field)
      if (data != null) {
        const i = indexOf(data, value)
        if (i != -1)
          index = i
      }
    }
    return index
  }

  get_selection_manager(): SelectionManager {
    return this.data_source.selection_manager
  }
}
