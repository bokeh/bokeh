import {sprintf} from "sprintf-js"
import {Document} from "../document"
import * as embed from "../embed"
import {BOKEH_ROOT} from "../embed"
import * as models from "./models"
import {HasProps} from "../core/has_props"
import {Value, Field} from "../core/vectorization"
import {div} from "../core/dom"
import {Class} from "../core/class"
import {Location} from "../core/enums"
import {StringSpec} from "../core/vectorization"
import {startsWith} from "../core/util/string"
import {isEqual} from "../core/util/eq"
import {any, all, includes} from "../core/util/array"
import {clone} from "../core/util/object"
import {isNumber, isString, isArray} from "../core/util/types"

import {Glyph, GlyphRenderer, Axis, Grid, Range, Scale, Tool, Plot, ColumnarDataSource} from "./models"
import {DOMView} from "../core/dom_view"

import {LayoutDOM} from "models/layouts/layout_dom"
import {Renderer} from "models/renderers/renderer"
import {Legend} from "models/annotations/legend"

export {gridplot} from "./gridplot"

const _default_tooltips: [string, string][] = [
  ["index",         "$index"    ],
  ["data (x, y)",   "($x, $y)"  ],
  ["screen (x, y)", "($sx, $sy)"],
]

export type ToolName =
  "pan" | "xpan" | "ypan" |
  "xwheel_pan" | "ywheel_pan" | "wheel_zoom" |
  "xwheel_zoom" | "ywheel_zoom" |
  "zoom_in" | "xzoom_in" | "yzoom_in" |
  "zoom_out" | "xzoom_out" | "yzoom_out" |
  "click" | "tap" |
  "box_select" | "xbox_select" | "ybox_select" |
  "poly_select" | "lasso_select" |
  "box_zoom" | "xbox_zoom" | "ybox_zoom" |
  "crosshair" | "hover" |
  "save" |
  "undo" | "redo" | "reset" |
  "help"

const _default_tools: ToolName[] = ["pan", "wheel_zoom", "box_zoom", "save", "reset", "help"]

const _known_tools: {[key in ToolName]: () => Tool} = {
  pan:          () => new models.PanTool({dimensions: 'both'}),
  xpan:         () => new models.PanTool({dimensions: 'width'}),
  ypan:         () => new models.PanTool({dimensions: 'height'}),
  xwheel_pan:   () => new models.WheelPanTool({dimension: "width"}),
  ywheel_pan:   () => new models.WheelPanTool({dimension: "height"}),
  wheel_zoom:   () => new models.WheelZoomTool({dimensions: 'both'}),
  xwheel_zoom:  () => new models.WheelZoomTool({dimensions: 'width'}),
  ywheel_zoom:  () => new models.WheelZoomTool({dimensions: 'height'}),
  zoom_in:      () => new models.ZoomInTool({dimensions: 'both'}),
  xzoom_in:     () => new models.ZoomInTool({dimensions: 'width'}),
  yzoom_in:     () => new models.ZoomInTool({dimensions: 'height'}),
  zoom_out:     () => new models.ZoomOutTool({dimensions: 'both'}),
  xzoom_out:    () => new models.ZoomOutTool({dimensions: 'width'}),
  yzoom_out:    () => new models.ZoomOutTool({dimensions: 'height'}),
  click:        () => new models.TapTool({behavior: "inspect"}),
  tap:          () => new models.TapTool(),
  crosshair:    () => new models.CrosshairTool(),
  box_select:   () => new models.BoxSelectTool(),
  xbox_select:  () => new models.BoxSelectTool({dimensions: 'width'}),
  ybox_select:  () => new models.BoxSelectTool({dimensions: 'height'}),
  poly_select:  () => new models.PolySelectTool(),
  lasso_select: () => new models.LassoSelectTool(),
  box_zoom:     () => new models.BoxZoomTool({dimensions: 'both'}),
  xbox_zoom:    () => new models.BoxZoomTool({dimensions: 'width'}),
  ybox_zoom:    () => new models.BoxZoomTool({dimensions: 'height'}),
  hover:        () => new models.HoverTool({tooltips: _default_tooltips}),
  save:         () => new models.SaveTool(),
  undo:         () => new models.UndoTool(),
  redo:         () => new models.RedoTool(),
  reset:        () => new models.ResetTool(),
  help:         () => new models.HelpTool(),
}

