#!/usr/bin/env node

import {spawn, spawnSync} from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import {fileURLToPath} from "node:url"

const chrome_version = "141.0.7390.54"
const canonical_image = "ghcr.io/bokeh/bokehjs-baselines@sha256:9163c9791b4a5ee80f60344441a16133d7324ece4911550e5fb5b20c4e60db71"
const local_image = `bokehjs-baselines-local:${chrome_version}`

function usage(stream = process.stdout) {
  stream.write(`\
Usage:
  node bokehjs/test/run-baseline-tests.mjs [run] [test arguments...]
  node bokehjs/test/run-baseline-tests.mjs review [--port PORT]
  node bokehjs/test/run-baseline-tests.mjs accept

Commands:
  run      Run visual tests and write new or updated Linux baselines into the
           current checkout. This is the default when the command is omitted.
  review   Serve the most recent completed visual report at
           http://127.0.0.1:5777.
  accept   Stage changed Linux .blf and .png files represented by the most
           recent completed report.

Environment:
  BOKEHJS_CONTAINER_ENGINE  Container CLI to use (default: docker). Set this to
                            podman to use Podman's CLI.
  BOKEHJS_BASELINE_BUILD    Set to 1 to build and use the Dockerfile locally
                            instead of pulling the canonical Bokeh image.
  BOKEHJS_BASELINE_IMAGE    Override the canonical or local image reference.
  BOKEHJS_BASELINE_PULL     Set to 0 when BOKEHJS_BASELINE_IMAGE already exists
                            in the local container engine (default: 1).
  BOKEHJS_BASELINE_REVIEW_PORT
                            Default port for the review server (default: 5777).
`)
}

function fail(message, code = 1) {
  process.stderr.write(`${message}\n`)
  process.exit(code)
}

function output(command, args) {
  const result = spawnSync(command, args, {encoding: "utf-8"})
  if (result.error != null) {
    throw result.error
  }
  if (result.status !== 0) {
    const message = result.stderr.trim() || `${command} exited with status ${result.status}`
    throw new Error(message)
  }
  return result.stdout.trim()
}

async function execute(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const env = {...process.env, DOCKER_CLI_HINTS: "false", ...options.env}
    const proc = spawn(command, args, {stdio: "inherit", ...options, env})
    proc.on("error", reject)
    proc.on("exit", (code, signal) => {
      if (code === 0) {
        resolve()
      } else if (signal != null) {
        reject(new Error(`${command} was terminated by ${signal}`))
      } else {
        reject(new Error(`${command} exited with status ${code}`))
      }
    })
  })
}

const script_dir = path.dirname(fileURLToPath(import.meta.url))
const repo_root = output("git", ["-C", script_dir, "rev-parse", "--show-toplevel"])
const git_dir = output("git", ["-C", repo_root, "rev-parse", "--path-format=absolute", "--git-dir"])
const git_common_dir = output("git", ["-C", repo_root, "rev-parse", "--path-format=absolute", "--git-common-dir"])
const baselines_dir = path.join(repo_root, "bokehjs", "test", "baselines", "linux")
const report_path = path.join(baselines_dir, "report.json")
const report_out_path = path.join(baselines_dir, "report.out")
const container_engine = process.env.BOKEHJS_CONTAINER_ENGINE ?? "docker"
const build_locally = process.env.BOKEHJS_BASELINE_BUILD === "1"
const pull_image = process.env.BOKEHJS_BASELINE_PULL !== "0"
const image = process.env.BOKEHJS_BASELINE_IMAGE ?? (build_locally ? local_image : canonical_image)

function warn_if_emulated() {
  try {
    const podman = path.basename(container_engine).toLowerCase().startsWith("podman")
    const format = podman ? "{{.Host.Arch}}" : "{{.Architecture}}"
    const architecture = output(container_engine, ["info", "--format", format]).toLowerCase()
    if (architecture !== "amd64" && architecture !== "x86_64") {
      process.stderr.write(`Warning: the baseline image is linux/amd64 but the container engine reports ${architecture}; emulation can make browser tests substantially slower.\n`)
    }
  } catch {
    // Image preparation below will report an unavailable container engine.
  }
}

