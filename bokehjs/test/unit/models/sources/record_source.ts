import type * as p from "@bokehjs/core/properties"
import type {Arrayable, Dict, PlainObject} from "@bokehjs/core/types"
import type {Index} from "@bokehjs/core/util/templating"
import {dict, to_object} from "@bokehjs/core/util/object"
import {isNumber} from "@bokehjs/core/util/types"
import {IndexedDataSource} from "@bokehjs/models/sources/indexed_data_source"

export namespace RecordSource {
  export type Props = IndexedDataSource.Props & {records: p.Property<Dict<unknown>[]>}
  export type Attrs = p.AttrsOf<Props>
}
export interface RecordSource extends RecordSource.Attrs {}

// Deliberately stores records, with no data property or columnar source parent.
export class RecordSource extends IndexedDataSource {
  declare properties: RecordSource.Props
  readonly requested_fields = new Set<string>()

  static {
    this.define<RecordSource.Props>(({List, Dict, Unknown}) => ({
      records: [ List(Dict(Unknown)), [] ],
    }))
  }

  get_length(): number {
    return this.records.length
  }

  get_field(name: string): Arrayable | null {
    this.requested_fields.add(name)
    return this.fields().includes(name) ? this.records.map((record) => dict(record).get(name)) : null
  }

  get_record(index: Index): PlainObject {
    return to_object(this.records[isNumber(index) ? index : index.index])
  }

  fields(): string[] {
    return [...new Set(this.records.flatMap((record) => [...dict(record).keys()]))]
  }
}
