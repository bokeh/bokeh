import {Filter} from "./filter"
import * as p from "core/properties"
import {logger} from "core/logging"
import {range, every} from "core/util/array"
import {isBoolean} from "core/util/types"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace BooleanFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    booleans: p.Property<boolean[] | null>
  }
}

export interface BooleanFilter extends BooleanFilter.Attrs {}

export class BooleanFilter extends Filter {
  properties: BooleanFilter.Props

  constructor(attrs?: Partial<BooleanFilter.Attrs>) {
    super(attrs)
  }

  static init_BooleanFilter(): void {
    this.define<BooleanFilter.Props>({
      booleans: [ p.Array, null ],
    })
  }

  compute_indices(source: ColumnarDataSource): number[] | null {
    const booleans = this.booleans
    if (booleans != null && booleans.length > 0) {
      if (every(booleans, isBoolean)) {
        if (booleans.length !== source.get_length()) {
          logger.warn(`BooleanFilter ${this.id}: length of booleans doesn't match data source`)
        }
        return range(0, booleans.length).filter((i) => booleans[i] === true)
      } else {
        logger.warn(`BooleanFilter ${this.id}: booleans should be array of booleans, defaulting to no filtering`)
        return null
      }
    } else {
      if (booleans != null && booleans.length == 0)
        logger.warn(`BooleanFilter ${this.id}: booleans is empty, defaulting to no filtering`)
      else
        logger.warn(`BooleanFilter ${this.id}: booleans was not set, defaulting to no filtering`)
      return null
    }
  }
}
