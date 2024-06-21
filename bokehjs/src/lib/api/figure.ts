import type {HasProps} from "../core/has_props"
import type {Attrs} from "../core/types"
import type {Value, Field, Vector} from "../core/vectorization"
import {isVectorized} from "../core/vectorization"
import type {Property} from "../core/properties"
import {VectorSpec, UnitsSpec} from "../core/properties"
import type {Class} from "../core/class"
import {extend} from "../core/class"
import type {Location} from "../core/enums"
import {is_equal, Comparator} from "../core/util/eq"
import {includes, uniq, zip} from "../core/util/array"
import {clone, keys, entries, is_empty, dict} from "../core/util/object"
import {isNumber, isString, isArray, isArrayOf, isPlainObject} from "../core/util/types"
import {enumerate} from "core/util/iterator"
import * as nd from "core/util/ndarray"

import type {Glyph, Scale, Plot, Toolbar} from "./models"
import {
  Axis,
  CategoricalAxis,
  CategoricalScale,
  ColumnDataSource,
  ColumnarDataSource,
  ContinuousTicker,
  CoordinateMapping,
  DataRange1d,
  DatetimeAxis,
  FactorRange,
  GlyphRenderer,
  Grid,
  LinearAxis,
  LinearScale,
  LogAxis,
  LogScale,
  MercatorAxis,
  Range,
  Range1d,
  Tool,
  ToolProxy,
} from "./models"

import {Legend} from "../models/annotations/legend"
import {LegendItem} from "../models/annotations/legend_item"
import type {ToolAliases} from "../models/tools/tool"
import {Figure as BaseFigure} from "../models/plots/figure"
import {GestureTool} from "../models/tools/gestures/gesture_tool"

import type {NamesOf, AuxGlyph} from "./glyph_api"
import {GlyphAPI} from "./glyph_api"

export type ToolName = keyof ToolAliases

const _default_tools: ToolName[] = ["pan", "wheel_zoom", "box_zoom", "save", "reset", "help"]

// export type ExtMarkerType = MarkerType | "*" | "+" | "o" | "ox" | "o+"

const _default_color = "#1f77b4"

const _default_alpha = 1.0

export type AxisType = "auto" | "linear" | "datetime" | "log" | "mercator" | null
export type AxisLocation = Location | null

export namespace Figure {
  export type Attrs = Omit<Plot.Attrs, "x_range" | "y_range"> & {
    x_range: Range | [number, number] | ArrayLike<string>
    y_range: Range | [number, number] | ArrayLike<string>
    x_axis_type: AxisType
    y_axis_type: AxisType
    x_axis_location: AxisLocation
    y_axis_location: AxisLocation
    x_axis_label: Axis["axis_label"]
    y_axis_label: Axis["axis_label"]
    x_minor_ticks: number | "auto"
    y_minor_ticks: number | "auto"
    tools: (Tool | ToolName)[] | string
    active_drag: Toolbar.Attrs["active_drag"] | string
    active_inspect: Toolbar.Attrs["active_inspect"] | string
    active_scroll: Toolbar.Attrs["active_scroll"] | string
    active_tap: Toolbar.Attrs["active_tap"] | string
    active_multi: Toolbar.Attrs["active_multi"] | string
  }
}

type IModelProxy<T extends HasProps> = {
  each(fn: (model: T, i: number) => void): void
  [Symbol.iterator](): Generator<T, void, undefined>
}

class ModelProxy<T extends HasProps> implements IModelProxy<T> {
  constructor(readonly models: T[]) {
    const mapping: Map<string, Property<unknown>[]> = new Map()

    for (const model of models) {
      for (const prop of model) {
        const {attr} = prop
        if (!mapping.has(attr)) {
          mapping.set(attr, [])
        }
        mapping.get(attr)!.push(prop)
      }
    }

    for (const [name, props] of mapping) {
      Object.defineProperty(this, name, {
        get(this: Axis): never {
          throw new Error("only setting values is supported")
        },
        set(this: Axis, value: unknown): Axis {
          for (const prop of props) {
            prop.obj.setv({[name]: value})
          }
          return this
        },
      })
    }
  }

  each(fn: (model: T, i: number) => void): void {
    let i = 0
    for (const model of this.models) {
      fn(model, i++)
    }
  }

  *[Symbol.iterator](): Generator<T, void, undefined> {
    yield* this.models
  }
}

