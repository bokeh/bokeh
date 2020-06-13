import {Model} from "../../model"
import {DataSource} from "../sources/data_source"
import {Indices} from "core/types"
import * as p from "core/properties"

export namespace Filter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface Filter extends Filter.Attrs {}

export abstract class Filter extends Model {
  properties: Filter.Props

  constructor(attrs?: Partial<Filter.Attrs>) {
    super(attrs)
  }

  abstract compute_indices(source: DataSource): Indices
}
