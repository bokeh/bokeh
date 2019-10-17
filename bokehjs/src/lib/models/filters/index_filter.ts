import {Filter} from "./filter"
import * as p from "core/properties"
import {logger} from "core/logging"
import {isInteger} from "core/util/types"
import {every} from "core/util/array"
import {DataSource} from "../sources/data_source"

export namespace IndexFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    indices: p.Property<number[] | null>
  }
}

export interface IndexFilter extends IndexFilter.Attrs {}

export class IndexFilter extends Filter {
  properties: IndexFilter.Props

  constructor(attrs?: Partial<IndexFilter.Attrs>) {
    super(attrs)
  }

  static init_IndexFilter(): void {
    this.define<IndexFilter.Props>({
      indices: [ p.Array, null ],
    })
  }

  compute_indices(_source: DataSource): number[] | null {
    if (this.indices != null && this.indices.length >= 0) {
      if (every(this.indices, isInteger))
        return this.indices
      else {
        logger.warn(`IndexFilter ${this.id}: indices should be array of integers, defaulting to no filtering`)
        return null
      }
    } else {
      logger.warn(`IndexFilter ${this.id}: indices was not set, defaulting to no filtering`)
      return null
    }
  }
}