type PropsOf<T extends HasProps> = {
  // TODO: writeonly/setter
  [K in keyof T["properties"]]: T["properties"][K] extends Property<infer P> ? P : never
}

type Proxied<T extends HasProps> = PropsOf<T> & IModelProxy<T>

// TODO: derive this from CoordinateMapping
export type ICoordinateMapping = {
  x_source?: Range
  y_source?: Range
  x_scale?: Scale
  y_scale?: Scale
  x_target: Range
  y_target: Range
}

export class SubFigure extends GlyphAPI {

  constructor(readonly coordinates: CoordinateMapping, readonly parent: Figure) {
    super()
  }

  _glyph<G extends Glyph>(cls: Class<G>, method: string, positional: NamesOf<G>, args: unknown[], overrides?: object): GlyphRenderer<G> {
    const {coordinates} = this
    return this.parent._glyph(cls, method, positional, args, {coordinates, ...overrides})
  }
}

export interface Figure extends GlyphAPI {}
export class Figure extends BaseFigure {

  get xaxes(): Axis[] {
    return [...this.below, ...this.above].filter((r) => r instanceof Axis)
  }
  get yaxes(): Axis[] {
    return [...this.left, ...this.right].filter((r) => r instanceof Axis)
  }
  get axes(): Axis[] {
    return [...this.below, ...this.above, ...this.left, ...this.right].filter((r) => r instanceof Axis)
  }

  get xaxis(): Proxied<Axis> {
    return new ModelProxy(this.xaxes) as any as Proxied<Axis>
  }
  get yaxis(): Proxied<Axis> {
    return new ModelProxy(this.yaxes) as any as Proxied<Axis>
  }
  get axis(): Proxied<Axis> {
    return new ModelProxy(this.axes) as any as Proxied<Axis>
  }

  get xgrids(): Grid[] {
    return this.center.filter((r) => r instanceof Grid).filter((grid) => grid.dimension == 0)
  }
  get ygrids(): Grid[] {
    return this.center.filter((r) => r instanceof Grid).filter((grid) => grid.dimension == 1)
  }
  get grids(): Grid[] {
    return this.center.filter((r) => r instanceof Grid)
  }

  get xgrid(): Proxied<Grid> {
    return new ModelProxy(this.xgrids) as any as Proxied<Grid>
  }
  get ygrid(): Proxied<Grid> {
    return new ModelProxy(this.ygrids) as any as Proxied<Grid>
  }
  get grid(): Proxied<Grid> {
    return new ModelProxy(this.grids) as any as Proxied<Grid>
  }

  get legend(): Legend {
    const legends = this.panels.filter((r) => r instanceof Legend)

    if (legends.length == 0) {
      const legend = new Legend()
      this.add_layout(legend)
      return legend
    } else {
      const [legend] = legends
      return legend
    }
  }

  static {
    extend(this, GlyphAPI)
  }

