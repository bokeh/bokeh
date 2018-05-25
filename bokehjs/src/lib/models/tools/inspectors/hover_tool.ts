import {InspectTool, InspectToolView} from "./inspect_tool"
import {Tooltip, TooltipView} from "../../annotations/tooltip"
import {RendererView} from "../../renderers/renderer"
import {GlyphRenderer, GlyphRendererView} from "../../renderers/glyph_renderer"
import {GraphRendererView} from "../../renderers/graph_renderer"
import {compute_renderers, DataRenderer, RendererSpec} from "../util"
import * as hittest from "core/hittest"
import {MoveEvent} from "core/ui_events"
import {replace_placeholders, Vars} from "core/util/templating"
import {div, span} from "core/dom"
import * as p from "core/properties"
import {color2hex} from "core/util/color"
import {values, isEmpty} from "core/util/object"
import {isString, isFunction, isNumber} from "core/util/types"
import {build_views, remove_views} from "core/build_views"
import {Anchor, TooltipAttachment} from "core/enums"
import {Geometry, PointGeometry, SpanGeometry} from "core/geometry"
import {ColumnarDataSource} from "../../sources/columnar_data_source"
import {ImageIndex} from "../../glyphs/image"

export function _nearest_line_hit(i: number, geometry: Geometry,
    sx: number, sy: number, dx: number[], dy: number[]): [[number, number], number] {
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

export function _line_hit(xs: number[], ys: number[], ind: number): [[number, number], number] {
  return [[xs[ind], ys[ind]], ind]
}

export class HoverToolView extends InspectToolView {
  model: HoverTool

  protected ttviews: {[key: string]: TooltipView}

  protected _ttmodels: {[key: string]: Tooltip} | null

  protected _computed_renderers: DataRenderer[] | null

  initialize(options: any): void {
    super.initialize(options)
    this.ttviews = {}
  }

  remove(): void {
    remove_views(this.ttviews)
    super.remove()
  }

  connect_signals(): void {
    super.connect_signals()

    for (const r of this.computed_renderers) {
      if (r instanceof GlyphRenderer)
        this.connect(r.data_source.inspect, this._update)
      else {
        this.connect(r.node_renderer.data_source.inspect, this._update)
        this.connect(r.edge_renderer.data_source.inspect, this._update)
      }
    }

    // TODO: this.connect(this.plot_model.plot.properties.renderers.change, () => this._computed_renderers = this._ttmodels = null)
    this.connect(this.model.properties.renderers.change, () => this._computed_renderers = this._ttmodels = null)
    this.connect(this.model.properties.names.change,     () => this._computed_renderers = this._ttmodels = null)
    this.connect(this.model.properties.tooltips.change,  () => this._ttmodels = null)
  }

  protected _compute_ttmodels(): {[key: string]: Tooltip} {
    const ttmodels: {[key: string]: Tooltip} = {}
    const tooltips = this.model.tooltips

    if (tooltips != null) {
      for (const r of this.computed_renderers) {
        if (r instanceof GlyphRenderer) {
          const tooltip = new Tooltip({
            custom: isString(tooltips) || isFunction(tooltips),
            attachment: this.model.attachment,
            show_arrow: this.model.show_arrow,
          })
          ttmodels[r.id] = tooltip
        } else {
          const tooltip = new Tooltip({
            custom: isString(tooltips) || isFunction(tooltips),
            attachment: this.model.attachment,
            show_arrow: this.model.show_arrow,
          })
          ttmodels[r.node_renderer.id] = tooltip
          ttmodels[r.edge_renderer.id] = tooltip
        }
      }
    }

    build_views(this.ttviews, values(ttmodels), {parent: this, plot_view: this.plot_view})

    return ttmodels
  }

  get computed_renderers(): DataRenderer[] {
    if (this._computed_renderers == null) {
      const renderers = this.model.renderers
      const all_renderers = this.plot_model.plot.renderers
      const names = this.model.names
      this._computed_renderers = compute_renderers(renderers, all_renderers, names)
    }
    return this._computed_renderers
  }

  get ttmodels(): {[key: string]: Tooltip} {
    if (this._ttmodels == null)
      this._ttmodels = this._compute_ttmodels()
    return this._ttmodels
  }

  _clear(): void {
    this._inspect(Infinity, Infinity)

    for (const rid in this.ttmodels) {
      const tt = this.ttmodels[rid]
      tt.clear()
    }
  }

  _move(ev: MoveEvent): void {
    if (!this.model.active)
      return
    const {sx, sy} = ev
    if (!this.plot_model.frame.bbox.contains(sx, sy))
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
      sm.inspect(this.plot_view.renderer_views[r.id], geometry)
    }

    if (this.model.callback != null)
      this._emit_callback(geometry)
  }

  _update([renderer_view, {geometry}]: [RendererView, {geometry: PointGeometry | SpanGeometry}]): void {
    if (!this.model.active)
      return

    if (!(renderer_view instanceof GlyphRendererView || renderer_view instanceof GraphRendererView))
      return

    const {model: renderer} = renderer_view

    const tooltip = this.ttmodels[renderer.id]
    if (tooltip == null)
      return
    tooltip.clear()

    const selection_manager = renderer.get_selection_manager()

    let indices = selection_manager.inspectors[renderer.id]
    if (renderer instanceof GlyphRenderer)
      indices = renderer.view.convert_selection_to_subset(indices)

    if (indices.is_empty())
      return

    const ds = selection_manager.source

    const frame = this.plot_model.frame
    const {sx, sy} = geometry
    const xscale = frame.xscales[renderer.x_range_name]
    const yscale = frame.yscales[renderer.y_range_name]
    const x = xscale.invert(sx)
    const y = yscale.invert(sy)

    const glyph = (renderer_view as any).glyph // XXX

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
        x:       x,
        y:       y,
        sx:      sx,
        sy:      sy,
        data_x:  data_x,
        data_y:  data_y,
        rx:      rx,
        ry:      ry,
        indices: indices.line_indices,
        name:    renderer_view.model.name,
      }
      tooltip.add(rx, ry, this._render_tooltips(ds, ii, vars))
    }

    for (const struct of indices.image_indices) {
      const vars = {index: struct['index'], x, y, sx, sy}
      const rendered = this._render_tooltips(ds, struct, vars)
      tooltip.add(sx, sy, rendered)
    }

    for (const i of indices.indices) {
      // multiglyphs set additional indices, e.g. multiline_indices for different tooltips
      if (!isEmpty(indices.multiline_indices)) {
        for (const j of indices.multiline_indices[i.toString()]) {
          let data_x = glyph._xs[i][j]
          let data_y = glyph._ys[i][j]
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
              [[rx, ry], jj] = _line_hit(glyph.sxs[i], glyph.sys[i], j)
              break
            }
            case "next": {
              [[rx, ry], jj] = _line_hit(glyph.sxs[i], glyph.sys[i], j+1)
              break
            }
            case "nearest": {
              [[rx, ry], jj] = _nearest_line_hit(j, geometry, sx, sy, glyph.sxs[i], glyph.sys[i])
              data_x = glyph._xs[i][jj]
              data_y = glyph._ys[i][jj]
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
            index:         index,
            segment_index: jj,
            x:             x,
            y:             y,
            sx:            sx,
            sy:            sy,
            data_x:        data_x,
            data_y:        data_y,
            indices:       indices.multiline_indices,
            name:          renderer_view.model.name,
          }
          tooltip.add(rx, ry, this._render_tooltips(ds, index, vars))
        }
      } else {
        // handle non-multiglyphs
        const data_x = glyph._x != null ? glyph._x[i] : undefined
        const data_y = glyph._y != null ? glyph._y[i] : undefined

        let rx: number
        let ry: number
        if (this.model.point_policy == 'snap_to_data') { // and renderer.glyph.sx? and renderer.glyph.sy?
          // Pass in our screen position so we can determine which patch we're
          // over if there are discontinuous patches.
          let pt = glyph.get_anchor_point(this.model.anchor, i, [sx, sy])
          if (pt == null)
            pt = glyph.get_anchor_point("center", i, [sx, sy])

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
          index:   index,
          x:       x,
          y:       y,
          sx:      sx,
          sy:      sy,
          data_x:  data_x,
          data_y:  data_y,
          indices: indices.indices,
          name:    renderer_view.model.name,
        }
        tooltip.add(rx, ry, this._render_tooltips(ds, index, vars))
      }
    }
  }

  _emit_callback(geometry: PointGeometry | SpanGeometry): void {
    for (const r of this.computed_renderers) {
      const index = (r as any).data_source.inspected
      const frame = this.plot_model.frame

      const xscale = frame.xscales[r.x_range_name]
      const yscale = frame.yscales[r.y_range_name]
      const x = xscale.invert(geometry.sx)
      const y = yscale.invert(geometry.sy)

      const g = {x, y, ...geometry}

      const callback = this.model.callback
      const [obj, data] = [callback, {index: index, geometry: g, renderer: r}]

      if (isFunction(callback))
        callback(obj, data)
      else
        callback.execute(obj, data)
    }
  }

  _render_tooltips(ds: ColumnarDataSource, i: number | ImageIndex, vars: Vars): HTMLElement {
    const tooltips = this.model.tooltips
    if (isString(tooltips)) {
      const el = div()
      el.innerHTML = replace_placeholders(tooltips, ds, i, this.model.formatters, vars)
      return el
    } else if (isFunction(tooltips)) {
      return tooltips(ds, vars)
    } else {
      const rows = div({style: {display: "table", borderSpacing: "2px"}})

      for (const [label, value] of tooltips) {
        const row = div({style: {display: "table-row"}})
        rows.appendChild(row)

        let cell: HTMLElement

        cell = div({style: {display: "table-cell"}, class: 'bk-tooltip-row-label'}, `${label}: `)
        row.appendChild(cell)

        cell = div({style: {display: "table-cell"}, class: 'bk-tooltip-row-value'})
        row.appendChild(cell)

        if (value.indexOf("$color") >= 0) {
          const [, opts="", colname] = value.match(/\$color(\[.*\])?:(\w*)/)! // XXX!
          const column = ds.get_column(colname) // XXX: change to columnar ds
          if (column == null) {
            const el = span({}, `${colname} unknown`)
            cell.appendChild(el)
            continue
          }
          const hex = opts.indexOf("hex") >= 0
          const swatch = opts.indexOf("swatch") >= 0
          let color = isNumber(i) ? column[i] : null
          if (color == null) {
            const el = span({}, "(null)")
            cell.appendChild(el)
            continue
          }
          if (hex)
            color = color2hex(color)
          let el = span({}, color)
          cell.appendChild(el)
          if (swatch) {
            el = span({class: 'bk-tooltip-color-block', style: {backgroundColor: color}}, " ")
            cell.appendChild(el)
          }
        } else {
          const el = span()
          el.innerHTML = replace_placeholders(value.replace("$~", "$data_"), ds, i, this.model.formatters, vars)
          cell.appendChild(el)
        }
      }

      return rows
    }
  }
}

