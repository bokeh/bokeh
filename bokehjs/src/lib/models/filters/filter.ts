import {Model} from "../../model"
import type {DataSource} from "../sources/data_source"
import type {Indices} from "core/types"
import type * as p from "core/properties"

export namespace Filter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface Filter extends Filter.Attrs {}

export abstract class Filter extends Model {
  declare properties: Filter.Props

  constructor(attrs?: Partial<Filter.Attrs>) {
    super(attrs)
  }

  abstract compute_indices(source: DataSource): Indices
}