  constructor(attrs: Partial<Figure.Attrs> = {}) {
    attrs = {...attrs}

    const x_axis_type = attrs.x_axis_type === undefined ? "auto" : attrs.x_axis_type
    const y_axis_type = attrs.y_axis_type === undefined ? "auto" : attrs.y_axis_type
    delete attrs.x_axis_type
    delete attrs.y_axis_type

    const x_minor_ticks = attrs.x_minor_ticks ?? "auto"
    const y_minor_ticks = attrs.y_minor_ticks ?? "auto"
    delete attrs.x_minor_ticks
    delete attrs.y_minor_ticks

    const x_axis_location = attrs.x_axis_location === undefined ? "below" : attrs.x_axis_location
    const y_axis_location = attrs.y_axis_location === undefined ? "left"  : attrs.y_axis_location
    delete attrs.x_axis_location
    delete attrs.y_axis_location

    const x_axis_label = attrs.x_axis_label ?? ""
    const y_axis_label = attrs.y_axis_label ?? ""
    delete attrs.x_axis_label
    delete attrs.y_axis_label

    const x_range = Figure._get_range(attrs.x_range)
    const y_range = Figure._get_range(attrs.y_range)
    delete attrs.x_range
    delete attrs.y_range

    const x_scale = attrs.x_scale ?? Figure._get_scale(x_range, x_axis_type)
    const y_scale = attrs.y_scale ?? Figure._get_scale(y_range, y_axis_type)
    delete attrs.x_scale
    delete attrs.y_scale

    const {
      active_drag,
      active_inspect,
      active_scroll,
      active_tap,
      active_multi,
    } = attrs

    delete attrs.active_drag
    delete attrs.active_inspect
    delete attrs.active_scroll
    delete attrs.active_tap
    delete attrs.active_multi

    const tools = (() => {
      const {tools, toolbar} = attrs
      if (tools != null) {
        if (toolbar != null) {
          throw new Error("'tools' and 'toolbar' can't be used together")
        } else {
          delete attrs.tools

          if (isString(tools)) {
            return tools.split(",").map((s) => s.trim()).filter((s) => s.length > 0) as (keyof ToolAliases)[]
          } else {
            return tools
          }
        }
      } else {
        return toolbar != null ? null : _default_tools
      }
    })()

    super({...attrs, x_range, y_range, x_scale, y_scale})

    this._process_axis_and_grid(x_axis_type, x_axis_location, x_minor_ticks, x_axis_label, x_range, 0)
    this._process_axis_and_grid(y_axis_type, y_axis_location, y_minor_ticks, y_axis_label, y_range, 1)

    const tool_map = new Map<string, Tool>()
    if (tools != null) {
      const resolved_tools = tools.map((tool) => {
        if (tool instanceof Tool) {
          return tool
        } else {
          const resolved_tool = Tool.from_string(tool)
          tool_map.set(tool, resolved_tool)
          return resolved_tool
        }
      })
      this.add_tools(...resolved_tools)
    }

    if (isString(active_drag) && active_drag != "auto") {
      const tool = tool_map.get(active_drag)
      if (tool instanceof GestureTool || tool instanceof ToolProxy) {
        this.toolbar.active_drag = tool
      }
    } else if (active_drag !== undefined) {
      this.toolbar.active_drag = active_drag
    }

    if (isString(active_inspect) && active_inspect != "auto") {
      const tool = tool_map.get(active_inspect)
      if (tool != null) {
        this.toolbar.active_inspect = tool
      }
    } else if (active_inspect !== undefined) {
      this.toolbar.active_inspect = active_inspect
    }

    if (isString(active_scroll) && active_scroll != "auto") {
      const tool = tool_map.get(active_scroll)
      if (tool instanceof GestureTool || tool instanceof ToolProxy) {
        this.toolbar.active_scroll = tool
      }
    } else if (active_scroll !== undefined) {
      this.toolbar.active_scroll = active_scroll
    }

    if (isString(active_tap) && active_tap != "auto") {
      const tool = tool_map.get(active_tap)
      if (tool instanceof GestureTool || tool instanceof ToolProxy) {
        this.toolbar.active_tap = tool
      }
    } else if (active_tap !== undefined) {
      this.toolbar.active_tap = active_tap
    }

    if (isString(active_multi) && active_multi != "auto") {
      const tool = tool_map.get(active_multi)
      if (tool instanceof GestureTool || tool instanceof ToolProxy) {
        this.toolbar.active_multi = tool
      }
    } else if (active_multi !== undefined) {
      this.toolbar.active_multi = active_multi
    }
  }

  get coordinates(): CoordinateMapping | null {
    return null
  }

  subplot(coordinates: ICoordinateMapping): SubFigure {
    const mapping = new CoordinateMapping(coordinates)
    return new SubFigure(mapping, this)
  }