const _default_color = "#1f77b4"

const _default_alpha = 1.0

function _with_default<T>(value: T | undefined, default_value: T): T {
  return value === undefined ? default_value : value
}

export type AxisType = "auto" | "linear" | "datetime" | "log" | null

export interface FigureAttrs {
  width?: number
  height?: number
  x_range?: Range | [number, number] | string[]
  y_range?: Range | [number, number] | string[]
  x_axis_type?: AxisType
  y_axis_type?: AxisType
  x_axis_label?: string
  y_axis_label?: string
  x_minor_ticks?: number | "auto"
  y_minor_ticks?: number | "auto"
  tools?: (Tool | ToolName)[] | string
}

export class Figure extends Plot {

  get xgrid(): Grid {
    return this.renderers.filter((r: Renderer): r is Grid => r instanceof Grid && r.dimension === 0)[0] // TODO
  }
  get ygrid(): Grid {
    return this.renderers.filter((r: Renderer): r is Grid => r instanceof Grid && r.dimension === 1)[0] // TODO
  }

  get xaxis(): Axis {
    return this.below.concat(this.above).filter((r: Renderer): r is Axis => r instanceof Axis)[0] // TODO
  }
  get yaxis(): Axis {
    return this.left.concat(this.right).filter((r: Renderer): r is Axis => r instanceof Axis)[0] // TODO
  }

  protected _legend: Legend

  constructor(attributes: any = {}) {
    const attrs = clone(attributes)

    const tools = _with_default(attrs.tools, _default_tools)
    delete attrs.tools

    attrs.x_range = Figure._get_range(attrs.x_range)
    attrs.y_range = Figure._get_range(attrs.y_range)

    const x_axis_type = _with_default(attrs.x_axis_type, "auto")
    const y_axis_type = _with_default(attrs.y_axis_type, "auto")
    delete attrs.x_axis_type
    delete attrs.y_axis_type

    attrs.x_scale = Figure._get_scale(attrs.x_range, x_axis_type)
    attrs.y_scale = Figure._get_scale(attrs.y_range, y_axis_type)

    const x_minor_ticks = attrs.x_minor_ticks != null ? attrs.x_minor_ticks : "auto"
    const y_minor_ticks = attrs.y_minor_ticks != null ? attrs.y_minor_ticks : "auto"
    delete attrs.x_minor_ticks
    delete attrs.y_minor_ticks

    const x_axis_location = attrs.x_axis_location != null ? attrs.x_axis_location : "below"
    const y_axis_location = attrs.y_axis_location != null ? attrs.y_axis_location : "left"
    delete attrs.x_axis_location
    delete attrs.y_axis_location

    const x_axis_label = attrs.x_axis_label != null ? attrs.x_axis_label : ""
    const y_axis_label = attrs.y_axis_label != null ? attrs.y_axis_label : ""
    delete attrs.x_axis_label
    delete attrs.y_axis_label

    if (attrs.width !== undefined) {
      if (attrs.plot_width === undefined) {
        attrs.plot_width = attrs.width
      } else {
        throw new Error("both 'width' and 'plot_width' can't be given at the same time")
      }
      delete attrs.width
    }

    if (attrs.height !== undefined) {
      if (attrs.plot_height === undefined) {
        attrs.plot_height = attrs.height
      } else {
        throw new Error("both 'height' and 'plot_height' can't be given at the same time")
      }
      delete attrs.height
    }

    super(attrs)

    this._process_axis_and_grid(x_axis_type, x_axis_location, x_minor_ticks, x_axis_label, attrs.x_range, 0)
    this._process_axis_and_grid(y_axis_type, y_axis_location, y_minor_ticks, y_axis_label, attrs.y_range, 1)

    this.add_tools(...this._process_tools(tools))

    this._legend = new Legend({plot: this, items: []})
    this.add_renderers(this._legend)
  }

