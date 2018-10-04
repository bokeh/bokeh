import {EQ, Constraint, Variable} from "core/layout/solver"
import {logger} from "core/logging"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Signal0} from "core/signaling"
import {Color} from "core/types"
import {LineJoin, LineCap} from "core/enums"
import {Place, Location, OutputBackend} from "core/enums"
import {find, removeBy, includes} from "core/util/array"
import {values} from "core/util/object"
import {isString, isArray} from "core/util/types"

import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {Title} from "../annotations/title"
import {LinearScale} from "../scales/linear_scale"
import {Toolbar} from "../tools/toolbar"
import {ToolbarPanel} from "../annotations/toolbar_panel"
import {PlotCanvas, PlotCanvasView} from "./plot_canvas"

import {Range} from "../ranges/range"
import {Scale} from "../scales/scale"
import {Glyph} from "../glyphs/glyph"
import {DataSource} from "../sources/data_source"
import {ColumnDataSource} from "../sources/column_data_source"
import {Renderer} from "../renderers/renderer"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import {Tool} from "../tools/tool"
import {register_with_event, UIEvent} from 'core/bokeh_events'
import {DataRange1d} from '../ranges/data_range1d';

export class PlotView extends LayoutDOMView {
  model: Plot

  connect_signals(): void {
    super.connect_signals()
    // Note: Title object cannot be replaced after initialization, similar to axes, and also
    // not being able to change the sizing_mode. All of these changes require a re-initialization
    // of all constraints which we don't currently support.
    const title_msg = "Title object cannot be replaced. Try changing properties on title to update it after initialization."
    this.connect(this.model.properties.title.change, () => logger.warn(title_msg))
  }

  css_classes(): string[] {
    return super.css_classes().concat("bk-plot-layout")
  }

  get_height(): number {
    return this.model._width.value / this.model.get_aspect_ratio()
  }

  get_width(): number {
    return this.model._height.value * this.model.get_aspect_ratio()
  }

  save(name: string): void {
    this.plot_canvas_view.save(name)
  }

  get plot_canvas_view(): PlotCanvasView {
    // XXX: PlotCanvasView is not LayoutDOMView
    return (this.child_views[this.model.plot_canvas.id] as any) as PlotCanvasView
  }
}

export namespace Plot {
  // line:outline_
  export interface OutlineLine {
    outline_line_color: Color
    outline_line_width: number
    outline_line_alpha: number
    outline_line_join: LineJoin
    outline_line_cap: LineCap
    outline_line_dash: number[]
    outline_line_dash_offset: number
  }

  // fill:background_
  export interface BackgroundFill {
    background_fill_color: Color
    background_fill_alpha: number
  }

  // fill:border_
  export interface BorderFill {
    border_fill_color: Color
    border_fill_alpha: number
  }

  export interface Mixins extends OutlineLine, BackgroundFill, BorderFill {}

  export interface Attrs extends LayoutDOM.Attrs, Mixins {
    toolbar: Toolbar
    toolbar_location: Location | null
    toolbar_sticky: boolean

    plot_width: number
    plot_height: number

    title: Title | string | null
    title_location: Location

    h_symmetry: boolean
    v_symmetry: boolean

    above: Renderer[]
    below: Renderer[]
    left: Renderer[]
    right: Renderer[]

    renderers: Renderer[]

    x_range: Range
    extra_x_ranges: {[key: string]: Range}
    y_range: Range
    extra_y_ranges: {[key: string]: Range}

    x_scale: Scale
    y_scale: Scale

    lod_factor: number
    lod_interval: number
    lod_threshold: number
    lod_timeout: number

    hidpi: boolean
    output_backend: OutputBackend

    min_border: number | null
    min_border_top: number | null
    min_border_left: number | null
    min_border_bottom: number | null
    min_border_right: number | null

    inner_width: number
    inner_height: number
    layout_width: number
    layout_height: number

    match_aspect: boolean
    aspect_scale: number
  }

  export interface Props extends LayoutDOM.Props {
    toolbar_location: p.Property<Location | null>
    title: p.Property<Title | string | null>
    above: p.Property<Renderer[]>
    below: p.Property<Renderer[]>
    left: p.Property<Renderer[]>
    right: p.Property<Renderer[]>
    renderers: p.Property<Renderer[]>
    outline_line_width: p.Property<number>
  }

  export type Visuals = visuals.Visuals & {
    outline_line: visuals.Line
    background_fill: visuals.Fill
    border_fill: visuals.Fill
  }
}

