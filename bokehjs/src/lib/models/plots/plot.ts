import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Signal0} from "core/signaling"
import {Location, OutputBackend, Place, ResetPolicy} from "core/enums"
import {concat, remove_by} from "core/util/array"
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
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    toolbar: p.Property<Toolbar>
    toolbar_location: p.Property<Location | null>
    toolbar_sticky: p.Property<boolean>

    plot_width: p.Property<number>
    plot_height: p.Property<number>

    frame_width: p.Property<number | null>
    frame_height: p.Property<number | null>

    title: p.Property<Title | string | null>
    title_location: p.Property<Location | null>

    above: p.Property<(Annotation | Axis)[]>
    below: p.Property<(Annotation | Axis)[]>
    left: p.Property<(Annotation | Axis)[]>
    right: p.Property<(Annotation | Axis)[]>
    center: p.Property<(Annotation | Grid)[]>

    renderers: p.Property<DataRenderer[]>

    x_range: p.Property<Range>
    extra_x_ranges: p.Property<{[key: string]: Range}>
    y_range: p.Property<Range>
    extra_y_ranges: p.Property<{[key: string]: Range}>

    x_scale: p.Property<Scale>
    y_scale: p.Property<Scale>

    lod_factor: p.Property<number>
    lod_interval: p.Property<number>
    lod_threshold: p.Property<number>
    lod_timeout: p.Property<number>

    hidpi: p.Property<boolean>
    output_backend: p.Property<OutputBackend>

    min_border: p.Property<number | null>
    min_border_top: p.Property<number | null>
    min_border_left: p.Property<number | null>
    min_border_bottom: p.Property<number | null>
    min_border_right: p.Property<number | null>

    inner_width: p.Property<number>
    inner_height: p.Property<number>
    outer_width: p.Property<number>
    outer_height: p.Property<number>

    match_aspect: p.Property<boolean>
    aspect_scale: p.Property<number>

    reset_policy: p.Property<ResetPolicy>
  } & Mixins

  export type Mixins =
    mixins.OutlineLine    &
    mixins.BackgroundFill &
    mixins.BorderFill

  export type Visuals = visuals.Visuals & {
    outline_line: visuals.Line
    background_fill: visuals.Fill
    border_fill: visuals.Fill
  }
}

export interface Plot extends Plot.Attrs {}

export class Plot extends LayoutDOM {
  properties: Plot.Props
  __view_type__: PlotView

  use_map?: boolean

  reset: Signal0<this>

  constructor(attrs?: Partial<Plot.Attrs>) {
    super(attrs)
  }

  static init_Plot(): void {
    this.prototype.default_view = PlotView

    this.mixins<Plot.Mixins>([
      ["outline_",    mixins.Line],
      ["background_", mixins.Fill],
      ["border_",     mixins.Fill],
    ])

    this.define<Plot.Props>({
      toolbar:           [ p.Instance, () => new Toolbar()     ],
      toolbar_location:  [ p.Location, 'right'                 ],
      toolbar_sticky:    [ p.Boolean,  true                    ],

      plot_width:        [ p.Number,   600                     ],
      plot_height:       [ p.Number,   600                     ],

      frame_width:       [ p.Number,   null                    ],
      frame_height:      [ p.Number,   null                    ],

      title:             [ p.Any, () => new Title({text: ""})  ], // TODO: p.Either(p.Instance(Title), p.String)
      title_location:    [ p.Location, 'above'                 ],

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

      hidpi:             [ p.Boolean,  true                    ],
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

      match_aspect:      [ p.Boolean,  false                   ],
      aspect_scale:      [ p.Number,   1                       ],

      reset_policy:      [ p.ResetPolicy,  "standard"          ],
    })

    this.override({
      outline_line_color: "#e5e5e5",
      border_fill_color: "#ffffff",
      background_fill_color: "#ffffff",
    })
  }

  // TODO: change this when we drop ES5 compatibility (https://github.com/microsoft/TypeScript/issues/338)
  get width(): number | null {
    // const width = super.width
    const width = this.properties.width.get_value()
    return width != null ? width : this.plot_width
  }
  set width(width: number | null) {
    this.setv({width, plot_width: width})
  }

  get height(): number | null {
    // const height = super.height
    const height = this.properties.height.get_value()
    return height != null ? height : this.plot_height
  }
  set height(height: number | null) {
    this.setv({height, plot_height: height})
  }

  protected _doc_attached(): void {
    super._doc_attached()
    this._push_changes([
      [this.properties.inner_height, null, this.inner_height],
      [this.properties.inner_width, null, this.inner_width],
    ])
  }

  initialize(): void {
    super.initialize()

    this.reset = new Signal0(this, "reset")

    for (const xr of values(this.extra_x_ranges).concat(this.x_range)) {
      let plots = xr.plots
      if (isArray(plots)) {
        plots = plots.concat(this)
        xr.setv({plots}, {silent: true})
      }
    }

    for (const yr of values(this.extra_y_ranges).concat(this.y_range)) {
      let plots = yr.plots
      if (isArray(plots)) {
        plots = plots.concat(this)
        yr.setv({plots}, {silent: true})
      }
    }
  }

  add_layout(renderer: Annotation | GuideRenderer, side: Place = "center"): void {
    const renderers = this.properties[side].get_value()
    this.setv({[side]: [...renderers, renderer]})
  }

  remove_layout(renderer: Annotation | GuideRenderer): void {

    const del = (items: (Annotation | GuideRenderer)[]): void => {
      remove_by(items, (item) => item == renderer)
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
    return [...this.side_panels, ...this.center]
  }

  get side_panels(): (Annotation | Axis)[] {
    const {above, below, left, right} = this
    return concat([above, below, left, right])
  }
}
