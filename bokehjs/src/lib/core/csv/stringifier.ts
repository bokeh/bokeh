import type {
  Options,
  NormalizedOptions,
  Record as CSVRecord,
  CastContext,
} from "./types"
import {normalize_options} from "./normalize_options"

export class Stringifier {
  options: NormalizedOptions

  constructor(options: Options) {
    this.options = normalize_options(options)
  }

  // Create the full CSV string that can be written to a .csv file
  stringify(records: Iterable<CSVRecord>): string {
    let result = ""
    let first_row
    let row_index = 0
    for (const record of records) {
      if (row_index === 0) {
        first_row = record
      }
      const context = {first_row, row_index, column_index: 0}
      result += this.stringify_record(record, context)
      result += "\n"
      row_index++
    }
    return result
  }

  // Create string for a single record (row) of CSV data. Do not include the
  // record delimiter. Example usage:
  //
  //    stringify_record(['foo', 1])
  //    > 'foo,1'
  stringify_record(record: unknown[], context: CastContext): string {
    const fields = []
    for (let column_index = 0; column_index < record.length; column_index++) {
      const field = record[column_index]
      context.column_index = column_index
      const field_as_string = this.cast(field, context)
      if (typeof field_as_string !== "string") {
        throw new Error(
          `Invalid Casting Value: string cast function must return a string, got ${JSON.stringify(
            field,
          )}`,
        )
      }
      fields.push(this.quote(this.escape(field_as_string)))
    }
    return fields.join(",")
  }

  // Convert the CSV field to a string
  private cast(field: unknown, context: CastContext): string {
    return this.options.cast(field, context)
  }

  // Any quotes inside a CSV field must be escaped with a quote. Example usage:
  //
  //    escape('{"a":1}')
  //    > '{""a"":1}'
  //
  // Important! Because this function looks for quotes, it must be called before
  // the quote function.
  private escape(field: string): string {
    return field.replace(/"/g, '""')
  }

  // If the CSV field contains any of a certain set characters, then the entire
  // field must by quoted. Example usage:
  //
  //    quote('{""a"":1}')
  //    > '"{""a"":1}"'
  //
  //    quote('New York, NY')
  //    > '"New York, NY"'
  private quote(field: string): string {
    if (/[",\n]/.test(field)) {
      return `"${field}"`
    }
    return field
  }
}

/* Example usage:

  stringify(
    [
      ["x", "y"],
      [5, 25],
    ]
  )
  > 'x,y\n5,25\n'
*/
export function stringify(records: Iterable<CSVRecord>, options: Options = {}) {
  const stringifier = new Stringifier(options)
  return stringifier.stringify(records)
}