  annular_wedge(...args: any[]): GlyphRenderer     { return this._glyph(models.AnnularWedge, "x,y,inner_radius,outer_radius,start_angle,end_angle", args); }
  annulus(...args: any[]): GlyphRenderer           { return this._glyph(models.Annulus,      "x,y,inner_radius,outer_radius",                       args); }
  arc(...args: any[]): GlyphRenderer               { return this._glyph(models.Arc,          "x,y,radius,start_angle,end_angle",                    args); }
  bezier(...args: any[]): GlyphRenderer            { return this._glyph(models.Bezier,       "x0,y0,x1,y1,cx0,cy0,cx1,cy1",                         args); }
  circle(...args: any[]): GlyphRenderer            { return this._glyph(models.Circle,       "x,y",                                                 args); }
  ellipse(...args: any[]): GlyphRenderer           { return this._glyph(models.Ellipse,      "x,y,width,height",                                    args); }
  image(...args: any[]): GlyphRenderer             { return this._glyph(models.Image,        "color_mapper,image,rows,cols,x,y,dw,dh",              args); }
  image_rgba(...args: any[]): GlyphRenderer        { return this._glyph(models.ImageRGBA,    "image,rows,cols,x,y,dw,dh",                           args); }
  image_url(...args: any[]): GlyphRenderer         { return this._glyph(models.ImageURL,     "url,x,y,w,h",                                         args); }
  line(...args: any[]): GlyphRenderer              { return this._glyph(models.Line,         "x,y",                                                 args); }
  multi_line(...args: any[]): GlyphRenderer        { return this._glyph(models.MultiLine,    "xs,ys",                                               args); }
  multi_polygons(...args: any[]): GlyphRenderer    { return this._glyph(models.MultiPolygons,"xs,ys",                                               args); }
  oval(...args: any[]): GlyphRenderer              { return this._glyph(models.Oval,         "x,y,width,height",                                    args); }
  patch(...args: any[]): GlyphRenderer             { return this._glyph(models.Patch,        "x,y",                                                 args); }
  patches(...args: any[]): GlyphRenderer           { return this._glyph(models.Patches,      "xs,ys",                                               args); }
  quad(...args: any[]): GlyphRenderer              { return this._glyph(models.Quad,         "left,right,bottom,top",                               args); }
  quadratic(...args: any[]): GlyphRenderer         { return this._glyph(models.Quadratic,    "x0,y0,x1,y1,cx,cy",                                   args); }
  ray(...args: any[]): GlyphRenderer               { return this._glyph(models.Ray,          "x,y,length",                                          args); }
  rect(...args: any[]): GlyphRenderer              { return this._glyph(models.Rect,         "x,y,width,height",                                    args); }
  segment(...args: any[]): GlyphRenderer           { return this._glyph(models.Segment,      "x0,y0,x1,y1",                                         args); }
  text(...args: any[]): GlyphRenderer              { return this._glyph(models.Text,         "x,y,text",                                            args); }
  wedge(...args: any[]): GlyphRenderer             { return this._glyph(models.Wedge,        "x,y,radius,start_angle,end_angle",                    args); }

