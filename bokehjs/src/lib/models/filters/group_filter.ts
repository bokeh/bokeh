import {Filter} from "./filter"
import * as p from "core/properties"
import {logger} from "core/logging"
import {range} from "core/util/array"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace GroupFilter {
  export interface Attrs extends Filter.Attrs {
    column_name: string
    group: string
  }

  export interface Props extends Filter.Props {}
}

export interface GroupFilter extends GroupFilter.Attrs {}

export class GroupFilter extends Filter {

  properties: GroupFilter.Props

  constructor(attrs?: Partial<GroupFilter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'GroupFilter'

    this.define({
      column_name: [ p.String  ],
      group:       [ p.String  ],
    })
  }

  indices: number[] | null = null

  compute_indices(source: ColumnarDataSource): number[] | null {
    const column = source.get_column(this.column_name)
    if (column == null) {
      logger.warn("group filter: groupby column not found in data source")
      return null
    } else {
      this.indices = range(0, source.get_length() || 0).filter((i) => column[i] === this.group)
      if (this.indices.length === 0) {
        logger.warn(`group filter: group '${this.group}' did not match any values in column '${this.column_name}'`)
      }
      return this.indices
    }
  }
}
GroupFilter.initClass()
