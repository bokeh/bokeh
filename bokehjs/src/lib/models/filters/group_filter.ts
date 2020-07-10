import {Filter} from "./filter"
import * as p from "core/properties"
import {Indices} from "core/types"
import {logger} from "core/logging"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace GroupFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    column_name: p.Property<string>
    group: p.Property<string>
  }
}

export interface GroupFilter extends GroupFilter.Attrs {}

export class GroupFilter extends Filter {
  properties: GroupFilter.Props

  constructor(attrs?: Partial<GroupFilter.Attrs>) {
    super(attrs)
  }

  static init_GroupFilter(): void {
    this.define<GroupFilter.Props>({
      column_name: [ p.String ],
      group:       [ p.String ],
    })
  }

  compute_indices(source: ColumnarDataSource): Indices {
    const column = source.get_column(this.column_name)
    if (column == null) {
      logger.warn(`${this}: groupby column '${this.column_name}' not found in the data source`)
      return new Indices(source.length, 1)
    } else {
      const indices = new Indices(source.length)
      for (let i = 0; i < indices.size; i++) {
        if (column[i] === this.group)
          indices.set(i)
      }
      return indices
    }
  }
}