  asterisk(...args: any[]): GlyphRenderer          { return this._marker(models.Asterisk,         args); }
  circle_cross(...args: any[]): GlyphRenderer      { return this._marker(models.CircleCross,      args); }
  circle_x(...args: any[]): GlyphRenderer          { return this._marker(models.CircleX,          args); }
  cross(...args: any[]): GlyphRenderer             { return this._marker(models.Cross,            args); }
  dash(...args: any[]): GlyphRenderer              { return this._marker(models.Dash,             args); }
  diamond(...args: any[]): GlyphRenderer           { return this._marker(models.Diamond,          args); }
  diamond_cross(...args: any[]): GlyphRenderer     { return this._marker(models.DiamondCross,     args); }
  inverted_triangle(...args: any[]): GlyphRenderer { return this._marker(models.InvertedTriangle, args); }
  square(...args: any[]): GlyphRenderer            { return this._marker(models.Square,           args); }
  square_cross(...args: any[]): GlyphRenderer      { return this._marker(models.SquareCross,      args); }
  square_x(...args: any[]): GlyphRenderer          { return this._marker(models.SquareX,          args); }
  triangle(...args: any[]): GlyphRenderer          { return this._marker(models.Triangle,         args); }
  x(...args: any[]): GlyphRenderer                 { return this._marker(models.X,                args); }

  _pop_colors_and_alpha(cls: Class<HasProps>, attrs: {[key: string]: any}, prefix: string = "",
                        default_color: string = _default_color, default_alpha: number = _default_alpha): {[key: string]: any} {
    const result: {[key: string]: any} = {}

    const color = _with_default(attrs[prefix + "color"], default_color)
    const alpha = _with_default(attrs[prefix + "alpha"], default_alpha)

    delete attrs[prefix + "color"]
    delete attrs[prefix + "alpha"]

    const _update_with = function(name: string, default_value: any): void {
      if (cls.prototype.props[name] != null) {
        result[name] = _with_default(attrs[prefix + name], default_value)
        delete attrs[prefix + name]
      }
    }

    _update_with("fill_color", color)
    _update_with("line_color", color)
    _update_with("text_color", "black")

    _update_with("fill_alpha", alpha)
    _update_with("line_alpha", alpha)
    _update_with("text_alpha", alpha)

    return result
  }

  _find_uniq_name(data: {[key: string]: any[]}, name: string): string {
    let i = 1
    while (true) {
      const new_name = `${name}__${i}`
      if (data[new_name] != null) {
        i += 1
      } else {
        return new_name
      }
    }
  }

  _fixup_values(cls: Class<HasProps>, data: {[key: string]: any}, attrs: {[key: string]: any}): void {
    for (const name in attrs) {
      const value = attrs[name]
      const prop = cls.prototype.props[name]

      if (prop != null) {
        if (prop.type.prototype.dataspec) {
          if (value != null) {
            if (isArray(value)) {
              let field
              if (data[name] != null) {
                if (data[name] !== value) {
                  field = this._find_uniq_name(data, name)
                  data[field] = value
                } else {
                  field = name
                }
              } else {
                field = name
                data[field] = value
              }

              attrs[name] = { field }
            } else if (isNumber(value) || isString(value)) { // or Date?
              attrs[name] = { value }
            }
          }
        }
      }
    }
  }

