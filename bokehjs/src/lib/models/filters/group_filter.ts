import {Filter} from "./filter"
import type * as p from "core/properties"
import {Indices} from "core/types"
import {logger} from "core/logging"
import {Comparator} from "core/util/eq"
import type {IndexedDataSource} from "../sources/indexed_data_source"

export namespace GroupFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    field_name: p.Property<string>
    group: p.Property<unknown>
  }
}

export interface GroupFilter extends GroupFilter.Attrs {}

export class GroupFilter extends Filter {
  declare properties: GroupFilter.Props

  static {
    this.define<GroupFilter.Props>(({Str, Unknown}) => ({
      field_name: [ Str ],
      group:      [ Unknown ],
    }))
  }

  compute_indices(source: IndexedDataSource): Indices {
    const field = source.get_field(this.field_name)
    const size = source.get_length() ?? 1
    if (field == null) {
      logger.warn(`${this}: group field '${this.field_name}' not found in the data source`)
      return Indices.all_set(size)
    } else {
      const indices = new Indices(size, 0)
      const cmp = new Comparator()
      for (let i = 0; i < indices.size; i++) {
        if (cmp.eq(field[i], this.group)) {
          indices.set(i)
        }
      }
      return indices
    }
  }
}
