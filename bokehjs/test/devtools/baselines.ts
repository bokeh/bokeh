import cp = require("child_process")

export type Box = {x: number, y: number, width: number, height: number}
export type State = {type: string, bbox?: Box, children?: State[]}

export function create_baseline(items: State[]): string {
  let baseline = ""

  function descend(items: State[], level: number): void {
    for (const {type, bbox, children} of items) {
      baseline += `${"  ".repeat(level)}${type}`

      if (bbox != null) {
        const {x, y, width, height} = bbox
        baseline += ` bbox=[${x}, ${y}, ${width}, ${height}]`
      }

      baseline += "\n"

      if (children != null)
        descend(children, level+1)
    }
  }

  descend(items, 0)
  return baseline
}

export function load_baseline(baseline_path: string): string | null {
  const proc = cp.spawnSync("git", ["show", `:./${baseline_path}`], {encoding: "utf-8"})
  return proc.status == 0 ? proc.stdout : null
}

export function load_baseline_image(image_path: string): Buffer | null {
  const proc = cp.spawnSync("git", ["show", `:./${image_path}`], {encoding: "buffer"})
  return proc.status == 0 ? proc.stdout : null
}

function git(...args: string[]): cp.SpawnSyncReturns<string> {
  return cp.spawnSync("git", [...args], {encoding: "utf8"})
}

export function diff_baseline(baseline_path: string): string {
  const proc = git("diff", "--color", "--exit-code", baseline_path)
  if (proc.status == 0) {
    const proc = git("diff", "--color", "/dev/null", baseline_path)
    return proc.stdout
  } else
    return diff_highlight(proc.stdout)
}

function diff_highlight(diff: string): string {
  const hl_path = "/usr/share/doc/git/contrib/diff-highlight/diff-highlight"
  const proc = cp.spawnSync("perl", [hl_path], {input: diff, encoding: "utf8"})
  return proc.status == 0 ? proc.stdout : diff
}
