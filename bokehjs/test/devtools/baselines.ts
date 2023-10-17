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

export function load_baseline(baseline_path: string, ref: string): string | null {
  const proc = cp.spawnSync("git", ["show", `${ref}:./${baseline_path}`], {encoding: "utf-8"})
  return proc.status == 0 ? proc.stdout : null
}

export function cat_blob(image_path: string, ref: string): Buffer | null {
  const proc = cp.spawnSync("git", ["cat-file", "blob", `${ref}:./${image_path}`], {encoding: "buffer"})
  return proc.status == 0 ? proc.stdout : null
}

export function lfs_smudge(input: Buffer): Buffer | null {
  const proc = cp.spawnSync("git", ["lfs", "smudge"], {input, encoding: "buffer"})
  return proc.status == 0 ? proc.stdout : null
}

export function load_baseline_image(image_path: string, ref: string): Buffer | null {
  const blob = cat_blob(image_path, ref)
  return blob != null ? lfs_smudge(blob) : null
}

function git(...args: string[]): cp.SpawnSyncReturns<string> {
  return cp.spawnSync("git", [...args], {encoding: "utf8"})
}

export function diff_baseline(baseline_path: string, ref: string): string {
  const proc = git("diff", "--color", "--exit-code", ref, "--", baseline_path)
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
