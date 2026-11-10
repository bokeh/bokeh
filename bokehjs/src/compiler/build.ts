import * as cp from "node:child_process"
import {createRequire} from "node:module"
import {join, dirname, basename, relative, resolve} from "node:path"

import type {Path} from "./sys.js"
import {read, read_json, write, rename, file_exists, directory_exists, hash, hash_file, resolve_npm} from "./sys.js"
import {strip_modules} from "./strip.js"
import {Linker} from "./linker.js"
import {collect_styles, compile_styles, wrap_css_modules} from "./styles.js"
import * as preludes from "./prelude.js"

import tsconfig_json from "./tsconfig.ext.json" with {type: "json"}

import chalk from "chalk"
const {cyan, magenta, red, yellow} = chalk

import * as readline from "readline"

const toString = Object.prototype.toString
export function isString(obj: unknown): obj is string {
  return toString.call(obj) === "[object String]"
}

export function isObject(obj: unknown): obj is object {
  const tp = typeof obj
  return tp === "function" || tp === "object" && !!obj
}

export function isPlainObject<T>(obj: unknown): obj is {[key: string]: T} {
  return isObject(obj) && (typeof obj.constructor == "undefined" || obj.constructor === Object)
}

function print(str: string): void {
  console.log(str)
}

function print_files(files: string[]): void {
  for (const file of files) {
    print(`  ${file}`)
  }
}

function count_files(files: string[]): string {
  const n = files.length
  const str = `${n} file`
  return n == 1 ? str : `${str}s`
}

const node_version = process.version

function npm_version(base_dir: Path): string {
  return cp.execSync("npm --version", {cwd: base_dir}).toString().trim()
}

function npm_install(base_dir: Path): void {
  const [resolved_executable, resolved_args] = resolve_npm(["install"])
  const {status, error} = cp.spawnSync(resolved_executable, resolved_args, {stdio: "inherit", cwd: base_dir})
  if (error != null) {
    print(`${cyan("npm install")} failed to start: ${red(error.message)}`)
    process.exit(1)
  }
  if (status != null && status != 0) {
    print(`${cyan("npm install")} failed with exit code ${red(`${status}`)}.`)
    process.exit(status)
  }
}

function preamble(base_dir: Path): void {
  print(`Using nodejs ${magenta(node_version)} and npm ${magenta(npm_version(base_dir))}`)
  print(`Working directory: ${cyan(base_dir)}`)
}

type TypeScript = {version: string, tsc: Path}

/** Finds TypeScript, if it's a dependency of the package in `base_dir` and it's installed. */
function find_typescript(base_dir: Path, package_json: {[key: string]: unknown}): TypeScript | null {
  const {dependencies, devDependencies} = package_json
  const declared = [dependencies, devDependencies].some((deps) => isPlainObject(deps) && "typescript" in deps)
  if (!declared) {
    return null
  }
  try {
    const require = createRequire(join(base_dir, "package.json"))
    const path = require.resolve("typescript/package.json")
    const {version, bin} = read_json(path) as {version: string, bin?: string | {tsc?: string}}
    const tsc = isString(bin) ? bin : bin?.tsc
    return tsc != null ? {version, tsc: join(dirname(path), tsc)} : null
  } catch {
    return null
  }
}

function run_tsc(typescript: TypeScript, base_dir: Path, args: string[], capture: boolean = false): {status: number, stdout: string} {
  const {status, stdout, error} = cp.spawnSync(process.execPath, [typescript.tsc, ...args], {
    cwd: base_dir,
    encoding: "utf-8",
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  })
  if (error != null) {
    throw new Error(`failed to run ${typescript.tsc}: ${error.message}`)
  }
  return {status: status ?? 1, stdout: capture ? stdout : ""} // `stdout` is `null` unless captured
}

type Metadata = {
  bokeh_version?: string
  signatures: {[key: string]: string | undefined}
}

function is_up_to_date(base_dir: Path, file: string, metadata: Metadata) {
  const contents = read(join(base_dir, file))
  if (contents == null) {
    return false
  }

  const old_hash = metadata.signatures[file]
  if (old_hash == null) {
    return false
  }

  const new_hash = hash(contents)
  return old_hash == new_hash
}