  _pop_visuals(cls: Class<HasProps>, props: Attrs, prefix: string = "",
      defaults: Attrs = {}, override_defaults: Attrs = {}): Attrs {

    const _split_feature_trait = function(ft: string): string[] {
      const fta: string[] = ft.split("_", 2)
      return fta.length == 2 ? fta : fta.concat([""])
    }
    const _is_visual = function(ft: string): boolean {
      const [feature, trait] = _split_feature_trait(ft)
      return includes(["line", "fill", "hatch", "text", "global"], feature) && trait !== ""
    }

    defaults = {...defaults}
    const trait_defaults: Attrs = {}

    const props_proxy = dict(props)
    const prototype_props_proxy = dict(cls.prototype._props)
    const defaults_proxy = dict(defaults)
    const trait_defaults_proxy = dict(trait_defaults)
    const override_defaults_proxy = dict(override_defaults)

    if (!defaults_proxy.has("text_color")) {
      defaults.text_color = "black"
    }
    if (!defaults_proxy.has("hatch_color")) {
      defaults.hatch_color = "black"
    }

    if (!trait_defaults_proxy.has("color")) {
      trait_defaults.color = _default_color
    }
    if (!trait_defaults_proxy.has("alpha")) {
      trait_defaults.alpha = _default_alpha
    }

    const result: Attrs = {}
    const traits = new Set()
    for (const pname of keys(cls.prototype._props)) {
      if (_is_visual(pname)) {
        const trait = _split_feature_trait(pname)[1]
        if (props_proxy.has(prefix + pname)) {
          result[pname] = props[prefix + pname]
          delete props[prefix + pname]
        } else if (!prototype_props_proxy.has(trait) && props_proxy.has(prefix + trait)) {
          result[pname] = props[prefix + trait]
        } else if (override_defaults_proxy.has(trait)) {
          result[pname] = override_defaults[trait]
        } else if (defaults_proxy.has(pname)) {
          result[pname] = defaults[pname]
        } else if (trait_defaults_proxy.has(trait)) {
          result[pname] = trait_defaults[trait]
        }
        if (!prototype_props_proxy.has(trait)) {
          traits.add(trait)
        }
      }
    }

    for (const name of traits) {
      delete props[prefix + name]
    }

    return result
  }

  _find_uniq_name(data: Map<string, unknown>, name: string): string {
    let i = 1
    while (true) {
      const new_name = `${name}__${i}`
      if (data.has(new_name)) {
        i += 1
      } else {
        return new_name
      }
    }
  }

  _fixup_values(cls: Class<HasProps>, data: Map<string, unknown>, attrs: Attrs): Set<string> {
    const unresolved_attrs = new Set<string>()
    const props = dict(cls.prototype._props)

    for (const [name, value] of entries(attrs)) {
      const prop = props.get(name)
      if (prop != null) {
        if (prop.type.prototype instanceof VectorSpec) {
          if (value != null) {
            if (isArray(value) || nd.is_NDArray(value)) {
              let field
              if (data.has(name)) {
                if (data.get(name) !== value) {
                  field = this._find_uniq_name(data, name)
                  data.set(field, value)
                } else {
                  field = name
                }
              } else {
                field = name
                data.set(field, value)
              }

              attrs[name] = {field}
            } else if (isNumber(value) || isString(value)) { // or Date?
              attrs[name] = {value}
            }
          }

          if (prop.type.prototype instanceof UnitsSpec) {
            const units_attr = `${name}_units`
            const units = attrs[units_attr]
            if (units !== undefined) {
              attrs[name] = {...attrs[name] as any, units}
              unresolved_attrs.delete(units_attr)
              delete attrs[units_attr]
            }
          }
        }
      } else {
        unresolved_attrs.add(name)
      }
    }

    return unresolved_attrs
  }

  _signature(method: string, positional: string[]): string {
    return `the method signature is ${method}(${positional.join(", ")}, args?)`
  }

