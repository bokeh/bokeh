import {spawnSync} from "node:child_process"
import {randomUUID} from "node:crypto"
import {dirname, join, resolve} from "node:path"
import {rmSync} from "node:fs"
import {fileURLToPath} from "node:url"

import {file_exists, write} from "./sys.js"

export type CompilerOptions = {
  [name: string]: unknown
  outDir?: string
  declarationDir?: string
  noEmitOnError?: boolean
}

export type Config = {
  compilerOptions?: CompilerOptions
  files?: string[]
  [name: string]: unknown
}

export type Failed = {diagnostics: string}
export type TSOutput = {diagnostics?: string}
export type TSConfig = {
  files: string[]
  options: CompilerOptions
  config: Config
  base_dir: string
  diagnostics?: undefined
}

export function is_failed<T>(obj: T | Partial<Failed>): obj is Failed {
  return typeof obj == "object" && obj != null && "diagnostics" in obj && obj.diagnostics != null
}

// The installed adapter resolves its pinned native compiler from the same cache.
// Development builds use the explicit workspace installation, never PATH.
export function typescript_command(bokehjs_dir: string): string[] {
  bokehjs_dir = resolve(bokehjs_dir)
  const candidates = [
    join(dirname(fileURLToPath(import.meta.url)), "node_modules/typescript/bin/tsc"),
    join(dirname(bokehjs_dir), "node_modules/typescript/bin/tsc"),
  ]
  const compiler = candidates.find(file_exists)
  if (compiler == null) {
    throw new Error(`Cannot locate the TypeScript compiler. Checked: ${candidates.join(", ")}`)
  }
  return [process.execPath, compiler]
}

export function run_typescript(config: Config, base_dir: string, bokehjs_dir: string, args: string[] = []): {status: number, output: string} {
  // A sibling config preserves the native compiler's interpretation of all
  // relative paths, extends clauses, include patterns, and package resolution.
  const path = join(base_dir, `.bokeh-tsconfig-${randomUUID()}.json`)
  write(path, JSON.stringify(config))
  try {
    const [command, ...prefix] = typescript_command(bokehjs_dir)
    const result = spawnSync(command, [...prefix, "--project", path, ...args], {
      cwd: base_dir,
      encoding: "utf8",
      maxBuffer: 32*1024*1024,
    })
    if (result.error != null) {
      throw result.error
    }
    const status = result.status ?? 1
    return {status, output: status == 0 ? result.stdout : `${result.stdout}${result.stderr}`}
  } finally {
    rmSync(path)
  }
}

export function compile_project(config: TSConfig, bokehjs_dir: string): TSOutput {
  const {status, output} = run_typescript(config.config, config.base_dir, bokehjs_dir, ["--pretty", "true"])
  return status == 0 ? {} : {diagnostics: output}
}

export function parse_tsconfig(config: Config, base_dir: string, bokehjs_dir: string, preconfigure?: CompilerOptions): TSConfig | Failed {
  const input = {...config, compilerOptions: {...config.compilerOptions, ...preconfigure}}
  const {status, output} = run_typescript(input, base_dir, bokehjs_dir, ["--showConfig", "--pretty", "false"])
  if (status != 0) {
    return {diagnostics: output}
  }
  const parsed = JSON.parse(output) as Config
  const options = {...parsed.compilerOptions}
  if (options.outDir != null) {
    options.outDir = resolve(base_dir, options.outDir)
  }
  if (options.declarationDir != null) {
    options.declarationDir = resolve(base_dir, options.declarationDir)
  }
  return {files: (parsed.files ?? []).map((file) => resolve(base_dir, file)), options, config: input, base_dir}
}

export function read_tsconfig(path: string, bokehjs_dir: string, preconfigure?: CompilerOptions): TSConfig | Failed {
  return parse_tsconfig({extends: path}, dirname(path), bokehjs_dir, preconfigure)
}
