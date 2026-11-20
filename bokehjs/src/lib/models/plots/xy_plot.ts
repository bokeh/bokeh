import {Plot} from "./plot"
import {PlotView} from "./plot_canvas"
import {CartesianMapping} from "../coordinates/cartesian_mapping"
import {Range} from "../ranges/range"
import {DataRange1d} from "../ranges/data_range1d"
import {Scale} from "../scales/scale"
import {LinearScale} from "../scales/linear_scale"
import {WindowAxis} from "core/enums"
import type {Dict} from "core/types"
import type * as p from "core/properties"

export namespace XYPlot {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Omit<Plot.Props, "coordinate_system"> & {
    coordinate_system: p.Property<CartesianMapping>
    x_range: p.Property<Range>
    y_range: p.Property<Range>

    x_scale: p.Property<Scale>
    y_scale: p.Property<Scale>

    extra_x_ranges: p.Property<Dict<Range>>
    extra_y_ranges: p.Property<Dict<Range>>

    extra_x_scales: p.Property<Dict<Scale>>
    extra_y_scales: p.Property<Dict<Scale>>

    window_axis: p.Property<WindowAxis>

    match_aspect: p.Property<boolean>
    aspect_scale: p.Property<number>
  }
}

export interface XYPlot extends XYPlot.Attrs {}

export class XYPlot extends Plot {
  declare __view_type__: PlotView
  declare properties: XYPlot.Props
  declare coordinate_system: CartesianMapping

  static {
    this.prototype.default_view = PlotView

    this.define<XYPlot.Props>(({Bool, Float, Dict, Ref}) => ({
      coordinate_system: [ Ref(CartesianMapping), () => CartesianMapping.create(), {readonly: true} ],

      x_range:           [ Ref(Range), () => DataRange1d.create() ],
      y_range:           [ Ref(Range), () => DataRange1d.create() ],

      x_scale:           [ Ref(Scale), () => LinearScale.create() ],
      y_scale:           [ Ref(Scale), () => LinearScale.create() ],

      extra_x_ranges:    [ Dict(Ref(Range)), {} ],
      extra_y_ranges:    [ Dict(Ref(Range)), {} ],

      extra_x_scales:    [ Dict(Ref(Scale)), {} ],
      extra_y_scales:    [ Dict(Ref(Scale)), {} ],

      window_axis:       [ WindowAxis, "none" ],

      match_aspect:      [ Bool, false ],
      aspect_scale:      [ Float, 1 ],
    }))
  }
}
