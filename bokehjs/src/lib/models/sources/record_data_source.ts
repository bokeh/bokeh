import type * as p from "core/properties"
import type {Arrayable, Dict, PlainObject} from "core/types"
import {dict, keys, to_object} from "core/util/object"
import type {Index} from "core/util/templating"
import {isArray, isNumber, isObject, isPlainObject} from "core/util/types"
import {IndexedDataSource} from "./indexed_data_source"
import type {MissingGroupFieldPolicy} from "./indexed_data_source"

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

  /** Parse JSON Lines text with one row object per nonblank line. */
  static from_jsonl(text: string): RecordDataSource {
    const records: Dict<unknown>[] = []
    for (const [index, line] of text.split(/\r?\n/).entries()) {
      if (line.trim() == "") {
        continue
      }
      let record: unknown
      try {
        record = JSON.parse(line)
      } catch (error) {
        throw new SyntaxError(`JSON Lines, line ${index + 1}: invalid JSON`, {cause: error})
      }
      if (!isObject(record) || isArray(record)) {
        throw new SyntaxError(`JSON Lines, line ${index + 1}: expected a JSON object`)
      }
      // An own constructor key can prevent the row from being recognized as a plain object.
      records.push(isPlainObject(record) ? record : new Map(Object.entries(record)))
    }
    return this.create({records})
  }

  get_length(): number {
    return this.records.length
  }

  override get missing_group_field_policy(): MissingGroupFieldPolicy {
    // A field can disappear when records are replaced.
    return "match_none"
  }

  get_field(name: string): Arrayable | null {
    if (this.records.length == 0) {
      // Supply empty arrays for field specs while the source is waiting for rows.
      return []
    }
    let found = false
    const values: unknown[] = []
    for (const record of this.records) {
      const row = dict(record)
      found ||= row.has(name)
      values.push(row.get(name))
    }
    return found ? values : null
  }

  get_record(index: Index): PlainObject {
    const row = this.records[isNumber(index) ? index : index.index] as Dict<unknown> | undefined
    return row === undefined ? {} : to_object(row)
  }

  fields(): string[] {
    const fields = new Set<string>()
    for (const record of this.records) {
      for (const name of keys(record)) {
        fields.add(name)
      }
    }
    return [...fields]
  }
}
