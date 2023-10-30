import cp = require("child_process")
import assert = require("assert")
import fs = require("fs")
import path = require("path")

import {PNG} from "pngjs"

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

      if (children != null) {
        descend(children, level+1)
      }
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
  } else {
    return diff_highlight(proc.stdout)
  }
}

function diff_highlight(diff: string): string {
  const hl_path = "/usr/share/doc/git/contrib/diff-highlight/diff-highlight"
  const proc = cp.spawnSync("perl", [hl_path], {input: diff, encoding: "utf8"})
  return proc.status == 0 ? proc.stdout : diff
}

const lfs_header = "version https://git-lfs.github.com/spec/v1\n"

function load_from_lfs(lfs_pointer: string): Buffer | null {
  const [_version_line, oid_line, size_line] = lfs_pointer.split("\n", 3)

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
      return null
    }
  })()

  if (buffer != null) {
    assert(buffer.length == len)
  }

  return buffer
}

export type Baseline = {blf: string | null, png: Buffer | null}

export async function load_baselines(baseline_paths: string[], ref: string): Promise<Baseline[]> {
  const baselines: Baseline[] = []

  let current: Baseline = {blf: null, png: null}
  let type: "blf" | "png" = "blf"

  function reset() {
    current = {blf: null, png: null}
    type = "blf"
  }

  let pending: Buffer | null = null

  function extract_baselines(output: Buffer): void {
    let i = 0
    let j: number

    if (pending != null) {
      output = Buffer.concat([pending, output])
      pending = null
    }

    while ((j = output.indexOf("\n", i)) != -1) {
      const header = output.subarray(i, j).toString()
      const ii = i
      i = j + 1
      if (header.length == 0) {
        continue
      }
      if (!header.endsWith("missing")) {
        //console.log(header)
        const [_sha, _type, size] = header.split(" ", 3)
        const len = Number(size)
        assert(isFinite(len))

        const content = output.subarray(i, i + len)
        if (content.length != len) {
          pending = output.subarray(ii)
          return
        }
        i += len + 1

        if (type == "blf") {
          current.blf = content.toString()
        } else {
          const is_lfs = content.subarray(0, lfs_header.length).toString() == lfs_header
          const buffer = (() => {
            if (is_lfs) {
              return load_from_lfs(content.toString())
            } else {
              return content
            }
          })()
          if (buffer != null) {
            const png = PNG.sync.read(buffer)
            //console.log(`PNG: ${png.width}x${png.height}`)
            assert(png.width != 0 && png.height != 0)
            current.png = buffer
          }
        }
      }

      if (type == "blf") {
        type = "png"
      } else {
        baselines.push(current)
        reset()
      }
    }

    if (i < output.length) {
      pending = output.subarray(i)
    }
  }

  const proc = cp.spawn("git", ["cat-file", "--batch"], {stdio: ["pipe", "pipe", "pipe"]})

  proc.once("exit",    () => proc.kill())
  proc.once("SIGINT",  () => proc.kill("SIGINT"))
  proc.once("SIGTERM", () => proc.kill("SIGTERM"))

  const result = new Promise<Baseline[]>((resolve, reject) => {
    proc.stdout.on("data", (chunk) => {
      extract_baselines(chunk)
    })
    proc.on("error", reject)
    proc.on("exit", (code, _signal) => {
      if (code !== 0) {
        reject()
      } else {
        resolve(baselines)
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