  _glyph<G extends Glyph>(cls: Class<G>, method: string, positional: NamesOf<G>, args: unknown[], overrides: object = {}): GlyphRenderer<G> {
    let attrs: Attrs & Partial<AuxGlyph>

    const n_args = args.length
    const n_pos = positional.length

    if (n_args == n_pos || n_args == n_pos + 1) {
      attrs = {}

      for (const [[param, arg], i] of enumerate(zip(positional, args))) {
        if (isPlainObject(arg) && !isVectorized(arg)) {
          throw new Error(`invalid value for '${param}' parameter at position ${i}; ${this._signature(method, positional)}`)
        } else {
          attrs[param] = arg
        }
      }

      if (n_args == n_pos + 1) {
        const opts = args[n_args - 1]
        if (!isPlainObject(opts) || isVectorized(opts)) {
          throw new Error(`expected optional arguments; ${this._signature(method, positional)}`)
        } else {
          attrs = {...attrs, ...args[args.length - 1] as Attrs}
        }
      }
    } else if (n_args == 0) {
      attrs = {}
    } else if (n_args == 1) {
      attrs = {...args[0] as Attrs}
    } else {
      throw new Error(`wrong number of arguments; ${this._signature(method, positional)}`)
    }

    attrs = {...attrs, ...overrides}

    const source = (() => {
      const {source} = attrs
      if (source == null) {
        return new ColumnDataSource()
      } else if (source instanceof ColumnarDataSource) {
        return source
      } else {
        return new ColumnDataSource({data: source})
      }
    })()
    const data = clone(source.data)
    delete attrs.source

    const {view} = attrs
    delete attrs.view

    const legend = attrs.legend
    delete attrs.legend
    const legend_label = attrs.legend_label
    delete attrs.legend_label
    const legend_field = attrs.legend_field
    delete attrs.legend_field
    const legend_group = attrs.legend_group
    delete attrs.legend_group

    if ([legend, legend_label, legend_field, legend_group].filter((arg) => arg != null).length > 1) {
      throw new Error("only one of legend, legend_label, legend_field, legend_group can be specified")
    }

    const name = attrs.name
    delete attrs.name

    const level = attrs.level
    delete attrs.level

    const visible = attrs.visible
    delete attrs.visible

    const x_range_name = attrs.x_range_name
    delete attrs.x_range_name

    const y_range_name = attrs.y_range_name
    delete attrs.y_range_name

    const coordinates = attrs.coordinates
    delete attrs.coordinates

    const glyph_ca  = this._pop_visuals(cls, attrs)
    const nglyph_ca = this._pop_visuals(cls, attrs, "nonselection_", glyph_ca, {alpha: 0.1})
    const sglyph_ca = this._pop_visuals(cls, attrs, "selection_", glyph_ca)
    const hglyph_ca = this._pop_visuals(cls, attrs, "hover_", glyph_ca)
    const mglyph_ca = this._pop_visuals(cls, attrs, "muted_", glyph_ca, {alpha: 0.2})

    const data_dict = dict(data)
    this._fixup_values(cls, data_dict,  glyph_ca)
    this._fixup_values(cls, data_dict, nglyph_ca)
    this._fixup_values(cls, data_dict, sglyph_ca)
    this._fixup_values(cls, data_dict, hglyph_ca)
    this._fixup_values(cls, data_dict, mglyph_ca)

    this._fixup_values(cls, data_dict, attrs)

    source.data = data

    const _make_glyph = (cls: Class<Glyph>, attrs: Attrs, extra_attrs: Attrs) => {
      return new cls({...attrs, ...extra_attrs})
    }

    const glyph  = _make_glyph(cls, attrs, glyph_ca)
    const nglyph = !is_empty(nglyph_ca) ? _make_glyph(cls, attrs, nglyph_ca) : "auto"
    const sglyph = !is_empty(sglyph_ca) ? _make_glyph(cls, attrs, sglyph_ca) : "auto"
    const hglyph = !is_empty(hglyph_ca) ? _make_glyph(cls, attrs, hglyph_ca) : undefined
    const mglyph = !is_empty(mglyph_ca) ? _make_glyph(cls, attrs, mglyph_ca) : "auto"

    const glyph_renderer = new GlyphRenderer({
      data_source:        source,
      view,
      glyph,
      nonselection_glyph: nglyph,
      selection_glyph:    sglyph,
      hover_glyph:        hglyph,
      muted_glyph:        mglyph,
      name,
      level,
      visible,
      x_range_name,
      y_range_name,
      coordinates,
    })

    if (legend_label != null) {
      this._handle_legend_label(legend_label, this.legend, glyph_renderer)
    }
    if (legend_field != null) {
      this._handle_legend_field(legend_field, this.legend, glyph_renderer)
    }
    if (legend_group != null) {
      this._handle_legend_group(legend_group, this.legend, glyph_renderer)
    }

    this.add_renderers(glyph_renderer)
    return glyph_renderer as GlyphRenderer<G>
  }

  static _get_range(range?: Range | [number, number] | ArrayLike<string>): Range {
    if (range == null) {
      return new DataRange1d()
    }
    if (range instanceof Range) {
      return range
    }
    if (isArray(range)) {
      if (isArrayOf(range, isString)) {
        const factors = range
        return new FactorRange({factors})
      } else {
        const [start, end] = range
        return new Range1d({start, end})
      }
    }
    throw new Error(`unable to determine proper range for: '${range}'`)
  }

  static _get_scale(range_input: Range, axis_type: AxisType): Scale {
    if (range_input instanceof DataRange1d ||
        range_input instanceof Range1d) {
      switch (axis_type) {
        case null:
        case "auto":
        case "linear":
        case "datetime":
        case "mercator":
          return new LinearScale()
        case "log":
          return new LogScale()
      }
    }

    if (range_input instanceof FactorRange) {
      return new CategoricalScale()
    }

    throw new Error(`unable to determine proper scale for: '${range_input}'`)
  }

