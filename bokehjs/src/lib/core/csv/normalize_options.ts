import type {NormalizedOptions, Options} from "./types"
import {CsvError} from "./csv_error"
import {default_cast} from "./cast"

export function normalize_options(opts: Options): NormalizedOptions {
  const options: Options = {...opts}

  // Normalize option `cast`
  if (options.cast === undefined) {
    options.cast = default_cast
  } else if (typeof options.cast !== "function") {
    throw new CsvError("CSV_OPTION_CAST_INVALID_TYPE", [
      "option `cast` must be a function,",
      `got ${JSON.stringify(options.cast)}`,
    ])
  }

  return options as NormalizedOptions
}