export interface Plot extends Plot.Attrs {}

export class Plot extends LayoutDOM {
  reset: Signal0<this>
  properties: Plot.Props

  constructor(attrs?: Partial<Plot.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Plot"
    this.prototype.default_view = PlotView

    this.mixins(["line:outline_", "fill:background_", "fill:border_"])

    this.define({
      toolbar:           [ p.Instance, () => new Toolbar()     ],
      toolbar_location:  [ p.Location, 'right'                 ],
      toolbar_sticky:    [ p.Boolean,  true                    ],

      plot_width:        [ p.Number,   600                     ],
      plot_height:       [ p.Number,   600                     ],

      title:             [ p.Any, () => new Title({text: ""})  ], // TODO: p.Either(p.Instance(Title), p.String)
      title_location:    [ p.Location, 'above'                 ],

      h_symmetry:        [ p.Bool,     true                    ],
      v_symmetry:        [ p.Bool,     false                   ],

      above:             [ p.Array,    []                      ],
      below:             [ p.Array,    []                      ],
      left:              [ p.Array,    []                      ],
      right:             [ p.Array,    []                      ],

      renderers:         [ p.Array,    []                      ],

      x_range:           [ p.Instance, () => new DataRange1d() ],
      extra_x_ranges:    [ p.Any,      {}                      ], // TODO (bev)
      y_range:           [ p.Instance, () => new DataRange1d() ],
      extra_y_ranges:    [ p.Any,      {}                      ], // TODO (bev)

      x_scale:           [ p.Instance, () => new LinearScale() ],
      y_scale:           [ p.Instance, () => new LinearScale() ],

      lod_factor:        [ p.Number,   10                      ],
      lod_interval:      [ p.Number,   300                     ],
      lod_threshold:     [ p.Number,   2000                    ],
      lod_timeout:       [ p.Number,   500                     ],

      hidpi:             [ p.Bool,     true                    ],
      output_backend:    [ p.OutputBackend, "canvas"           ],

      min_border:        [ p.Number,   5                       ],
      min_border_top:    [ p.Number,   null                    ],
      min_border_left:   [ p.Number,   null                    ],
      min_border_bottom: [ p.Number,   null                    ],
      min_border_right:  [ p.Number,   null                    ],

      inner_width:       [ p.Number                            ],
      inner_height:      [ p.Number                            ],
      layout_width:      [ p.Number                            ],
      layout_height:     [ p.Number                            ],

      match_aspect:      [ p.Bool,     false                   ],
      aspect_scale:      [ p.Number,   1                       ],
    })

    this.override({
      outline_line_color: "#e5e5e5",
      border_fill_color: "#ffffff",
      background_fill_color: "#ffffff",
    })

    register_with_event(UIEvent, this)
  }

  protected _plot_canvas: PlotCanvas

  initialize(): void {
    super.initialize()

    this.reset = new Signal0(this, "reset")

    for (const xr of values(this.extra_x_ranges).concat(this.x_range)) {
      let plots = xr.plots
      if (isArray(plots)) {
        plots = plots.concat(this)
        xr.setv({plots: plots}, {silent: true})
      }
    }

    for (const yr of values(this.extra_y_ranges).concat(this.y_range)) {
      let plots = yr.plots
      if (isArray(plots)) {
        plots = plots.concat(this)
        yr.setv({plots: plots}, {silent: true})
      }
    }
    // Min border applies to the edge of everything
    if (this.min_border != null) {
      if (this.min_border_top == null)
        this.min_border_top = this.min_border
      if (this.min_border_bottom == null)
        this.min_border_bottom = this.min_border
      if (this.min_border_left == null)
        this.min_border_left = this.min_border
      if (this.min_border_right == null)
        this.min_border_right = this.min_border
    }

    // Setup side renderers
    for (const side of ['above', 'below', 'left', 'right']) {
      const layout_renderers = this.getv(side)
      for (const renderer of layout_renderers)
        renderer.add_panel(side)
    }

    this._init_title_panel()
    this._init_toolbar_panel()

    this._plot_canvas = this._init_plot_canvas()
    this.plot_canvas.toolbar = this.toolbar

    // Set width & height to be the passed in plot_width and plot_height
    // We may need to be more subtle about this - not sure why people use one
    // or the other.
    if (this.width == null)
      this.width = this.plot_width
    if (this.height == null)
      this.height = this.plot_height
  }

  protected _init_plot_canvas(): PlotCanvas {
    return new PlotCanvas({plot: this})
  }

