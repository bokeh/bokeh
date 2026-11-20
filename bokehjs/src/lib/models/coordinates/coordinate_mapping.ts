export {CoordinateTransform} from "./coordinate_transform"
import {Model} from "../../model"
import type {Range} from "../ranges/range"
import type {CartesianFrameView} from "../canvas/cartesian_frame"
import type {CoordinateTransform} from "./coordinate_transform"
import type * as p from "core/properties"

export type CoordinateFrame = Pick<CartesianFrameView, "bbox" | "x_scale" | "y_scale" | "x_target" | "y_target">

export namespace CoordinateMapping {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface CoordinateMapping extends CoordinateMapping.Attrs {}

export abstract class CoordinateMapping extends Model {
  declare properties: CoordinateMapping.Props

  get_target_bbox(frame: CoordinateFrame): CartesianFrameView["bbox"] {
    return frame.bbox
  }

  abstract get ranges(): readonly [Range, Range]
  abstract get_transform(frame: CoordinateFrame): CoordinateTransform
}
