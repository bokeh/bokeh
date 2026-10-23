import {Model} from "../../model"
import type {IndexedDataSource} from "../sources/indexed_data_source"
import type {Indices} from "core/types"
import type * as p from "core/properties"

export namespace Filter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface Filter extends Filter.Attrs {}

export abstract class Filter extends Model {
  declare properties: Filter.Props

  abstract compute_indices(source: IndexedDataSource): Indices
}
