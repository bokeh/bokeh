import {Filter} from "./filter"
import type * as p from "core/properties"
import {Indices} from "core/types"
import {logger} from "core/logging"
import {Comparator} from "core/util/eq"
import {isArray} from "core/util/types"
import type {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace GroupFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    column_name: p.Property<string>
    group: p.Property<unknown>
    multiple: p.Property<boolean>
  }
}

export interface GroupFilter extends GroupFilter.Attrs {}

export class GroupFilter extends Filter {
  declare properties: GroupFilter.Props

  constructor(attrs?: Partial<GroupFilter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<GroupFilter.Props>(({Bool, Str, Unknown}) => ({
      column_name: [ Str ],
      group:       [ Unknown ],
      multiple:    [ Bool, false ],
    }))
  }

  compute_indices(source: ColumnarDataSource): Indices {
    const column = source.get_column(this.column_name)
    const size = source.get_length() ?? 1
    if (column == null) {
      logger.warn(`${this}: groupby column '${this.column_name}' not found in the data source`)
      return Indices.all_set(size)
    } else {
      const indices = new Indices(size, 0)
      const cmp = new Comparator()
      const {group, multiple} = this
      const query = (() => {
        if (multiple && isArray(group)) {
          return (value: unknown) => group.some((item) => cmp.eq(value, item))
        } else {
          return (value: unknown) => cmp.eq(value, group)
        }
      })()
      for (let i = 0; i < indices.size; i++) {
        if (query(column[i])) {
          indices.set(i)
        }
      }
      return indices
    }
  }
}