  protected _init_title_panel(): void {
    if (this.title != null) {
      const title = isString(this.title) ? new Title({text: this.title}) : this.title
      this.add_layout(title, this.title_location)
    }
  }

  protected _init_toolbar_panel(): void {
    let tpanel = find(this.renderers, (model): model is ToolbarPanel => {
      return model instanceof ToolbarPanel && includes(model.tags, this.id)
    })

    if (tpanel != null)
      this.remove_layout(tpanel)

    switch (this.toolbar_location) {
      case "left":
      case "right":
      case "above":
      case "below": {
        tpanel = new ToolbarPanel({toolbar: this.toolbar, tags: [this.id]})
        this.toolbar.toolbar_location = this.toolbar_location

        if (this.toolbar_sticky) {
          const models = this.getv(this.toolbar_location)
          const title = find(models, (model): model is Title => model instanceof Title)

          if (title != null) {
            (tpanel as ToolbarPanel).set_panel((title as Title).panel!) // XXX, XXX: because find() doesn't provide narrowed types
            this.add_renderers(tpanel)
            return
          }
        }

        this.add_layout(tpanel, this.toolbar_location)
        break
      }
    }
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.properties.toolbar_location.change, () => this._init_toolbar_panel())
  }

  get plot_canvas(): PlotCanvas {
    return this._plot_canvas
  }

  protected _doc_attached(): void {
    this.plot_canvas.attach_document(this.document!) // XXX!
    super._doc_attached()
  }

  add_renderers(...new_renderers: Renderer[]): void {
    let renderers = this.renderers
    renderers = renderers.concat(new_renderers)
    this.renderers = renderers
  }

  add_layout(renderer: any /* XXX: Renderer */, side: Place = "center"): void {
    if (renderer.props.plot != null)
      (renderer as any).plot = this // XXX
    if (side != "center") {
      const side_renderers = this.getv(side)
      side_renderers.push(renderer)
      renderer.add_panel(side) // XXX
    }
    this.add_renderers(renderer)
  }

  remove_layout(renderer: Renderer): void {

    const del = (items: Renderer[]): void => {
      removeBy(items, (item) => item == renderer)
    }

    del(this.left)
    del(this.right)
    del(this.above)
    del(this.below)
    del(this.renderers)
  }

  add_glyph(glyph: Glyph, source: DataSource = new ColumnDataSource(), extra_attrs: any = {}): GlyphRenderer {
    const attrs = {...extra_attrs, data_source: source, glyph}
    const renderer = new GlyphRenderer(attrs)
    this.add_renderers(renderer)
    return renderer
  }

  add_tools(...tools: Tool[]): void {
    for (const tool of tools) {
      if ((tool as any).overlay != null) // XXX
        this.add_renderers((tool as any).overlay)
    }

    this.toolbar.tools = this.toolbar.tools.concat(tools)
  }

  get_layoutable_children(): LayoutDOM[] {
    return [this.plot_canvas]
  }

  get_constraints(): Constraint[] {
    const constraints = super.get_constraints()

    constraints.push(EQ(this._width,  [-1, this.plot_canvas._width ]))
    constraints.push(EQ(this._height, [-1, this.plot_canvas._height]))

    return constraints
  }

  get_constrained_variables(): {[key: string]: Variable} {
    const vars: {[key: string]: Variable} = {
      ...super.get_constrained_variables(),

      on_edge_align_top    : this.plot_canvas._top,
      on_edge_align_bottom : this.plot_canvas._height_minus_bottom,
      on_edge_align_left   : this.plot_canvas._left,
      on_edge_align_right  : this.plot_canvas._width_minus_right,

      box_cell_align_top   : this.plot_canvas._top,
      box_cell_align_bottom: this.plot_canvas._height_minus_bottom,
      box_cell_align_left  : this.plot_canvas._left,
      box_cell_align_right : this.plot_canvas._width_minus_right,

      box_equal_size_top   : this.plot_canvas._top,
      box_equal_size_bottom: this.plot_canvas._height_minus_bottom,
    }

    if (this.sizing_mode != "fixed") {
      vars.box_equal_size_left  = this.plot_canvas._left
      vars.box_equal_size_right = this.plot_canvas._width_minus_right
    }

    return vars
  }

  get all_renderers(): Renderer[] {
    let renderers = this.renderers
    for (const tool of this.toolbar.tools)
      renderers = renderers.concat(tool.synthetic_renderers)
    return renderers
  }
}

Plot.initClass()
