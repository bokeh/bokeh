import {InspectTool, InspectToolView} from "./inspect_tool"
import {Tooltip, TooltipView} from "../../annotations/tooltip"
import {RendererView} from "../../renderers/renderer"
import {GlyphRenderer, GlyphRendererView} from "../../renderers/glyph_renderer"
import {GraphRenderer} from "../../renderers/graph_renderer"
import {DataRenderer} from "../../renderers/data_renderer"
import {BoxAnnotation} from "../../annotations/box_annotation"
import {compute_renderers, RendererSpec} from "../util"
import {PanEvent} from "core/ui_events"
import {replace_placeholders, Vars} from "core/util/templating"
import {div, span} from "core/dom"
import * as p from "core/properties"
import {isString, isFunction} from "core/util/types"
import {build_views, remove_views} from "core/build_views"
import {TooltipAttachment, Dimensions, BoxOrigin} from "core/enums"
import {ColumnarDataSource} from "../../sources/columnar_data_source"
import {bk_tool_icon_hover} from "styles/icons"
import {bk_tooltip_row_label, bk_tooltip_row_value} from "styles/tooltips"

export type TooltipVars = Vars


export class MeasureToolView extends InspectToolView {
  model: MeasureTool

  protected _ttviews: Map<Tooltip, TooltipView>

  protected _ttmodels: Map<GlyphRenderer, Tooltip> | null

  protected _computed_renderers: DataRenderer[] | null

  protected _base_point: [number, number] | null



  protected _compute_limits(curpoint: [number, number]): [[number, number], [number, number]] {
    const frame = this.plot_view.frame
    const dims = this.model.dimensions

    let base_point = this._base_point!
    if (this.model.origin == "center") {
      const [cx, cy] = base_point
      const [dx, dy] = curpoint
      base_point = [cx - (dx - cx), cy - (dy - cy)]
    }

    return this.model._get_dim_limits(base_point, curpoint, frame, dims)
  }

  _pan_start(ev: PanEvent): void {
    const {sx, sy} = ev
    this._base_point = [sx, sy]
  }

  _pan(ev: PanEvent): void {
    const {sx, sy} = ev
    const curpoint: [number, number] = [sx, sy]

    const [sxlim, sylim] = this._compute_limits(curpoint)
    this.model.overlay.update({left: sxlim[0], right: sxlim[1], top: sylim[0], bottom: sylim[1]})

    if (!this.plot_view.frame.bbox.contains(sx, sy))
    this._clear()
    this.connect_signals()

  }

  _pan_end(ev: PanEvent): void {
    const {sx, sy} = ev
    const curpoint: [number, number] = [sx, sy]

    // const [sxlim, sylim] = this._compute_limits(curpoint)

    this.model.overlay.update({left: null, right: null, top: null, bottom: null})

    this._base_point = null

    this.plot_view.push_state('box_select', {selection: this.plot_view.get_selection()})

    this._clear()
  }


  initialize(): void {
    super.initialize()
    this._ttmodels = null
    this._ttviews = new Map()
  }

  remove(): void {
    remove_views(this._ttviews)
    super.remove()
  }

  connect_signals(): void {
    // super.connect_signals()

    for (const r of this.computed_renderers) {
      if (r instanceof GlyphRenderer)
        this.connect(r.data_source.inspect, this._update)
      else if (r instanceof GraphRenderer) {
        this.connect(r.node_renderer.data_source.inspect, this._update)
        this.connect(r.edge_renderer.data_source.inspect, this._update)
      }
    }

    // TODO: this.connect(this.plot_model.properties.renderers.change, () => this._computed_renderers = this._ttmodels = null)
    this.connect(this.model.properties.renderers.change, () => this._computed_renderers = this._ttmodels = null)
    this.connect(this.model.properties.names.change,     () => this._computed_renderers = this._ttmodels = null)
    this.connect(this.model.properties.tooltips.change,  () => this._ttmodels = null)
  }

  protected _compute_ttmodels(): Map<GlyphRenderer, Tooltip> {
    const ttmodels: Map<GlyphRenderer, Tooltip> = new Map()
    const tooltips = this.model.tooltips

    if (tooltips != null) {
      for (const r of this.computed_renderers) {
        const tooltip = new Tooltip({
          custom: isString(tooltips) || isFunction(tooltips),
          attachment: this.model.attachment,
          show_arrow: this.model.show_arrow,
        })

        if (r instanceof GlyphRenderer) {
          ttmodels.set(r, tooltip)
        } else if (r instanceof GraphRenderer) {
          ttmodels.set(r.node_renderer, tooltip)
          ttmodels.set(r.edge_renderer, tooltip)
        }
      }
    }

    build_views(this._ttviews, [...ttmodels.values()], {parent: this.plot_view})
    return ttmodels
  }

