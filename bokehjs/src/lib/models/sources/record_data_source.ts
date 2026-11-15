import type * as p from "core/properties"
import type {Arrayable, Dict, PlainObject} from "core/types"
import {dict, keys} from "core/util/object"
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
    for (const [index, line] of text.replace(/^\uFEFF/, "").split(/\r?\n/).entries()) {
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

  override connect_signals(): void {
    this.connect(this.data_changed, () => this._invalidate_fields())
    super.connect_signals()
    this.connect(this.properties.records.change, () => this.data_changed.emit({structural: true}))
    this.connect(this.change, () => {
      // Property updates already emit the corresponding data event.
      if (!this._setting_properties) {
        this.data_changed.emit({structural: true})
      }
    })
  }

  get_length(): number {
    return this.records.length
  }

  override get data_change_signals(): (typeof this.data_changed)[] {
    return [this.data_changed]
  }

  override get missing_group_field_policy(): MissingGroupFieldPolicy {
    // A field can disappear when records are replaced.
    return "match_none"
  }

  private readonly _fields = new Map<string, Arrayable>()
  private _field_records: RecordDataSource["records"] | undefined

  private _invalidate_fields(): void {
    this._fields.clear()
    this._field_records = this.records
  }

  get_field(name: string): Arrayable | null {
    if (this._field_records !== this.records) {
      this._invalidate_fields()
    }
    const cached = this._fields.get(name)
    if (cached !== undefined) {
      return cached
    }

    const field = this._materialize_field(name)
    if (field != null && this.records.length != 0) {
      this._fields.set(name, field)
    }
    return field
  }

  private _materialize_field(name: string): Arrayable | null {
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

  private _record_at(index: Index): Dict<unknown> | undefined {
    return this.records[isNumber(index) ? index : index.index]
  }

  override get_field_value(name: string, index: Index): unknown {
    const row = this._record_at(index)
    return row === undefined ? undefined : dict(row).get(name)
  }

  get_record(index: Index): PlainObject {
    const row = this._record_at(index)
    return row === undefined ? {} : Object.fromEntries(dict(row).entries())
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
