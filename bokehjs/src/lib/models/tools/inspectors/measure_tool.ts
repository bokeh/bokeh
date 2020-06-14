import {InspectTool, InspectToolView} from "./inspect_tool"
import {Tooltip, TooltipView} from "../../annotations/tooltip"
import {BoxAnnotation} from "../../annotations/box_annotation"
// import {RendererSpec} from "../util"
import {PanEvent} from "core/ui_events"
import {Vars, get_formatter, Formatters} from "core/util/templating"
import {div, span} from "core/dom"
import * as p from "core/properties"
import {isString, isFunction} from "core/util/types"
import {build_views, remove_views} from "core/build_views"
import {TooltipAttachment, Dimensions, BoxOrigin} from "core/enums"
import {bk_tool_icon_hover} from "styles/icons"
import {bk_tooltip_row_label, bk_tooltip_row_value} from "styles/tooltips"

export type TooltipVars = Vars


export class MeasureToolView extends InspectToolView {
  model: MeasureTool

  protected _ttviews: Map<Tooltip, TooltipView>

  protected _ttmodel: Map<number, Tooltip> | null

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
     return

  }

  _pan_end(ev: PanEvent): void {
    const {sx, sy} = ev
    const curpoint: [number, number] = [sx, sy]

    this._update(curpoint)

    this.model.overlay.update({left: null, right: null, top: null, bottom: null})

    this._base_point = null
  }

  initialize(): void {
    super.initialize()
    this._ttmodel = null
    this._ttviews = new Map()
  }

  remove(): void {
    remove_views(this._ttviews)
    super.remove()
  }

  connect_signals(): void {
    super.connect_signals()
  }

  protected _compute_ttmodel(): Map<number, Tooltip> {
    const ttmodel: Map<number, Tooltip> = new Map()
    const tooltips = this.model.tooltips

    if (tooltips != null) {

        const r = 1
        const tooltip = new Tooltip({
          custom: isString(tooltips) || isFunction(tooltips),
          attachment: this.model.attachment,
          show_arrow: this.model.show_arrow,
        })
        ttmodel.set(r, tooltip)
    }

    build_views(this._ttviews, [...ttmodel.values()], {parent: this.plot_view})
    return ttmodel
  }

  get ttmodel(): Map<number, Tooltip> {
    if (this._ttmodel == null)
      this._ttmodel = this._compute_ttmodel()
    return this._ttmodel
  }

  _clear(): void {
    this._inspect(Infinity, Infinity)

    for (const [, tooltip] of this.ttmodel) {
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
    let base_anchor = this._base_point!
    const [cx, cy] = base_anchor
    const [dx, dy] = curpoint

    let dist_x: number
    let dist_y: number
    dist_x = Math.abs(dx - cx)
    dist_y = Math.abs(dy - cy)

    return [dist_x, dist_y]
  }

  _update(curpoint: [number, number]): void {

    const tooltip = this.ttmodel.get(1)
    if (tooltip == null)
      return
    tooltip.clear()

    let sx: number
    let sy: number
    sx = curpoint[0]
    sy = curpoint[1]

    this._inspect(sx,sy)

    var dis = this._measure(curpoint)
    var dis_x = dis[0]
    var dis_y = dis[1]
    const vars = {
      sx, sy, dis_x, dis_y,
    }
    tooltip.add(sx, sy, this._render_tooltips(vars))
  }

  _render_tooltips(vars: TooltipVars): HTMLElement {
    const tooltips = this.model.tooltips
    if (isString(tooltips)) {
      const el = div()
      el.innerHTML = this._replace_placeholders(tooltips, this.model.formatters,vars)
      return el
    } else if (isFunction(tooltips)) {
      return tooltips(vars)
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
          el.innerHTML = this._replace_placeholders(value.replace("$~", "$data_"), this.model.formatters, vars)
          cell.appendChild(el)
      }
      return rows
    }
  }

  _get_value(raw_name: string, special_vars: Vars) {

    if (raw_name[0] == "$") {
      const name = raw_name.substring(1)

      if (name in special_vars)
      return special_vars[name]
    else
      throw new Error(`Unknown special variable '\$${name}'`)

    }
  }

  _replace_placeholders(str: string, formatters?: Formatters, special_vars: Vars = {}): string {

    // this handles the special case @$name, replacing it with an @var corresponding to special_vars.name
    str = str.replace(/@\$name/g, (_match) => `@{${special_vars.name}}`)

    str = str.replace(/((?:\$\w+)|(?:@\w+)|(?:@{(?:[^{}]+)}))(?:{([^{}]+)})?/g, (_match, spec, format) => {
      const value = this._get_value(spec, special_vars)

      // missing value, return ???
      if (value == null)
        return `${escape("???")}`

      // 'safe' format, return the value as-is
      if (format == 'safe')
        return `${value}`

      // format and escape everything else
      const formatter = get_formatter(spec, format, formatters)
      return `${escape(formatter(value, format, special_vars))}`
    })
    return str
  }
}

export namespace MeasureTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InspectTool.Props & {
    tooltips: p.Property<string | [string, string][] | ((vars: TooltipVars) => HTMLElement)>
    formatters: p.Property<any> // XXX
    show_arrow: p.Property<boolean>
    attachment: p.Property<TooltipAttachment>
    dimensions: p.Property<Dimensions>
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
      show_arrow:   [ p.Boolean,           true           ],
      attachment:   [ p.TooltipAttachment, 'horizontal'   ],

    })

    this.register_alias("measure", () => new MeasureTool())
  }

  tool_name = "Measure"
  icon = bk_tool_icon_hover
}