export namespace HoverTool {
  export interface Attrs extends InspectTool.Attrs {
    tooltips: string | [string, string][] | ((source: ColumnarDataSource, vars: Vars) => HTMLElement)
    formatters: any // XXX
    renderers: RendererSpec
    names: string[]
    mode: "mouse" | "hline" | "vline"
    point_policy: "snap_to_data" | "follow_mouse" | "none"
    line_policy: "prev" | "next" | "nearest" | "interp" | "none"
    show_arrow: boolean
    anchor: Anchor
    attachment: TooltipAttachment
    callback: any // XXX
  }

  export interface Props extends InspectTool.Props {
    tooltips: p.Property<string | [string, string][] | ((source: ColumnarDataSource, vars: Vars) => HTMLElement)>
    renderers: p.Property<RendererSpec>
    names: p.Property<string[]>
  }
}

export interface HoverTool extends HoverTool.Attrs {}

export class HoverTool extends InspectTool {

  properties: HoverTool.Props

  constructor(attrs?: Partial<HoverTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "HoverTool"
    this.prototype.default_view = HoverToolView

    this.define({
      tooltips: [ p.Any, [
        ["index",         "$index"    ],
        ["data (x, y)",   "($x, $y)"  ],
        ["screen (x, y)", "($sx, $sy)"],
      ]],
      formatters:   [ p.Any,    {}             ],
      renderers:    [ p.Any,    'auto'         ],
      names:        [ p.Array,  []             ],
      mode:         [ p.String, 'mouse'        ], // TODO (bev)
      point_policy: [ p.String, 'snap_to_data' ], // TODO (bev) "follow_mouse", "none"
      line_policy:  [ p.String, 'nearest'      ], // TODO (bev) "next", "nearest", "interp", "none"
      show_arrow:   [ p.Boolean, true          ],
      anchor:       [ p.String, 'center'       ], // TODO: enum
      attachment:   [ p.String, 'horizontal'   ], // TODO: enum
      callback:     [ p.Any                    ], // TODO: p.Either(p.Instance(Callback), p.Function) ]
    })
  }

  tool_name = "Hover"
  icon = "bk-tool-icon-hover"
}

HoverTool.initClass()
