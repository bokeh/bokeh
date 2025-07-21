// In CSV, a record means a row of data
export type Record = any[]

export type CastContext = {
  first_row?: unknown[]
  column_index?: number
  row_index?: number
}

// The cast function takes a field from a record and turns it into a string. The
// column name, record count, and column index and passed to the cast function.
export type Cast = (field: unknown, context: CastContext) => string

export interface Options {
  cast?: Cast
}

export type NormalizedOptions = Required<Options>
