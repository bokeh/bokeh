import {compose_scale} from "../scales/util"
import {CoordinateTransform} from "./coordinate_transform"
import {Scale} from "../scales/scale"
import {LinearScale} from "../scales/linear_scale"
import {Range} from "../ranges/range"
import {DataRange1d} from "../ranges/data_range1d"
import {BBox} from "core/util/bbox"
import {CoordinateMapping} from "./coordinate_mapping"
import type {CoordinateFrame} from "./coordinate_mapping"
import type * as p from "core/properties"

export namespace SubplotMapping {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CoordinateMapping.Props & {
    x_source: p.Property<Range>
    y_source: p.Property<Range>
    x_scale: p.Property<Scale>
    y_scale: p.Property<Scale>
    x_target: p.Property<Range>
    y_target: p.Property<Range>
  }
}

export interface SubplotMapping extends SubplotMapping.Attrs {}

export class SubplotMapping extends CoordinateMapping {
  declare properties: SubplotMapping.Props

  static {
    this.define<SubplotMapping.Props>(({Ref}) => ({
      x_source: [ Ref(Range), () => DataRange1d.create() ],
      y_source: [ Ref(Range), () => DataRange1d.create() ],
      x_scale: [ Ref(Scale), () => LinearScale.create() ],
      y_scale: [ Ref(Scale), () => LinearScale.create() ],
      x_target: [ Ref(Range) ],
      y_target: [ Ref(Range) ],
    }))
  }

  override get ranges(): readonly [Range, Range] {
    return [this.x_source, this.y_source]
  }

  override get_target_bbox(frame: CoordinateFrame): BBox {
    const [x0, x1] = frame.x_scale.r_compute(this.x_target.start, this.x_target.end)
    const [y0, y1] = frame.y_scale.r_compute(this.y_target.start, this.y_target.end)
    return BBox.from_rect({x0, x1, y0, y1})
  }

  override get_transform(frame: CoordinateFrame): CoordinateTransform {
    return new CoordinateTransform(
      compose_scale(this.x_scale, this.x_source, this.x_target, frame.x_scale),
      compose_scale(this.y_scale, this.y_source, this.y_target, frame.y_scale),
    )
  }
}
