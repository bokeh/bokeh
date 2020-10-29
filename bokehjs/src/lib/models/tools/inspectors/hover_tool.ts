import {InspectTool, InspectToolView} from "./inspect_tool"
import {CustomJSHover} from "./customjs_hover"
import {CallbackLike1} from "../../callbacks/callback"
import {Tooltip, TooltipView} from "../../annotations/tooltip"
import {Renderer} from "../../renderers/renderer"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {GraphRenderer} from "../../renderers/graph_renderer"
import {DataRenderer} from "../../renderers/data_renderer"
import {LineView} from "../../glyphs/line"
import {MultiLineView} from "../../glyphs/multi_line"
import * as hittest from "core/hittest"
import {MoveEvent} from "core/ui_events"
import {replace_placeholders, Formatters, FormatterType, Vars} from "core/util/templating"
import {div, span, display, undisplay, empty} from "core/dom"
import * as p from "core/properties"
import {NumberArray} from "core/types"
import {color2hex} from "core/util/color"
import {isEmpty} from "core/util/object"
import {enumerate} from "core/util/iterator"
import {isString, isArray, isFunction, isNumber} from "core/util/types"
import {build_views, remove_views} from "core/build_views"
import {HoverMode, PointPolicy, LinePolicy, Anchor, TooltipAttachment, MutedPolicy} from "core/enums"
import {Geometry, PointGeometry, SpanGeometry, GeometryData} from "core/geometry"
import {ColumnarDataSource} from "../../sources/columnar_data_source"
import {ImageIndex} from "../../selections/selection"
import {bk_tool_icon_hover} from "styles/icons"
import {bk_tooltip_row_label, bk_tooltip_row_value, bk_tooltip_color_block} from "styles/tooltips"
import {Signal} from "core/signaling"

export type TooltipVars = {index: number} & Vars

export function _nearest_line_hit(i: number, geometry: Geometry,
    sx: number, sy: number, dx: NumberArray, dy: NumberArray): [[number, number], number] {
  const d1 = {x: dx[i], y: dy[i]}
  const d2 = {x: dx[i+1], y: dy[i+1]}

  let dist1: number
  let dist2: number
  if (geometry.type == "span") {
    if (geometry.direction == "h") {
      dist1 = Math.abs(d1.x - sx)
      dist2 = Math.abs(d2.x - sx)
    } else {
      dist1 = Math.abs(d1.y - sy)
      dist2 = Math.abs(d2.y - sy)
    }
  } else {
    const s = {x: sx, y: sy}
    dist1 = hittest.dist_2_pts(d1, s)
    dist2 = hittest.dist_2_pts(d2, s)
  }

  if (dist1 < dist2)
    return [[d1.x, d1.y], i]
  else
    return [[d2.x, d2.y], i+1]
}

export function _line_hit(xs: NumberArray, ys: NumberArray, ind: number): [[number, number], number] {
  return [[xs[ind], ys[ind]], ind]
}

export class HoverToolView extends InspectToolView {
  model: HoverTool

  protected _ttviews: Map<Tooltip, TooltipView>
  protected _ttmodels: Map<GlyphRenderer, Tooltip>
  protected _template_el?: HTMLElement

  initialize(): void {
    super.initialize()
    this._ttmodels = new Map()
    this._ttviews = new Map()
    const {tooltips} = this.model
    if (isArray(tooltips)) {
      this._template_el = this._create_template(tooltips)
    }
  }

