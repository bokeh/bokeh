import type {Suite, Test} from "./types"
import {description, show_tree} from "./format"
import {Random} from "../../src/lib/core/util/random"

function shuffle<T>(array: T[], random: {float(): number}): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random.float()*(i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

export type TestCase = [Suite[], Test, TestStatus]

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

  apply_filters(keyword: string[] | null | undefined, grep: string[] | null | undefined): void {
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

    this.selected_tests = this.all_tests.filter(([, test]) => test.omit !== true)
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