const user_args = typeof process.getuid === "function" && typeof process.getgid === "function"
  ? ["--user", `${process.getuid()}:${process.getgid()}`]
  : []

let tmpfs_options = "rw,exec,mode=1777"
if (path.basename(container_engine).toLowerCase().startsWith("podman")) {
  // Podman's default tmpcopyup would populate the mount from the host checkout.
  tmpfs_options += ",notmpcopyup"
}

const container_args = [
  "--rm",
  "--init",
  "--platform=linux/amd64",
  "--shm-size=2g",
  ...user_args,
  "--env", "CI=true",
  "--env", "GIT_COMMON_DIR=/git/common",
  "--env", "GIT_CONFIG_COUNT=1",
  "--env", "GIT_CONFIG_KEY_0=safe.directory",
  "--env", "GIT_CONFIG_VALUE_0=/work",
  "--env", "GIT_DIR=/git/worktree",
  "--env", "GIT_WORK_TREE=/work",
  "--env", "HOME=/tmp/bokeh-home",
  "--env", "npm_config_cache=/tmp/npm-cache",
  "--mount", `type=bind,source=${repo_root},target=/work`,
  "--mount", `type=bind,source=${git_dir},target=/git/worktree,readonly`,
  "--mount", `type=bind,source=${git_common_dir},target=/git/common,readonly`,
  "--tmpfs", `/work/bokehjs/build:${tmpfs_options}`,
  "--tmpfs", `/work/bokehjs/node_modules:${tmpfs_options}`,
  "--workdir", "/work/bokehjs",
]

async function prepare_image() {
  if (build_locally) {
    await execute(container_engine, [
      "build",
      "--platform=linux/amd64",
      "--tag", image,
      "--file", path.join(repo_root, "bokehjs", "test", "baselines", "Dockerfile"),
      path.join(repo_root, "bokehjs", "test", "baselines"),
    ])
  } else if (pull_image) {
    await execute(container_engine, ["pull", "--platform=linux/amd64", image])
  }
}

function has_explicit_ref(args) {
  return args.some((arg) => arg === "--ref" || arg.startsWith("--ref="))
}

async function run_tests(args) {
  const test_args = [...args]
  if (!has_explicit_ref(test_args)) {
    const baseline_tree = output("git", ["-C", repo_root, "write-tree"])
    test_args.push(`--ref=${baseline_tree}`)
    process.stdout.write(`Verifying against the current Git index (${baseline_tree.slice(0, 12)}).\n`)
  }

  // Never leave a previous report available while a new run is incomplete.
  fs.rmSync(report_path, {force: true})
  fs.rmSync(report_out_path, {force: true})

  warn_if_emulated()
  await prepare_image()
  await execute(container_engine, [
    "run", ...container_args,
    "--entrypoint=/bin/bash",
    image,
    "-c", "npm ci --no-progress --no-audit --no-fund && node make lib:build test:integration \"$@\"",
    "bash", ...test_args,
  ])

  const unverified = unverified_baselines(changed_baselines(), load_completed_report())
  if (unverified.length !== 0) {
    process.stderr.write(`Warning: changed baseline files do not match this completed report:\n${unverified.join("\n")}\nRun the corresponding tests before reviewing or accepting them.\n`)
  }
}

function parse_port(args) {
  let port = process.env.BOKEHJS_BASELINE_REVIEW_PORT ?? "5777"
  if (args[0] === "--port") {
    if (args.length < 2) {
      fail("--port requires a value", 2)
    }
    port = args[1]
    args.splice(0, 2)
  } else if (args[0]?.startsWith("--port=")) {
    port = args[0].slice("--port=".length)
    args.splice(0, 1)
  }

  const value = Number(port)
  if (args.length !== 0 || !/^\d+$/.test(port) || value < 1 || value > 65535) {
    usage(process.stderr)
    process.exit(2)
  }
  return value
}