  _glyph(cls: Class<Glyph>, params_string: string, args: any): GlyphRenderer {
    const params = params_string.split(",")

    let attrs
    if (args.length === 1) {
      [attrs] = args
      attrs = clone(attrs)
    } else {
      attrs = clone(args[args.length - 1])

      for (let i = 0; i < params.length; i++) {
        const param = params[i]
        attrs[param] = args[i]
      }
    }

    const legend = this._process_legend(attrs.legend, attrs.source)
    delete attrs.legend

    const has_sglyph = any(Object.keys(attrs), key => startsWith(key, "selection_"))
    const has_hglyph = any(Object.keys(attrs), key => startsWith(key, "hover_"))

    const glyph_ca   = this._pop_colors_and_alpha(cls, attrs)
    const nsglyph_ca = this._pop_colors_and_alpha(cls, attrs, "nonselection_", undefined, 0.1)
    const sglyph_ca  = has_sglyph ? this._pop_colors_and_alpha(cls, attrs, "selection_") : {}
    const hglyph_ca  = has_hglyph ? this._pop_colors_and_alpha(cls, attrs, "hover_") : {}

    const source = attrs.source != null ? attrs.source : new models.ColumnDataSource()
    const data = clone(source.data)
    delete attrs.source

    this._fixup_values(cls, data,   glyph_ca)
    this._fixup_values(cls, data, nsglyph_ca)
    this._fixup_values(cls, data,  sglyph_ca)
    this._fixup_values(cls, data,  hglyph_ca)

    this._fixup_values(cls, data, attrs)

    source.data = data

    const _make_glyph = (cls: Class<Glyph>, attrs: any, extra_attrs: any) => {
      return new cls({...attrs, ...extra_attrs})
    }

    const glyph   = _make_glyph(cls, attrs,   glyph_ca)
    const nsglyph = _make_glyph(cls, attrs, nsglyph_ca)
    const sglyph  = has_sglyph ? _make_glyph(cls, attrs, sglyph_ca) : undefined
    const hglyph  = has_hglyph ? _make_glyph(cls, attrs, hglyph_ca) : undefined

    const glyph_renderer = new GlyphRenderer({
      data_source:        source,
      glyph:              glyph,
      nonselection_glyph: nsglyph,
      selection_glyph:    sglyph,
      hover_glyph:        hglyph,
    })

    if (legend != null) {
      this._update_legend(legend, glyph_renderer)
    }

    this.add_renderers(glyph_renderer)
    return glyph_renderer
  }

  _marker(cls: Class<Glyph>, args: any): GlyphRenderer {
    return this._glyph(cls, "x,y", args)
  }

  static _get_range(range?: Range | [number, number] | string[]): Range {
    if (range == null) {
      return new models.DataRange1d()
    }
    if (range instanceof models.Range) {
      return range
    }
    if (isArray(range)) {
      if (all(range, isString)) {
        const factors = range as string[]
        return new models.FactorRange({factors: factors})
      }
      if (range.length == 2) {
        const [start, end] = range as [number, number]
        return new models.Range1d({start, end})
      }
    }
    throw new Error(`unable to determine proper range for: '${range}'`)
  }

  static _get_scale(range_input: Range, axis_type: AxisType): Scale {
    if (range_input instanceof models.DataRange1d ||
        range_input instanceof models.Range1d) {
      switch (axis_type) {
        case null:
        case "auto":
        case "linear":
        case "datetime":
          return new models.LinearScale()
        case "log":
          return new models.LogScale()
      }
    }

    if (range_input instanceof models.FactorRange) {
      return new models.CategoricalScale()
    }

    throw new Error(`unable to determine proper scale for: '${range_input}'`)
  }

  _process_axis_and_grid(axis_type: AxisType, axis_location: Location,
                         minor_ticks: number | "auto" | undefined, axis_label: string, rng: Range, dim: 0 | 1): void {
    const axiscls = this._get_axis_class(axis_type, rng)
    if (axiscls != null) {
      if (axiscls === models.LogAxis) {
        if (dim === 0) {
          this.x_scale = new models.LogScale()
        } else {
          this.y_scale = new models.LogScale()
        }
      }

      const axis = new axiscls()

      if (axis.ticker instanceof models.ContinuousTicker) {
        axis.ticker.num_minor_ticks = this._get_num_minor_ticks(axiscls, minor_ticks)
      }
      if (axis_label.length !== 0) {
        axis.axis_label = axis_label
      }

      const grid = new models.Grid({dimension: dim, ticker: axis.ticker})

      if (axis_location !== null) {
        this.add_layout(axis, axis_location)
      }
      this.add_layout(grid)
    }
  }

