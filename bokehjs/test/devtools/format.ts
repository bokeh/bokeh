import chalk from "chalk"
import type {Suite, Test} from "./types.js"

export function descriptions(suites: Suite[], test: Test): string[] {
  return [...suites, test].map((obj) => obj.description)
}

export function description(suites: Suite[], test: Test, sep: string = " "): string {
  return descriptions(suites, test).join(sep)
}

export function encode(s: string): string {
  return s.replace(/[ \/\[\]:]/g, "_")
}

export function show_tree(suites: Suite[], test: Test): string[] {
  const output = []
  let depth = 0
  for (const suite of [...suites, test]) {
    const is_last = depth == suites.length
    const prefix = depth == 0 ? chalk.red("\u2717") : `${" ".repeat(depth)}\u2514${is_last ? "\u2500" : "\u252c"}\u2500`
    output.push(`${prefix} ${suite.description}`)
    depth++
  }
  return output
}