function load_completed_report() {
  let report
  try {
    report = JSON.parse(fs.readFileSync(report_path, "utf-8"))
  } catch {
    fail("No completed baseline report found. Run baseline tests first.")
  }
  const valid_results = Array.isArray(report.results) && report.results.every((entry) =>
    Array.isArray(entry) && entry.length === 2 && typeof entry[1]?.baseline_name === "string",
  )
  if (report.completed !== true || !Array.isArray(report.baseline_names) || !valid_results) {
    fail("The baseline report is incomplete or from an older runner. Run baseline tests again.")
  }
  return report
}

async function review(args) {
  load_completed_report()
  const port = parse_port(args)
  await prepare_image()
  process.stdout.write(`Review baseline changes at http://127.0.0.1:${port}/integration/report?platform=linux\n`)
  process.stdout.write("Press Ctrl-C to stop the review server.\n")
  await execute(container_engine, [
    "run", ...container_args,
    "--publish", `127.0.0.1:${port}:5777`,
    "--entrypoint=/bin/bash",
    image,
    "-c", "npm ci --no-progress --no-audit --no-fund && exec node test/devtools server --host=0.0.0.0 --port=5777",
  ])
}

function changed_baselines() {
  const result = spawnSync("git", [
    "-C", repo_root,
    "ls-files", "--modified", "--others", "--exclude-standard", "--deleted", "-z", "--",
    "bokehjs/test/baselines/linux/*.blf",
    "bokehjs/test/baselines/linux/*.png",
  ], {encoding: "buffer"})
  if (result.error != null) {
    throw result.error
  }
  if (result.status !== 0) {
    throw new Error("unable to inspect changed baseline files")
  }
  return result.stdout.toString("utf-8").split("\0").filter((item) => item !== "")
}

function unverified_baselines(files, report) {
  const results = new Map(report.results.map(([, result]) => [result.baseline_name, result]))
  return files.filter((file) => {
    const extension = path.extname(file)
    const result = results.get(path.basename(file, extension))
    const expected = (() => {
      if (extension === ".blf" && typeof result?.baseline === "string") {
        return Buffer.from(result.baseline)
      } else if (extension === ".png" && typeof result?.image === "string") {
        return Buffer.from(result.image, "base64")
      } else {
        return null
      }
    })()
    if (expected == null) {
      return true
    }
    try {
      return !fs.readFileSync(path.join(repo_root, file)).equals(expected)
    } catch {
      return true
    }
  })
}

function accept(args) {
  if (args.length !== 0) {
    usage(process.stderr)
    process.exit(2)
  }

  const files = changed_baselines()
  if (files.length === 0) {
    process.stdout.write("No changed Linux baseline files to stage.\n")
    return
  }

  const unreviewed = unverified_baselines(files, load_completed_report())
  if (unreviewed.length !== 0) {
    fail(`Refusing to stage baseline files that do not match the completed report:\n${unreviewed.join("\n")}\nRun the corresponding tests and review the new report first.`)
  }

  const pathspecs = Buffer.from(`${files.join("\0")}\0`)
  const result = spawnSync("git", [
    "-C", repo_root,
    "add", "--pathspec-from-file=-", "--pathspec-file-nul",
  ], {input: pathspecs, stdio: ["pipe", "inherit", "inherit"]})
  if (result.error != null) {
    throw result.error
  }
  if (result.status !== 0) {
    throw new Error("unable to stage reviewed baseline files")
  }

  process.stdout.write("Staged reviewed Linux baseline files:\n")
  for (const file of files) {
    process.stdout.write(`${file}\n`)
  }
  process.stdout.write("Subsequent baseline-test runs will verify against these staged baselines.\n")
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] ?? "run"
  if (["run", "review", "accept"].includes(command)) {
    args.shift()
  }

  switch (command) {
    case "run":
      await run_tests(args)
      break
    case "review":
      await review(args)
      break
    case "accept":
      accept(args)
      break
    case "help":
    case "-h":
    case "--help":
      usage()
      break
    default:
      await run_tests(process.argv.slice(2))
      break
  }
}

try {
  await main()
} catch (error) {
  const message = error instanceof Error ? error.message : `${error}`
  fail(message)
}
