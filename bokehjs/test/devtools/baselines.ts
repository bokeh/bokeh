import cp = require("child_process")
import assert = require("assert")
import fs = require("fs")
import path = require("path")

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

export type Baseline = {blf: string | null, png: Buffer | null}

export async function load_baselines(baseline_paths: string[], ref: string): Promise<Baseline[]> {
  const proc = cp.spawn("git", ["cat-file", "--batch", "--buffer"], {stdio: ["pipe", "pipe", "pipe"]})

  proc.once("exit",    () => proc.kill())
  proc.once("SIGINT",  () => proc.kill("SIGINT"))
  proc.once("SIGTERM", () => proc.kill("SIGTERM"))

  function extract(output: string): Baseline[] {
    let i = 0
    let j: number

    const baselines: Baseline[] = []
    let current: Baseline = {blf: null, png: null}
    let type: "blf" | "png" = "blf"

    while ((j = output.indexOf("\n", i)) != -1) {
      const header = output.substring(i, j)
      i = j + 1
      if (!header.endsWith("missing")) {
        const [_sha, _type, size] = header.split(" ", 3)
        const len = Number(size)
        assert(isFinite(len))

        const content = output.substring(i, i + len)
        i += len + 1

        if (!content.startsWith("version https://git-lfs.github.com/spec/v1\n")) {
          current.blf = content
        } else {
          const [_version_line, oid_line, size_line] = content.split("\n", 3)

          const [, oid] = oid_line.split(" ", 2)
          const [sha_type, sha] = oid.split(":")
          assert(sha_type == "sha256")

          const [, size] = size_line.split(" ", 2)
          const len = Number(size)
          assert(isFinite(len))

          const b0 = sha.substring(0, 2)
          const b1 = sha.substring(2, 4)

          const lfs_path = path.resolve(`../.git/lfs/objects/${b0}/${b1}/${sha}`)

          const buffer = (() => {
            try {
              return fs.readFileSync(lfs_path)
            } catch (error) {
              console.log(error)
              return null
            }
          })()

          if (buffer != null) {
            assert(buffer.length == len)
            current.png = buffer
          }
        }
      }

      if (type == "blf") {
        type = "png"
      } else {
        baselines.push(current)
        current = {blf: null, png: null}
        type = "blf"
      }
    }

    return baselines
  }

  let output = ""
  const result = new Promise<Baseline[]>((resolve, reject) => {
    proc.stdout.on("data", (chunk) => {
      output += `${chunk}`
    })
    proc.on("error", reject)
    proc.on("exit", (code, _signal) => {
      if (code !== 0) {
        reject()
      } else {
        resolve(extract(output))
      }
    })
  })

  const batch = proc.stdin

  for (const path of baseline_paths) {
    const baseline_path = path.startsWith("./") ? path : `./${path}`
    const blf_file = `${baseline_path}.blf`
    const png_file = `${baseline_path}.png`
    batch.write(`${ref}:./${blf_file}\n`)
    batch.write(`${ref}:./${png_file}\n`)
  }
  batch.end()

  return result
}