  get computed_renderers(): DataRenderer[] {
    if (this._computed_renderers == null) {
      const renderers = this.model.renderers
      const all_renderers = this.plot_model.renderers
      const names = this.model.names
      this._computed_renderers = compute_renderers(renderers, all_renderers, names)
    }
    return this._computed_renderers
  }

  get ttmodels(): Map<GlyphRenderer, Tooltip> {
    if (this._ttmodels == null)
      this._ttmodels = this._compute_ttmodels()
    return this._ttmodels
  }

  _clear(): void {
    this._inspect(Infinity, Infinity)

    for (const [, tooltip] of this.ttmodels) {
      tooltip.clear()
    }
  }

  _inspect(sx: number, sy: number): void {
    if (!this.model.active)
      return
    if (!this.plot_view.frame.bbox.contains(sx, sy))
      this._clear()
   }

  _measure(curpoint: [number, number]): [number, number]{
    // const d1 = {x: base_x, y: base_y}
    let base_anchor = this._base_point!
    const [cx, cy] = base_anchor
    const [dx, dy] = curpoint

    let dist_x: number
    let dist_y: number
    dist_x = Math.abs(dx - cx)
    dist_y = Math.abs(dy - cy)

    return [dist_x, dist_y]
  }

  _update([renderer_view, curpoint]: [RendererView, [number, number]]): void {
    if (!this.model.active)
      return

    if (!(renderer_view instanceof GlyphRendererView))
      return

    const {model: renderer} = renderer_view

    const tooltip = this.ttmodels.get(renderer)
    if (tooltip == null)
      return
    tooltip.clear()

    const selection_manager = renderer.get_selection_manager()
    const ds = selection_manager.source
    let sx: number
    let sy: number
    sx = curpoint[0]
    sy = curpoint[1]

    var dis = this._measure(curpoint)
    const vars = {
      sx,sy,
      name: renderer_view.model.name,
    }
    tooltip.add(dis[0], dis[1], this._render_tooltips(ds,vars))
  }

  _render_tooltips(ds: ColumnarDataSource, vars: TooltipVars): HTMLElement {
    const tooltips = this.model.tooltips
    if (isString(tooltips)) {
      const el = div()
      el.innerHTML = replace_placeholders(tooltips, ds,0 , this.model.formatters,vars)
      return el
    } else if (isFunction(tooltips)) {
      return tooltips(ds,vars)
    } else {
      const rows = div({style: {display: "table", borderSpacing: "2px"}})

      for (const [label, value] of tooltips) {
        const row = div({style: {display: "table-row"}})
        rows.appendChild(row)

        let cell: HTMLElement

        cell = div({style: {display: "table-cell"}, class: bk_tooltip_row_label}, label.length != 0 ? `${label}: ` : "")
        row.appendChild(cell)

        cell = div({style: {display: "table-cell"}, class: bk_tooltip_row_value})
        row.appendChild(cell)
          const el = span()
          el.innerHTML = replace_placeholders(value.replace("$~", "$data_"), ds, 0, this.model.formatters, vars)
          cell.appendChild(el)
      }
      return rows
    }
  }
}

export namespace MeasureTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InspectTool.Props & {
    tooltips: p.Property<string | [string, string][] | ((source: ColumnarDataSource, vars: TooltipVars) => HTMLElement)>
    formatters: p.Property<any> // XXX
    renderers: p.Property<RendererSpec>
    names: p.Property<string[]>
    show_arrow: p.Property<boolean>
    attachment: p.Property<TooltipAttachment>
    // callback: p.Property<CallbackLike1<MeasureTool, {index: number, geometry: Geometry, renderer: Renderer}> | null>
    dimensions: p.Property<Dimensions>
    select_every_mousemove: p.Property<boolean>
    overlay: p.Property<BoxAnnotation>
    origin: p.Property<BoxOrigin>
  }
}

export interface MeasureTool extends MeasureTool.Attrs {}

export class MeasureTool extends InspectTool {
  properties: MeasureTool.Props
  __view_type__: MeasureToolView

  /** @override */
  overlay: BoxAnnotation

  constructor(attrs?: Partial<MeasureTool.Attrs>) {
    super(attrs)
  }

  static init_MeasureTool(): void {
    this.prototype.default_view = MeasureToolView

    this.define<MeasureTool.Props>({
      tooltips: [ p.Any, [
        ["delta_x", "$dis[0]"],
        ["delta_y", "$dis[1]"],
      ]],
      formatters:   [ p.Any,               {}             ],
      renderers:    [ p.Any,               'auto'         ],
      names:        [ p.Array,             []             ],
      show_arrow:   [ p.Boolean,           true           ],
      attachment:   [ p.TooltipAttachment, 'horizontal'   ],
      // callback:     [ p.Any                               ], // TODO: p.Either(p.Instance(Callback), p.Function) ]
    })

    this.register_alias("measure", () => new MeasureTool())
  }

  tool_name = "Measure"
  icon = bk_tool_icon_hover
}