  async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._update_ttmodels()
  }

  remove(): void {
    remove_views(this._ttviews)
    super.remove()
  }

  connect_signals(): void {
    super.connect_signals()

    const plot_renderers = this.plot_model.properties.renderers
    const {renderers, tooltips} = this.model.properties
    this.on_change([plot_renderers, renderers, tooltips], async () => await this._update_ttmodels())
  }

  protected async _update_ttmodels(): Promise<void> {
    const {_ttmodels, computed_renderers} = this
    _ttmodels.clear()

    const {tooltips} = this.model
    if (tooltips != null) {
      for (const r of this.computed_renderers) {
        const tooltip = new Tooltip({
          custom: isString(tooltips) || isFunction(tooltips),
          attachment: this.model.attachment,
          show_arrow: this.model.show_arrow,
        })

        if (r instanceof GlyphRenderer) {
          _ttmodels.set(r, tooltip)
        } else if (r instanceof GraphRenderer) {
          _ttmodels.set(r.node_renderer, tooltip)
          _ttmodels.set(r.edge_renderer, tooltip)
        }
      }
    }

    const views = await build_views(this._ttviews, [..._ttmodels.values()], {parent: this.plot_view})
    for (const ttview of views) {
      ttview.render()
    }

    const glyph_renderers = [...(function* () {
      for (const r of computed_renderers) {
        if (r instanceof GlyphRenderer)
          yield r
        else if (r instanceof GraphRenderer) {
          yield r.node_renderer
          yield r.edge_renderer
        }
      }
    })()]

    const slot = this._slots.get(this._update)
    if (slot != null) {
      const except = new Set(glyph_renderers.map((r) => r.data_source))
      Signal.disconnectReceiver(this, slot, except)
    }

    for (const r of glyph_renderers) {
      this.connect(r.data_source.inspect, this._update)
    }
  }

  get computed_renderers(): DataRenderer[] {
    const {renderers} = this.model
    return renderers == "auto" ? this.plot_model.data_renderers : renderers
  }

  get ttmodels(): Map<GlyphRenderer, Tooltip> {
    return this._ttmodels
  }

  _clear(): void {
    this._inspect(Infinity, Infinity)

    for (const [, tooltip] of this.ttmodels) {
      tooltip.clear()
    }
  }

  _move(ev: MoveEvent): void {
    if (!this.model.active)
      return
    const {sx, sy} = ev
    if (!this.plot_view.frame.bbox.contains(sx, sy))
      this._clear()
    else
      this._inspect(sx, sy)
  }

  _move_exit(): void {
    this._clear()
  }

  _inspect(sx: number, sy: number): void {
    let geometry: PointGeometry | SpanGeometry
    if (this.model.mode == 'mouse')
      geometry = {type: 'point', sx, sy}
    else {
      const direction = this.model.mode == 'vline' ? 'h' : 'v'
      geometry = {type: 'span', direction, sx, sy}
    }

    for (const r of this.computed_renderers) {
      const sm = r.get_selection_manager()
      const rview = this.plot_view.renderer_view(r)
      if (rview != null)
        sm.inspect(rview, geometry)
    }

    this._emit_callback(geometry)
  }

  _update([renderer, {geometry}]: [Renderer, {geometry: Geometry}]): void {
    if (!this.model.active)
      return

    if (!(geometry.type == "point" || geometry.type == "span"))
      return

    if (!(renderer instanceof GlyphRenderer)) // || renderer instanceof GraphRenderer))
      return

    if (this.model.muted_policy == 'ignore' && renderer.muted)
      return

    const tooltip = this.ttmodels.get(renderer)
    if (tooltip == null)
      return

    const selection_manager = renderer.get_selection_manager()

    let indices = selection_manager.inspectors.get(renderer)!
    indices = renderer.view.convert_selection_to_subset(indices)

    if (indices.is_empty()) {
      tooltip.clear()
      return
    }

    const ds = selection_manager.source
    const renderer_view = this.plot_view.renderer_view(renderer)
    if (renderer_view == null)
      return

    const {sx, sy} = geometry
    const xscale = renderer_view.coordinates.x_scale
    const yscale = renderer_view.coordinates.y_scale
    const x = xscale.invert(sx)
    const y = yscale.invert(sy)

    const {glyph} = renderer_view

    const tooltips: [number, number, HTMLElement | null][] = []

    if (glyph instanceof LineView) {
      for (const i of indices.line_indices) {
        let data_x = glyph._x[i+1]
        let data_y = glyph._y[i+1]
        let ii = i

        let rx: number
        let ry: number
        switch (this.model.line_policy) {
          case "interp": { // and renderer.get_interpolation_hit?
            [data_x, data_y] = glyph.get_interpolation_hit(i, geometry)
            rx = xscale.compute(data_x)
            ry = yscale.compute(data_y)
            break
          }
          case "prev": {
            [[rx, ry], ii] = _line_hit(glyph.sx, glyph.sy, i)
            break
          }
          case "next": {
            [[rx, ry], ii] = _line_hit(glyph.sx, glyph.sy, i+1)
            break
          }
          case "nearest": {
            [[rx, ry], ii] = _nearest_line_hit(i, geometry, sx, sy, glyph.sx, glyph.sy)
            data_x = glyph._x[ii]
            data_y = glyph._y[ii]
            break
          }
          default: {
            [rx, ry] = [sx, sy]
          }
        }

        const vars = {
          index: ii,
          x, y, sx, sy, data_x, data_y, rx, ry,
          indices: indices.line_indices,
          name: renderer.name,
        }
        tooltips.push([rx, ry, this._render_tooltips(ds, ii, vars)])
      }
    }

    for (const struct of indices.image_indices) {
      const vars = {
        index: struct.index,
        x, y, sx, sy,
        name: renderer.name,
      }
      const rendered = this._render_tooltips(ds, struct, vars)
      tooltips.push([sx, sy, rendered])
    }

    for (const i of indices.indices) {
      // multiglyphs set additional indices, e.g. multiline_indices for different tooltips
      if (glyph instanceof MultiLineView && !isEmpty(indices.multiline_indices)) {
        for (const j of indices.multiline_indices[i.toString()]) { // TODO: indices.multiline_indices.get(i)
          let data_x = glyph._xs.get(i)[j]
          let data_y = glyph._ys.get(i)[j]
          let jj = j

          let rx: number
          let ry: number
          switch (this.model.line_policy) {
            case "interp": { // and renderer.get_interpolation_hit?
              [data_x, data_y] = glyph.get_interpolation_hit(i, j, geometry)
              rx = xscale.compute(data_x)
              ry = yscale.compute(data_y)
              break
            }
            case "prev": {
              [[rx, ry], jj] = _line_hit(glyph.sxs.get(i), glyph.sys.get(i), j)
              break
            }
            case "next": {
              [[rx, ry], jj] = _line_hit(glyph.sxs.get(i), glyph.sys.get(i), j+1)
              break
            }
            case "nearest": {
              [[rx, ry], jj] = _nearest_line_hit(j, geometry, sx, sy, glyph.sxs.get(i), glyph.sys.get(i))
              data_x = glyph._xs.get(i)[jj]
              data_y = glyph._ys.get(i)[jj]
              break
            }
            default:
              throw new Error("should't have happened")
          }

          let index: number
          if (renderer instanceof GlyphRenderer)
            index = renderer.view.convert_indices_from_subset([i])[0]
          else
            index = i

          const vars = {
            index, x, y, sx, sy, data_x, data_y,
            segment_index: jj,
            indices: indices.multiline_indices,
            name: renderer.name,
          }
          tooltips.push([rx, ry, this._render_tooltips(ds, index, vars)])
        }
      } else {
        // handle non-multiglyphs
        const data_x = (glyph as any)._x?.[i]
        const data_y = (glyph as any)._y?.[i]

        let rx: number
        let ry: number
        if (this.model.point_policy == 'snap_to_data') { // and renderer.glyph.sx? and renderer.glyph.sy?
          // Pass in our screen position so we can determine which patch we're
          // over if there are discontinuous patches.
          let pt = glyph.get_anchor_point(this.model.anchor, i, [sx, sy])
          if (pt == null) {
            pt = glyph.get_anchor_point("center", i, [sx, sy])
            if (pt == null)
              continue // TODO?
          }

          rx = pt.x
          ry = pt.y
        } else
          [rx, ry] = [sx, sy]

        let index: number
        if (renderer instanceof GlyphRenderer)
          index = renderer.view.convert_indices_from_subset([i])[0]
        else
          index = i

        const vars = {
          index, x, y, sx, sy, data_x, data_y,
          indices: indices.indices,
          name: renderer.name,
        }
        tooltips.push([rx, ry, this._render_tooltips(ds, index, vars)])
      }
    }

    if (tooltips.length == 0)
      tooltip.clear()
    else {
      const {content} = tooltip
      empty(tooltip.content)
      for (const [,, node] of tooltips) {
        if (node != null)
          content.appendChild(node)
      }

      const [x, y] = tooltips[tooltips.length-1]
      tooltip.setv({position: [x, y]}, {check_eq: false}) // XXX: force update
    }
  }

  _emit_callback(geometry: PointGeometry | SpanGeometry): void {
    const {callback} = this.model
    if (callback == null)
      return

    for (const renderer of this.computed_renderers) {
      if (!(renderer instanceof GlyphRenderer))
        continue

      const glyph_renderer_view = this.plot_view.renderer_view(renderer)
      if (glyph_renderer_view == null)
        continue

      const {x_scale, y_scale} = glyph_renderer_view.coordinates
      const x = x_scale.invert(geometry.sx)
      const y = y_scale.invert(geometry.sy)

      callback.execute(this.model, {
        geometry: {x, y, ...geometry},
        renderer,
      })
    }
  }

  _create_template(tooltips: [string, string][]): HTMLElement {
    const rows = div({style: {display: "table", borderSpacing: "2px"}})

    for (const [label] of tooltips) {
      const row = div({style: {display: "table-row"}})
      rows.appendChild(row)

      const label_cell = div({style: {display: "table-cell"}, class: bk_tooltip_row_label}, label.length != 0 ? `${label}: ` : "")
      row.appendChild(label_cell)

      const value_el = span()
      value_el.dataset.value = ""

      const swatch_el = span({class: bk_tooltip_color_block}, " ")
      swatch_el.dataset.swatch = ""
      undisplay(swatch_el)

      const value_cell = div({style: {display: "table-cell"}, class: bk_tooltip_row_value}, value_el, swatch_el)
      row.appendChild(value_cell)
    }

    return rows
  }

  _render_template(template: HTMLElement, tooltips: [string, string][], ds: ColumnarDataSource, i: number | ImageIndex, vars: TooltipVars): HTMLElement {
    const el = template.cloneNode(true) as HTMLElement

    const value_els = el.querySelectorAll<HTMLElement>("[data-value]")
    const swatch_els = el.querySelectorAll<HTMLElement>("[data-swatch]")

    const color_re = /\$color(\[.*\])?:(\w*)/

    for (const [[, value], j] of enumerate(tooltips)) {
      const result = value.match(color_re)
      if (result != null) {
        const [, opts="", colname] = result
        const column = ds.get_column(colname) // XXX: change to columnar ds
        if (column == null) {
          value_els[j].textContent = `${colname} unknown`
          continue
        }
        const hex = opts.indexOf("hex") >= 0
        const swatch = opts.indexOf("swatch") >= 0
        let color = isNumber(i) ? column[i] : null
        if (color == null) {
          value_els[j].textContent = "(null)"
          continue
        }
        if (hex)
          color = color2hex(color)
        value_els[j].textContent = color
        if (swatch) {
          swatch_els[j].style.backgroundColor = color
          display(swatch_els[j])
        }
      } else {
        const content = replace_placeholders(value.replace("$~", "$data_"), ds, i, this.model.formatters, vars)
        if (isString(content)) {
          value_els[j].textContent = content
        } else {
          for (const el of content) {
            value_els[j].appendChild(el)
          }
        }
      }
    }

    return el
  }

  _render_tooltips(ds: ColumnarDataSource, i: number | ImageIndex, vars: TooltipVars): HTMLElement | null {
    const tooltips = this.model.tooltips
    if (isString(tooltips)) {
      const content = replace_placeholders({html: tooltips}, ds, i, this.model.formatters, vars)
      return div({}, content)
    } else if (isFunction(tooltips)) {
      return tooltips(ds, vars)
    } else if (tooltips != null) {
      return this._render_template(this._template_el!, tooltips, ds, i, vars)
    } else
      return null
  }
}

