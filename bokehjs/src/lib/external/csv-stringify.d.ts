declare module "csv-stringify/browser/esm/sync" {

  export type Callback = (err: Error | undefined, output: string) => void
  export type RecordDelimiter = string | "unix" | "mac" | "windows" | "ascii" | "unicode"

  export type CastReturnObject = { value: string } & Pick<Options,
  | "delimiter"
  | "escape"
  | "quote"
  | "quoted"
  | "quoted_empty"
  | "quoted_string"
  | "quoted_match"
  | "record_delimiter"
  >

  export type Cast<T> = (
    value: T,
    context: CastingContext
  ) => string | CastReturnObject

  export type PlainObject<T> = Record<string, T>
  export type Input = any[]
  export interface ColumnOption {
    key: string
    header?: string
  }
  export interface CastingContext {
    readonly column?: number | string
    readonly header: boolean
    readonly index: number
    readonly records: number
  }
  export interface Options {
    /**
     * Prepend the byte order mark (BOM) to the output stream.
     */
    bom?: boolean
    /**
     * Key-value object which defines custom cast for certain data types
     */
    cast?: {
      boolean?: Cast<boolean>
      date?: Cast<Date>
      number?: Cast<number>
      bigint?: Cast<bigint>
      /**
       * Custom formatter for generic object values
       */
      object?: Cast<Record<string, any>>
      string?: Cast<string>
    }
    /**
     * List of fields, applied when `transform` returns an object
     * order matters
     * read the transformer documentation for additionnal information
     * columns are auto discovered in the first record when the user write objects
     * can refer to nested properties of the input JSON
     * see the "header" option on how to print columns names on the first line
     */
    columns?: readonly string[] | PlainObject<string> | readonly ColumnOption[]
    /**
     * Set the field delimiter, one character only, defaults to a comma.
     */
    delimiter?: string | Buffer
    /**
     * Add the value of "options.RecordDelimiter" on the last line, default to true.
     */
    eof?: boolean
    /**
     * Defaults to the escape read option.
     */
    escape?: string | Buffer
    /**
     * Display the column names on the first line if the columns option is provided or discovered.
     */
    header?: boolean
    /**
     * The quote characters, defaults to the ", an empty quote value will preserve the original field.
     */
    quote?: string | Buffer | boolean
    /**
     * Boolean, default to false, quote all the non-empty fields even if not required.
     */
    quoted?: boolean

    /**
     * Boolean, no default, quote empty fields and overrides `quoted_string` on empty strings when defined.
     */
    quoted_empty?: boolean
    /**
     * String or RegExp, no default, quote all fields matching a regular expression.
     */
    quoted_match?: string | RegExp | (string | RegExp)[]
    /**
     * Boolean, default to false, quote all fields of type string even if not required.
     */
    quoted_string?: boolean
    /**
     * String used to delimit record rows or a special value
     * special values are "unix", "mac", "windows", "ascii", "unicode"
     * defaults to "\n".
     */
    record_delimiter?: RecordDelimiter
    /**
     * Boolean, default to false, if true, fields that begin with `=`, `+`, `-`, `@`, `\t`, or `\r` will be prepended with a `"` to protected agains csv injection attacks
     */
    escape_formulas?: boolean
  }

  declare function stringify(input: Input, options?: Options): string

  export {stringify, Options}
}
