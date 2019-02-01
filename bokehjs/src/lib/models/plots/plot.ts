import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Class} from "core/class"
import {Signal0} from "core/signaling"
import {Color} from "core/types"
import {LineJoin, LineCap} from "core/enums"
import {Place, Location, OutputBackend} from "core/enums"
import {removeBy, concat} from "core/util/array"
import {values} from "core/util/object"
import {isArray} from "core/util/types"

import {LayoutDOM} from "../layouts/layout_dom"
import {Axis} from "../axes/axis"
import {Grid} from "../grids/grid"
import {GuideRenderer} from "../renderers/guide_renderer"
import {Annotation} from "../annotations/annotation"
import {Title} from "../annotations/title"
import {LinearScale} from "../scales/linear_scale"
import {Toolbar} from "../tools/toolbar"

import {Range} from "../ranges/range"
import {Scale} from "../scales/scale"
import {Glyph} from "../glyphs/glyph"
import {DataSource} from "../sources/data_source"
import {ColumnDataSource} from "../sources/column_data_source"
import {DataRenderer} from "../renderers/data_renderer"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import {Tool} from "../tools/tool"
import {DataRange1d} from '../ranges/data_range1d'

import {PlotView} from "./plot_canvas"
export {PlotView}

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

    frame_width: number
    frame_height: number

    title: Title | string | null
    title_location: Location

    h_symmetry: boolean
    v_symmetry: boolean

    above: (Annotation | Axis)[]
    below: (Annotation | Axis)[]
    left: (Annotation | Axis)[]
    right: (Annotation | Axis)[]
    center: (Annotation | Grid)[]

    renderers: DataRenderer[]

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
    outer_width: number
    outer_height: number

    match_aspect: boolean
    aspect_scale: number
  }

  export interface Props extends LayoutDOM.Props {
    toolbar_location: p.Property<Location | null>
    title: p.Property<Title | string | null>
    above: p.Property<(Annotation | Axis)[]>
    below: p.Property<(Annotation | Axis)[]>
    left: p.Property<(Annotation | Axis)[]>
    right: p.Property<(Annotation | Axis)[]>
    center: p.Property<(Annotation | Grid)[]>
    renderers: p.Property<DataRenderer[]>
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
  properties: Plot.Props
  default_view: Class<PlotView, [PlotView.Options]>

  use_map?: boolean

  reset: Signal0<this>

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

      frame_width:       [ p.Number,   null                    ],
      frame_height:      [ p.Number,   null                    ],

      title:             [ p.Any, () => new Title({text: ""})  ], // TODO: p.Either(p.Instance(Title), p.String)
      title_location:    [ p.Location, 'above'                 ],

      h_symmetry:        [ p.Bool,     true                    ],
      v_symmetry:        [ p.Bool,     false                   ],

      above:             [ p.Array,    []                      ],
      below:             [ p.Array,    []                      ],
      left:              [ p.Array,    []                      ],
      right:             [ p.Array,    []                      ],
      center:            [ p.Array,    []                      ],

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
      outer_width:       [ p.Number                            ],
      outer_height:      [ p.Number                            ],

      match_aspect:      [ p.Bool,     false                   ],
      aspect_scale:      [ p.Number,   1                       ],
    })

    this.override({
      outline_line_color: "#e5e5e5",
      border_fill_color: "#ffffff",
      background_fill_color: "#ffffff",
    })
  }

  get width(): number | null {
    const width = this.getv("width")
    return width != null ? width : this.plot_width
  }

  get height(): number | null {
    const height = this.getv("height")
    return height != null ? height : this.plot_height
  }

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
  }

  add_layout(renderer: Annotation | GuideRenderer, side: Place = "center"): void {
    const side_renderers = this.getv(side)
    side_renderers.push(renderer as any /* XXX */)
  }

  remove_layout(renderer: Annotation | GuideRenderer): void {

    const del = (items: (Annotation | GuideRenderer)[]): void => {
      removeBy(items, (item) => item == renderer)
    }

    del(this.left)
    del(this.right)
    del(this.above)
    del(this.below)
    del(this.center)
  }

  add_renderers(...renderers: DataRenderer[]): void {
    this.renderers = this.renderers.concat(renderers)
  }

  add_glyph(glyph: Glyph, source: DataSource = new ColumnDataSource(), extra_attrs: any = {}): GlyphRenderer {
    const attrs = {...extra_attrs, data_source: source, glyph}
    const renderer = new GlyphRenderer(attrs)
    this.add_renderers(renderer)
    return renderer
  }

  add_tools(...tools: Tool[]): void {
    this.toolbar.tools = this.toolbar.tools.concat(tools)
  }

  get panels(): (Annotation | Axis | Grid)[] {
    return this.side_panels.concat(this.center)
  }

  get side_panels(): (Annotation | Axis)[] {
    const {above, below, left, right} = this
    return concat([above, below, left, right])
  }
}
Plot.initClass()
