import {Model} from "../../model"
import type * as p from "core/properties"

export namespace PlotMapping {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface PlotMapping extends PlotMapping.Attrs {}

export abstract class PlotMapping extends Model {
  declare properties: PlotMapping.Props
}