function needs_install(base_dir: Path, metadata: Metadata): string | null {
  if (!directory_exists(join(base_dir, "node_modules"))) {
    return "New development environment."
  } else if (!is_up_to_date(base_dir, "package.json", metadata)) {
    return "package.json has changed."
  } else if (!is_up_to_date(base_dir, "package-lock.json", metadata)) {
    return "package-lock.json has changed."
  } else {
    return null
  }
}

export type InitOptions = {
  interactive?: boolean
  bokehjs_version?: string
  bokeh_version: string
}

export async function init(base_dir: Path, _bokehjs_dir: Path, base_setup: InitOptions): Promise<boolean> {
  preamble(base_dir)

  const to_npm_version = (v: string) => {
    return v.replace(/\+.*$/, "").replace(/\.?(dev|rc|a|b)(\d*)$/, (_, p1, p2) => `-${p1}${p2 ? `.${p2}` : ""}`)
  }

  const setup: Required<InitOptions> = {
    interactive: base_setup.interactive ?? false,
    bokehjs_version: base_setup.bokehjs_version ?? to_npm_version(base_setup.bokeh_version),
    bokeh_version: base_setup.bokeh_version,
  }

  const paths = {
    bokeh_ext: join(base_dir, "bokeh.ext.json"),
    package: join(base_dir, "package.json"),
    package_lock: join(base_dir, "package-lock.json"),
    tsconfig: join(base_dir, "tsconfig.json"),
    index: join(base_dir, "index.ts"),
  }

  const is_extension = file_exists(paths.bokeh_ext)
  if (is_extension) {
    print("Already a bokeh extension. Quitting.")
    return false
  }

  function write_json(path: Path, json: object): void {
    write(path, JSON.stringify(json, undefined, 2))
    print(`Wrote ${cyan(path)}`)
  }

  const bokeh_ext_json = {}
  write_json(paths.bokeh_ext, bokeh_ext_json)

  const package_json = {
    name: basename(base_dir),
    version: "0.0.1",
    description: "",
    license: "BSD-3-Clause",
    keywords: [],
    repository: {},
    dependencies: {
      "@bokeh/bokehjs": `^${setup.bokehjs_version}`,
    },
    devDependencies: {
      // any version, which supports extensions' tsconfig.json, e.g. `"moduleResolution": "bundler"`
      typescript: "^7.0.2",
    },
  }

  if (setup.interactive) {
    const rl = readline.createInterface({input: process.stdin, output: process.stdout})

    async function ask(question: string, default_value: string): Promise<string> {
      return new Promise((resolve, _reject) => {
        rl.question(`${question} `, (answer) => {
          resolve(answer.length != 0 ? answer : default_value)
        })
      })
    }

    async function ask_yn(question: string): Promise<boolean> {
      const ret = await ask(`${question} [y/n]`, "y")

      switch (ret) {
        case "y":
          return true
        case "n":
          return false
        default: {
          print(`${red("Invalid input")}. Assuming no.`)
          return false
        }
      }
    }

    if (await ask_yn(`Create ${cyan("package.json")}? This will allow you to specify external dependencies and to type-check with TypeScript.`)) {
      const {name} = package_json
      package_json.name = await ask(`  What's the extension's name? [${name}]`, name)

      const {version} = package_json
      package_json.version = await ask(`  What's the extension's version? [${version}]`, version)

      const {description} = package_json
      package_json.description = await ask(`  What's the extension's description? [${description}]`, description)

      write_json(paths.package, package_json)
    }

    if (await ask_yn(`Create ${cyan("tsconfig.json")}? This will allow for customized configuration and improved IDE experience.`)) {
      write_json(paths.tsconfig, tsconfig_json)
    }

    rl.close()
  } else {
    write_json(paths.package, package_json)
    write_json(paths.tsconfig, tsconfig_json)
  }

  write(paths.index, "export {}")
  print(`Created empty ${cyan("index.ts")}. This is the entry point of your extension.`)

  const rel = relative(process.cwd(), base_dir)
  print(`You can build your extension with ${magenta(`bokeh build ${rel}`)}`)

  print("All done.")
  return true
}

