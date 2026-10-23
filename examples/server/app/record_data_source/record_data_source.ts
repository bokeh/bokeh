import type * as p from "@bokehjs/core/properties"
import type {Arrayable, Dict} from "@bokehjs/core/types"
import {dict, to_object} from "@bokehjs/core/util/object"
import {isNumber, isPlainObject} from "@bokehjs/core/util/types"
import type {Index} from "@bokehjs/core/util/templating"
import {IndexedDataSource} from "@bokehjs/models/sources/indexed_data_source"

function lookup(record: Dict<unknown>, path: string): unknown {
  let value: unknown = record
  for (const name of path.split(".")) {
    if (!isPlainObject(value) && !(value instanceof Map)) {
      return undefined
    }
    value = dict(value).get(name)
  }
  return value
}

function leaf_fields(record: Dict<unknown>, prefix: string = ""): string[] {
  const fields: string[] = []
  for (const [name, value] of dict(record)) {
    const field = prefix == "" ? name : `${prefix}.${name}`
    if (isPlainObject(value) || value instanceof Map) {
      fields.push(...leaf_fields(value, field))
    } else {
      fields.push(field)
    }
  }
  return fields
}

export namespace RecordDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = IndexedDataSource.Props & {
    records: p.Property<Dict<unknown>[]>
  }
}

export interface RecordDataSource extends RecordDataSource.Attrs {}

export class RecordDataSource extends IndexedDataSource {
  declare properties: RecordDataSource.Props

  static {
    this.define<RecordDataSource.Props>(({List, Dict, Unknown}) => ({
      records: [ List(Dict(Unknown)), [] ],
    }))
  }

  get_length(): number {
    return this.records.length
  }

  get_field(name: string): Arrayable | null {
    if (!this.fields().includes(name)) {
      return null
    }
    return this.records.map((record) => lookup(record, name))
  }

  get_record(index: Index): {[key: string]: unknown} {
    const i = isNumber(index) ? index : index.index
    return to_object(this.records[i])
  }

  fields(): string[] {
    return [...new Set(this.records.flatMap((record) => leaf_fields(record)))]
  }
}