  _get_axis_class(axis_type: AxisType, range: Range): Class<Axis> | null {
    switch (axis_type) {
      case null:
        return null
      case "linear":
        return models.LinearAxis
      case "log":
        return models.LogAxis
      case "datetime":
        return models.DatetimeAxis
      case "auto":
        if (range instanceof models.FactorRange)
          return models.CategoricalAxis
        else
          return models.LinearAxis // TODO: return models.DatetimeAxis (Date type)
      default:
        throw new Error("shouldn't have happened")
    }
  }

  _get_num_minor_ticks(axis_class: Class<Axis>, num_minor_ticks?: number | "auto"): number {
    if (isNumber(num_minor_ticks)) {
      if (num_minor_ticks <= 1) {
        throw new Error("num_minor_ticks must be > 1")
      }
      return num_minor_ticks
    }
    if (num_minor_ticks == null) {
      return 0
    }
    if (num_minor_ticks === 'auto') {
      if (axis_class === models.LogAxis) {
        return 10
      }
      return 5
    }
    throw new Error("shouldn't have happened")
  }

  _process_tools(tools: (Tool | string)[] | string): Tool[] {
    if (isString(tools))
      tools = tools.split(/\s*,\s*/).filter((tool) => tool.length > 0)

    function isToolName(tool: string): tool is ToolName {
      return _known_tools.hasOwnProperty(tool)
    }

    const objs = (() => {
      const result = []
      for (const tool of tools) {
        if (isString(tool)) {
          if (isToolName(tool))
            result.push(_known_tools[tool]())
          else
            throw new Error(`unknown tool type: ${tool}`)
        } else
          result.push(tool)
      }
      return result
    })()

    return objs
  }

  _process_legend(legend: string | StringSpec | undefined, source: ColumnarDataSource): StringSpec | null {
    let legend_item_label = null
    if (legend != null) {
      if (isString(legend)) {
        legend_item_label = { value: legend }
        if ((source != null) && (source.columns() != null)) {
          if (includes(source.columns(), legend)) {
            legend_item_label = { field: legend }
          }
        }
      } else {
        legend_item_label = legend
      }
    }
    return legend_item_label
  }

  _update_legend(legend_item_label: StringSpec, glyph_renderer: GlyphRenderer): void {
    let added = false
    for (const item of this._legend.items) {
      if (item.label != null && isEqual(item.label, legend_item_label)) {
        // XXX: remove this when vectorable properties are refined
        const label = item.label as Value<string> | Field
        if ("value" in label) {
          item.renderers.push(glyph_renderer)
          added = true
          break
        }
        if ("field" in label && glyph_renderer.data_source == item.renderers[0].data_source) {
          item.renderers.push(glyph_renderer)
          added = true
          break
        }
      }
    }
    if (!added) {
      const new_item = new models.LegendItem({ label: legend_item_label, renderers: [glyph_renderer] })
      this._legend.items.push(new_item)
    }
  }
}

export function figure(attributes: any = {}) {
  return new Figure(attributes)
}

declare var $: any

export const show = function(obj: LayoutDOM | LayoutDOM[], target?: HTMLElement | string): {[key: string]: DOMView} {
  const doc = new Document()

  for (const item of isArray(obj) ? obj : [obj])
    doc.add_root(item)

  let element: HTMLElement
  if (target == null) {
    element = document.body
  } else if (isString(target)) {
    const found = document.querySelector(target)
    if (found != null && found instanceof HTMLElement)
      element = found
    else
      throw new Error(`'${target}' selector didn't match any elements`)
  } else if (target instanceof HTMLElement) {
    element = target
  } else if (typeof $ !== 'undefined' && (target as any) instanceof $) {
    element = (target as any)[0]
  } else {
    throw new Error("target should be HTMLElement, string selector, $ or null")
  }

  const root = div({class: BOKEH_ROOT})
  element.appendChild(root)

  return embed.add_document_standalone(doc, root)
}

export function color(r: number, g: number, b: number): string {
  return sprintf("#%02x%02x%02x", r, g, b)
}
