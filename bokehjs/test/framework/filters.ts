/**
 * Test selection filters shared by the command line (devtools) and URL (`/unit/run?k=...`)
 * test runners. Multiple values of the same filter are combined with OR, and different
 * filters are combined with AND.
 */
export type Filters = {
  /** substrings of test descriptions (`-k`, `--keyword`, `?k=`) */
  keyword?: string[] | null
  /** regular expressions matching test descriptions (`-g`, `--grep`, `?g=`) */
  grep?: string[] | null
  /** file names or glob patterns of test modules (`-f`, `--file`, `?f=`) */
  file?: string[] | null
}

export type FilterResult = {
  errors: string[]
  warnings: string[]
}

export type TestInfo = {
  description: string
  module?: string
}

/**
 * Normalizes a test file pattern, so that e.g. `test/unit/core/util/array.ts`,
 * `bokehjs/test/unit/core/util/array.ts` and `core/util/array` are equivalent.
 */
export function normalize_file_pattern(pattern: string, suite?: string): string {
  let result = pattern.replace(/\\/g, "/").replace(/^\.\//, "")
  if (suite != null) {
    const match = result.match(new RegExp(`(^|/)test/${suite}/(.*)$`))
    if (match != null) {
      result = match[2]
    }
  }
  return result.replace(/\.(ts|tsx|js)$/, "").replace(/\/+$/, "")
}

/**
 * Converts a glob pattern (supports `*`, `**`, `?`, `[...]` and `{a,b}`) to a regular
 * expression. A pattern also matches everything under it, if it names a directory.
 * A pattern without `/` matches file or directory names at any depth (e.g. `*arr*`
 * matches `core/util/array`), otherwise it's anchored at the root of a test suite.
 */
export function file_pattern_to_regex(pattern: string): RegExp {
  let re = ""
  let in_braces = 0
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]
    switch (c) {
      case "*": {
        if (pattern[i + 1] == "*") {
          i++
          if (pattern[i + 1] == "/") {
            i++
            re += "(?:.*/)?"
          } else {
            re += ".*"
          }
        } else {
          re += "[^/]*"
        }
        break
      }
      case "?": {
        re += "[^/]"
        break
      }
      case "[": {
        const end = pattern.indexOf("]", i + 1)
        if (end == -1) {
          re += "\\["
        } else {
          const body = pattern.slice(i + 1, end).replace(/^!/, "^").replace(/\\/g, "\\\\")
          re += `[${body}]`
          i = end
        }
        break
      }
      case "{": {
        in_braces++
        re += "(?:"
        break
      }
      case "}": {
        if (in_braces > 0) {
          in_braces--
          re += ")"
        } else {
          re += "\\}"
        }
        break
      }
      case ",": {
        re += in_braces > 0 ? "|" : ","
        break
      }
      default: {
        re += c.replace(/[.+^${}()|\\]/g, "\\$&")
      }
    }
  }
  // like in .gitignore, a pattern without a slash matches at any depth
  const prefix = pattern.includes("/") ? "" : "(?:.*/)?"
  return new RegExp(`^${prefix}${re}(?:/.*)?$`)
}

function non_empty(values: string[] | null | undefined): string[] | null {
  return values != null && values.length != 0 ? values : null
}

/**
 * Determines which tests match the given filters. Returns a mask of selected
 * tests (in the order of `tests`), and errors and warnings for reporting.
 */
export function select_tests(tests: TestInfo[], filters: Filters, suite?: string): FilterResult & {selected: boolean[]} {
  const errors: string[] = []
  const warnings: string[] = []

  const keyword = non_empty(filters.keyword)
  const grep = non_empty(filters.grep)
  const file = non_empty(filters.file)

  type Predicate = (test: TestInfo) => boolean
  const predicates: Predicate[] = []

  if (file != null) {
    const modules = new Set<string>()
    for (const test of tests) {
      if (test.module != null) {
        modules.add(test.module)
      }
    }

    const regexes = file.map((pattern) => {
      const regex = file_pattern_to_regex(normalize_file_pattern(pattern, suite))
      if (![...modules].some((name) => regex.test(name))) {
        errors.push(`file pattern '${pattern}' didn't match any test files`)
      }
      return regex
    })

    const unattributed = tests.filter((test) => test.module == null).length
    if (unattributed != 0) {
      warnings.push(`${unattributed} test(s) aren't attributed to any file and were deselected`)
    }

    predicates.push(({module}) => module != null && regexes.some((regex) => regex.test(module)))
  }

  if (keyword != null) {
    predicates.push(({description}) => keyword.some((keyword) => description.includes(keyword)))
  }

  if (grep != null) {
    const regexes: RegExp[] = []
    for (const pattern of grep) {
      try {
        regexes.push(new RegExp(pattern))
      } catch (error) {
        errors.push(`invalid grep pattern '${pattern}': ${error instanceof Error ? error.message : error}`)
      }
    }
    predicates.push(({description}) => regexes.some((regex) => regex.test(description)))
  }

  const selected = tests.map((test) => predicates.every((predicate) => predicate(test)))
  return {selected, errors, warnings}
}
