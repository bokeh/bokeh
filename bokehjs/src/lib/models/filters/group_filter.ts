import {Filter} from "./filter"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import {SimilarComparator} from "core/util/eq"
import {isArray} from "core/util/types"
import type * as p from "core/properties"
import {Indices} from "core/types"
import {logger} from "core/logging"
import {Or, List, Primitive} from "core/kinds"

const GroupBy = Or(List(Primitive), Primitive)
type GroupBy = typeof GroupBy["__type__"]

export namespace GroupFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    column_name: p.Property<string>
    group: p.Property<GroupBy>
    // TODO: tolerance for FP
  }
}

export interface GroupFilter extends GroupFilter.Attrs {}

export class GroupFilter extends Filter {
  declare properties: GroupFilter.Props

  constructor(attrs?: Partial<GroupFilter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<GroupFilter.Props>(({String}) => ({
      column_name: [ String ],
      group:       [ GroupBy ],
    }))
  }

  compute_indices(source: ColumnarDataSource): Indices {
    const {column_name} = this
    const column = source.get_column(column_name)
    const size = source.get_length() ?? 1
    if (column == null) {
      logger.warn(`${this}: column '${column_name}' not found in the data source`)
      return Indices.all_set(size)
    } else {
      const group = (() => {
        const {group} = this
        return isArray(group) ? group : [group]
      })()
      const indices = Indices.all_unset(size)
      const cmp = new SimilarComparator()
      for (let i = 0; i < indices.size; i++) {
        if (group.some((value) => cmp.eq(column[i], value))) {
          indices.set(i)
        }
      }
      return indices
    }
  }
}
