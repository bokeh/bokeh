import chalk from "chalk"
import type {Suite, Test} from "./types.js"

/**
 * Test errors come from the browser, where assertions mark diffs with ANSI
 * colors (red for removed, bright green for added text). Keep them when the
 * output supports colors, otherwise replace them with plain-text markers
 * (`[-removed-]` and `{+added+}`), so the diff remains readable.
 */
export function render_ansi(text: string, color: boolean = chalk.level > 0): string {
  if (color) {
    return text
  }
  return text
    .replace(/\x1b\[31m(.*?)\x1b\[0m/gs, "[-$1-]")
    .replace(/\x1b\[92m(.*?)\x1b\[0m/gs, "{+$1+}")
    .replace(/\x1b\[[0-9;]*m/g, "")
}

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