export type BuildOptions = {
  verbose?: boolean
  rebuild?: boolean
  bokeh_version: string
}

export async function build(base_dir: Path, bokehjs_dir: Path, base_setup: BuildOptions): Promise<boolean> {
  preamble(base_dir)

  const setup: Required<BuildOptions> = {
    verbose: base_setup.verbose ?? false,
    rebuild: base_setup.rebuild ?? false,
    bokeh_version: base_setup.bokeh_version,
  }

  const bokeh_ext_json_path = join(base_dir, "bokeh.ext.json")
  const bokeh_ext = read_json(bokeh_ext_json_path)

  if (!isPlainObject(bokeh_ext)) {
    print("Not a bokeh extension. Quitting.")
    return false
  }

  const metadata_path = join(base_dir, ".bokeh")

  const metadata = (() => {
    let obj = read_json(metadata_path) as any
    if (obj == null) {
      obj = {}
    }
    if (obj.signatures == null) {
      obj.signatures = {}
    }
    return obj as Metadata
  })()

  if (metadata.bokeh_version != setup.bokeh_version) {
    print("Using different version of bokeh, rebuilding from scratch.")
    setup.rebuild = true
  }

  const package_json_path = join(base_dir, "package.json")
  const package_lock_json_path = join(base_dir, "package-lock.json")

  const is_package = file_exists(package_json_path)

  if (!is_package) {
    print(`${cyan(package_json_path)} doesn't exist. Not a npm package.`)
  } else {
    if (setup.rebuild) {
      print(`Running ${cyan("npm install")}.`)
      npm_install(base_dir)
    } else {
      const result = needs_install(base_dir, metadata)
      if (result != null) {
        print(`${result} Running ${cyan("npm install")}.`)
        npm_install(base_dir)
      }
    }
  }

  const package_json = is_package ? read_json(package_json_path) : null
  const typescript = isPlainObject(package_json) ? find_typescript(base_dir, package_json) : null

  const tsconfig_path = join(base_dir, "tsconfig.json")
  const dist_dir = join(base_dir, "dist")

  const tsc_config = (() => {
    if (typescript == null) {
      return null
    }
    print(`Using TypeScript ${magenta(typescript.version)} from ${cyan(dirname(dirname(typescript.tsc)))}`)

    const config_path = (() => {
      if (file_exists(tsconfig_path)) {
        print(`Using ${cyan(tsconfig_path)}`)
        return tsconfig_path
      } else {
        const posix = (path: Path) => path.replaceAll("\\", "/")
        const path = join(dist_dir, "tsconfig.json")
        write(path, JSON.stringify({
          compilerOptions: {
            ...tsconfig_json.compilerOptions,
            rootDir: posix(base_dir),
            outDir: posix(join(dist_dir, "lib")),
            paths: {"@bokehjs/*": [posix(join(bokehjs_dir, "js/lib/*"))]},
          },
          include: [posix(join(base_dir, "**/*.ts"))], // excludes `outDir` and `node_modules` by default
        }, undefined, 2))
        return path
      }
    })()

    const {status, stdout} = run_tsc(typescript, base_dir, ["--project", config_path, "--showConfig"], true)
    if (status != 0) {
      return {path: config_path, options: null}
    }
    const {compilerOptions: options = {}} = JSON.parse(stdout) as {compilerOptions?: {[key: string]: unknown}}
    const dir = (option: unknown) => isString(option) ? resolve(dirname(config_path), option) : null
    return {
      path: config_path,
      options: {
        outDir: dir(options.outDir),
        declarationDir: dir(options.declarationDir),
        noEmitOnError: options.noEmitOnError == true,
      },
    }
  })()

  if (tsc_config != null && tsc_config.options == null) {
    print(`Failed to load ${cyan(tsc_config.path)}`)
    return false
  }

  if (typescript == null) {
    if (is_package) {
      print(yellow(`${cyan("typescript")} isn't a dependency of this package, so types won't be checked. Add it with ${magenta("npm install --save-dev typescript")}.`))
    } else {
      print("Types won't be checked, because this isn't a npm package.")
    }
  }

  let success = true
  const options = tsc_config?.options

  const lib_dir = options?.outDir ?? join(dist_dir, "lib")
  const dts_dir = options?.declarationDir ?? lib_dir
  const dts_internal_dir = join(dist_dir, "dts")

  const styles_dir = join(base_dir, "styles")
  const css_dir = join(dist_dir, "css")

  const styles = collect_styles(styles_dir)
  print(`Compiling styles (${magenta(count_files(styles))})`)
  if (setup.verbose) {
    print_files(styles)
  }
  if (!await compile_styles(styles, styles_dir, css_dir)) {
    success = false
  }

  wrap_css_modules(css_dir, lib_dir, dts_dir, dts_internal_dir)

  if (typescript != null && tsc_config != null) {
    print("Compiling TypeScript")
    const {status} = run_tsc(typescript, base_dir, ["--project", tsc_config.path, "--pretty"])
    if (status != 0) {
      success = false
      // 0 and 2 mean that outputs were emitted
      if (status != 2 || (options?.noEmitOnError ?? false)) {
        return false
      }
    }
  } else {
    const entry = ["index.ts", "index.js"].map((file) => join(base_dir, file)).find((file) => file_exists(file))
    if (entry == null) {
      print(`${cyan(join(base_dir, "index.ts"))} doesn't exist`)
      return false
    }
    print("Stripping types")
    const {files, errors} = strip_modules(entry, base_dir, lib_dir)
    if (setup.verbose) {
      print_files(files)
    }
    if (errors.length != 0) {
      print(errors.join("\n"))
      return false
    }
  }

  const artifact = basename(base_dir)

  const bases = [lib_dir]
  const node_modules = join(base_dir, "node_modules")
  if (is_package && directory_exists(node_modules)) { // not if there are no dependencies
    bases.push(node_modules)
  }

  const linker = new Linker({
    entries: [join(lib_dir, "index.js")],
    bases,
    cache: join(dist_dir, `${artifact}.json`),
    excluded: (dep) => dep == "tslib" || dep.startsWith("@bokehjs/"),
    plugin: true,
  })

  print("Linking modules")
  if (!setup.rebuild) {
    linker.load_cache()
  }
  const {bundles, status} = await linker.link()
  if (!status) {
    success = false
  }
  linker.store_cache()
  const outputs = [join(dist_dir, `${artifact}.js`)]

  const min_js = (js: string) => rename(js, {ext: ".min.js"})

  const license = (() => {
    if (isPlainObject(bokeh_ext.license)) {
      if (isString(bokeh_ext.license.file)) {
        const license_path = join(base_dir, bokeh_ext.license.file)
        const text = read(license_path)
        if (text != null) {
          return text
        } else {
          print(`Failed to license text from ${magenta(license_path)}`)
        }
      }
      if (isString(bokeh_ext.license.text)) {
        return bokeh_ext.license.text
      }
    }
    return null
  })()

  const license_text = license != null ? `${preludes.comment(license)}\n` : ""

  const prelude_base = `${license_text}${preludes.plugin_prelude()}`
  const prelude = {main: prelude_base, plugin: prelude_base}

  const postlude_base = preludes.plugin_postlude()
  const postlude = {main: postlude_base, plugin: postlude_base}

  function bundle(minified: boolean, outputs: string[]) {
    bundles
      .map((bundle) => bundle.assemble({prelude, postlude, minified}))
      .map((artifact, i) => artifact.write(outputs[i]))
  }

  bundle(false, outputs)
  bundle(true, outputs.map(min_js))

  write(metadata_path, JSON.stringify({
    bokeh_version: setup.bokeh_version,
    signatures: {
      "package.json": hash_file(package_json_path),
      "package-lock.json": hash_file(package_lock_json_path),
      "tsconfig.json": hash_file(tsconfig_path),
    },
  }))

  print(`Output written to ${cyan(dist_dir)}`)
  print("All done.")
  return success
}