  _process_axis_and_grid(axis_type: AxisType, axis_location: AxisLocation, minor_ticks: number | "auto" | undefined,
      axis_label: Axis["axis_label"], rng: Range, dim: 0 | 1): void {
    const axis = this._get_axis(axis_type, rng, dim)
    if (axis != null) {
      if (axis instanceof LogAxis) {
        if (dim == 0) {
          this.x_scale = new LogScale()
        } else {
          this.y_scale = new LogScale()
        }
      }

      if (axis.ticker instanceof ContinuousTicker) {
        axis.ticker.num_minor_ticks = this._get_num_minor_ticks(axis, minor_ticks)
      }

      axis.axis_label = axis_label
      if (axis_location != null) {
        this.add_layout(axis, axis_location)
      }

      const grid = new Grid({dimension: dim, ticker: axis.ticker})
      this.add_layout(grid)
    }
  }

  _get_axis(axis_type: AxisType, range: Range, dim: 0 | 1): Axis | null {
    switch (axis_type) {
      case null:
        return null
      case "linear":
        return new LinearAxis()
      case "log":
        return new LogAxis()
      case "datetime":
        return new DatetimeAxis()
      case "mercator": {
        const axis = new MercatorAxis()
        const dimension = dim == 0 ? "lon" : "lat"
        axis.ticker.dimension = dimension
        axis.formatter.dimension = dimension
        return axis
      }
      case "auto":
        if (range instanceof FactorRange) {
          return new CategoricalAxis()
        } else {
          return new LinearAxis()
        } // TODO: return DatetimeAxis (Date type)
      default:
        throw new Error("shouldn't have happened")
    }
  }

  _get_num_minor_ticks(axis: Axis, num_minor_ticks?: number | "auto"): number {
    if (isNumber(num_minor_ticks)) {
      if (num_minor_ticks <= 1) {
        throw new Error("num_minor_ticks must be > 1")
      } else {
        return num_minor_ticks
      }
    } else if (num_minor_ticks == null) {
      return 0
    } else {
      return axis instanceof LogAxis ? 10 : 5
    }
  }

  _update_legend(legend_item_label: Vector<string>, glyph_renderer: GlyphRenderer): void {
    const {legend} = this
    let added = false
    for (const item of legend.items) {
      if (item.label != null && is_equal(item.label, legend_item_label)) {
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
      const new_item = new LegendItem({label: legend_item_label, renderers: [glyph_renderer]})
      legend.items.push(new_item)
    }
  }

  protected _handle_legend_label(value: string, legend: Legend, glyph_renderer: GlyphRenderer): void {
    const label = {value}
    const item = this._find_legend_item(label, legend)
    if (item != null) {
      item.renderers.push(glyph_renderer)
    } else {
      const new_item = new LegendItem({label, renderers: [glyph_renderer]})
      legend.items.push(new_item)
    }
  }

  protected _handle_legend_field(field: string, legend: Legend, glyph_renderer: GlyphRenderer): void {
    const label = {field}
    const item = this._find_legend_item(label, legend)
    if (item != null) {
      item.renderers.push(glyph_renderer)
    } else {
      const new_item = new LegendItem({label, renderers: [glyph_renderer]})
      legend.items.push(new_item)
    }
  }

  protected _handle_legend_group(name: string, legend: Legend, glyph_renderer: GlyphRenderer): void {
    const data = dict(glyph_renderer.data_source.data)
    if (!data.has(name)) {
      throw new Error(`column to be grouped does not exist in glyph data source: ${name}`)
    }
    const column = data.get(name) ?? []
    const values = uniq(column).sort()
    for (const value of values) {
      const label = {value: `${value}`}
      const index = column.indexOf(value)
      const new_item = new LegendItem({label, renderers: [glyph_renderer], index})
      legend.items.push(new_item)
    }
  }

  protected _find_legend_item(label: Vector<string>, legend: Legend): LegendItem | null {
    const cmp = new Comparator()
    for (const item of legend.items) {
      if (cmp.eq(item.label, label)) {
        return item
      }
    }
    return null
  }
}

export function figure(attributes?: Partial<Figure.Attrs>): Figure {
  return new Figure(attributes)
}