export namespace HoverTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InspectTool.Props & {
    tooltips: p.Property<null | string | [string, string][] | ((source: ColumnarDataSource, vars: TooltipVars) => HTMLElement)>
    formatters: p.Property<Formatters>
    renderers: p.Property<DataRenderer[] | "auto">
    mode: p.Property<HoverMode>
    muted_policy: p.Property<MutedPolicy>
    point_policy: p.Property<PointPolicy>
    line_policy: p.Property<LinePolicy>
    show_arrow: p.Property<boolean>
    anchor: p.Property<Anchor>
    attachment: p.Property<TooltipAttachment>
    callback: p.Property<CallbackLike1<HoverTool, {geometry: GeometryData, renderer: Renderer}> | null>
  }
}

export interface HoverTool extends HoverTool.Attrs {}

export class HoverTool extends InspectTool {
  properties: HoverTool.Props
  __view_type__: HoverToolView

  constructor(attrs?: Partial<HoverTool.Attrs>) {
    super(attrs)
  }

  static init_HoverTool(): void {
    this.prototype.default_view = HoverToolView

    this.define<HoverTool.Props>(({Any, Boolean, String, Array, Tuple, Dict, Or, Ref, Function, Auto, Nullable}) => ({
      tooltips: [ Nullable(Or(String, Array(Tuple(String, String)), Function<[ColumnarDataSource, TooltipVars], HTMLElement>())), [
        ["index",         "$index"    ],
        ["data (x, y)",   "($x, $y)"  ],
        ["screen (x, y)", "($sx, $sy)"],
      ]],
      formatters:   [ Dict(Or(Ref(CustomJSHover), FormatterType)), {} ],
      renderers:    [ Or(Array(Ref(DataRenderer)), Auto), "auto" ],
      mode:         [ HoverMode, "mouse" ],
      muted_policy: [ MutedPolicy, "show" ],
      point_policy: [ PointPolicy, "snap_to_data" ],
      line_policy:  [ LinePolicy, "nearest" ],
      show_arrow:   [ Boolean, true ],
      anchor:       [ Anchor, "center" ],
      attachment:   [ TooltipAttachment, "horizontal" ],
      callback:     [ Nullable(Any /*TODO*/) ],
    }))

    this.register_alias("hover", () => new HoverTool())
  }

  tool_name = "Hover"
  icon = bk_tool_icon_hover
}
