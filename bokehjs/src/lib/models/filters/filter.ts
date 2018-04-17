import {Model} from "../../model"
import {DataSource} from "../sources/data_source"
import * as p from "core/properties"
import {isBoolean, isInteger, isArrayOf} from "core/util/types"
import {range} from "core/util/array"
import {logger} from "core/logging"

export namespace Filter {
  export interface Attrs extends Model.Attrs {
    filter: boolean[] | number[] | null
  }

  export interface Props extends Model.Props {}
}

export interface Filter extends Filter.Attrs {}

export class Filter extends Model {

  properties: Filter.Props

  constructor(attrs?: Partial<Filter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Filter'

    this.define({
      filter: [ p.Array, null ],
    })
  }

  compute_indices(_source: DataSource): number[] | null {
    const filter = this.filter
    if (filter != null && filter.length >= 0) {
      if (isArrayOf(filter, isBoolean)) {
        return range(0, filter.length).filter((i) => filter[i] === true)
      }
      if (isArrayOf(filter, isInteger)) {
        return filter
      }
      logger.warn(`Filter ${this.id}: filter should either be array of only booleans or only integers, defaulting to no filtering`)
      return null
    } else {
      logger.warn(`Filter ${this.id}: filter was not set to be an array, defaulting to no filtering`)
      return null
    }
  }
}
Filter.initClass()
