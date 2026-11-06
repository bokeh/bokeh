import type {Suite, Test} from "./types.js"
import {description, show_tree} from "./format.js"

const MAX_INT32 = 2147483647

class Random {
  private seed: number

  constructor(seed: number) {
    this.seed = seed % MAX_INT32
    if (this.seed <= 0) {
      this.seed += MAX_INT32 - 1
    }
  }

  integer(): number {
    this.seed = (this.seed * 48271) % MAX_INT32
    return this.seed
  }

  float(): number {
    return (this.integer() - 1) / (MAX_INT32 - 1)
  }
}

function shuffle<T>(array: T[], random: {float(): number}): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random.float()*(i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

export type TestCase = [Suite[], Test, TestStatus]

/**
 * Normalizes a test module pattern, so that e.g. `test/unit/core/util/array.ts`,
 * `bokehjs/test/unit/core/util/array.ts` and `core/util/array` are equivalent.
 */
export function normalize_module_pattern(pattern: string, suite?: string): string {
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
export function module_pattern_to_regex(pattern: string): RegExp {
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

export type TestStatus = {
  success?: boolean
  failure?: boolean
  timeout?: boolean
  skipped?: boolean
  errors: string[]
  baseline_name?: string
  baseline?: string
  baseline_diff?: string
  reference?: Buffer
  image?: Buffer
  image_diff?: Buffer
  existing_blf?: string
  existing_png?: Buffer
}

export class TestDiscovery {
  private all_tests: TestCase[] = []
  private selected_tests: TestCase[] = []

  collect_tests(top_level: Suite): void {
    this.all_tests = [...this.iter_tests(top_level)]
  }

  private *iter_tests({suites, tests}: Suite, parents: Suite[] = []): Iterable<TestCase> {
    for (const suite of suites) {
      yield* this.iter_tests(suite, parents.concat(suite))
    }

    for (const test of tests) {
      yield [parents, test, {errors: []}]
    }
  }

  randomize(seed: number): void {
    const random = new Random(seed)
    console.log(`randomizing with seed ${seed}`)
    shuffle(this.all_tests, random)
  }

  validate_descriptions(): string[] {
    const invalid_chars = ['"']
    const errors: string[] = []

    for (const [suites, test] of this.all_tests) {
      const test_description = description(suites, test)
      for (const c of invalid_chars) {
        if (test_description.includes(c)) {
          const output = show_tree(suites, test)
          output.push(`test description contains invalid characters: ${c}`)
          errors.push(output.join("\n"))
        }
      }
    }

    return errors
  }

  get_modules(): Set<string> {
    const modules = new Set<string>()
    for (const [, test] of this.all_tests) {
      if (test.module != null) {
        modules.add(test.module)
      }
    }
    return modules
  }

  apply_filters(
    keyword: string[] | null | undefined,
    grep: string[] | null | undefined,
    skip: string[] | null | undefined,
    file?: string[] | null | undefined,
    suite?: string,
  ): {errors: string[], warnings: string[]} {
    const errors: string[] = []
    const warnings: string[] = []

    if (file != null) {
      const modules = this.get_modules()
      const patterns = file.map((pattern) => {
        const normalized = normalize_module_pattern(pattern, suite)
        return {pattern, regex: module_pattern_to_regex(normalized)}
      })

      for (const {pattern, regex} of patterns) {
        if (![...modules].some((name) => regex.test(name))) {
          errors.push(`--file=${pattern} didn't match any test files`)
        }
      }

      let unattributed = 0
      for (const [, test] of this.all_tests) {
        const name = test.module
        if (name == null) {
          unattributed++
          test.omit = true
        } else if (!patterns.some(({regex}) => regex.test(name))) {
          test.omit = true
        }
      }

      if (unattributed != 0) {
        warnings.push(`${unattributed} test(s) aren't attributed to any file and were deselected`)
      }
    }

    if (keyword != null) {
      const keywords = keyword
      for (const [suites, test] of this.all_tests) {
        if (!keywords.some((keyword) => description(suites, test).includes(keyword))) {
          test.omit = true
        }
      }
    }

    if (grep != null) {
      const regexes = grep.map((re) => new RegExp(re))
      for (const [suites, test] of this.all_tests) {
        if (!regexes.some((regex) => description(suites, test).match(regex) != null)) {
          test.omit = true
        }
      }
    }

    if (skip != null) {
      const descriptions = new Set(skip)
      for (const [suites, test] of this.all_tests) {
        if (descriptions.has(description(suites, test))) {
          test.skip = true
        }
      }
    }

    this.selected_tests = this.all_tests.filter(([, test]) => test.omit !== true)
    return {errors, warnings}
  }

  get_all_tests(): TestCase[] {
    return this.all_tests
  }

  get_selected_tests(): TestCase[] {
    return this.selected_tests
  }

  get_counts(): {all: number, selected: number} {
    return {
      all: this.all_tests.length,
      selected: this.selected_tests.length,
    }
  }
}
