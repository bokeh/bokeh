import * as ts from "typescript"

import * as cp from "child_process"
import {join, basename} from "path"

import {read, read_json, write, rename, file_exists, directory_exists, hash, hash_file, Path} from "./sys"
import {compile_files, read_tsconfig, parse_tsconfig, is_failed,
        default_transformers, compiler_host, report_diagnostics} from "./compiler"
import {Linker} from "./linker"

function npm_install(base_dir: Path) {
  const {status} = cp.spawnSync("npm", ["install"], {stdio: "inherit", cwd: base_dir})
  if (status !== 0)
    process.exit(status)
}

type Metadata = {
  bokeh_version?: string
  signatures: {[key: string]: string}
}

function is_up_to_date(base_dir: Path, file: string, metadata: Metadata) {
  const contents = read(join(base_dir, file))
  if (contents == null)
    return false

  const old_hash = metadata.signatures[file]
  if (old_hash == null)
    return false

  const new_hash = hash(contents)
  return old_hash == new_hash
}

function needs_install(base_dir: Path, metadata: Metadata): string | null {
  if (!directory_exists(join(base_dir, "node_modules")))
    return `New development environment.`
  else if (!is_up_to_date(base_dir, "package.json", metadata))
    return `package.json has changed.`
  else if (!is_up_to_date(base_dir, "package-lock.json", metadata))
    return `package-lock.json has changed.`
  else
    return null
}

import * as tsconfig_json from "./tsconfig.ext.json"

function print(str: string): void {
  console.log(str)
}

import chalk from "chalk"
const {cyan, magenta} = chalk

export type BuildOptions = {
  rebuild?: boolean
  bokeh_version: string
}

export async function build(base_dir: Path, bokehjs_dir: Path, base_setup: BuildOptions): Promise<boolean> {
  print(`Working directory: ${cyan(base_dir)}`)

  const setup: Required<BuildOptions> = {
    rebuild: !!base_setup.rebuild,
    bokeh_version: base_setup.bokeh_version,
  }

  const bokeh_ext_json_path = join(base_dir, "bokeh.ext.json")
  const is_extension = file_exists(bokeh_ext_json_path)

  if (!is_extension) {
    print("Not a bokeh extension. Quitting.")
    return false
  }

  const metadata_path = join(base_dir, ".bokeh")

  const metadata = (() => {
    let obj = read_json(metadata_path) as any
    if (obj == null)
      obj = {}
    if (obj.signatures == null)
      obj.signatures = {}
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

  const tsconfig_path = join(base_dir, "tsconfig.json")
  const tsconfig = (() => {
    const preconfigure: ts.CompilerOptions = {
      baseUrl: base_dir,
      paths: {
        "@bokehjs/*": [
          join(bokehjs_dir, "js/lib/*"),
          join(bokehjs_dir, "js/types/*"),
        ],
      },
    }

    if (file_exists(tsconfig_path)) {
      print(`Using ${cyan(tsconfig_path)}`)
      return read_tsconfig(tsconfig_path, is_package ? undefined : preconfigure)
    } else
      return parse_tsconfig(tsconfig_json, base_dir, preconfigure)
  })()

  if (is_failed(tsconfig)) {
    print(report_diagnostics(tsconfig.diagnostics).text)
    return false
  }

  const {files, options} = tsconfig

  const transformers = default_transformers(options)
  const host = compiler_host(new Map(), options, bokehjs_dir)

  print(`Compiling TypeScript (${magenta(files.length + " files")})`)
  const tsoutput = compile_files(files, options, transformers, host)

  if (is_failed(tsoutput)) {
    print(report_diagnostics(tsoutput.diagnostics).text)

    if (options.noEmitOnError)
      return false
  }

  const dist_dir = join(base_dir, "dist")
  const lib_dir = options.outDir || dist_dir

  const artifact = basename(base_dir)

  const linker = new Linker({
    entries: [join(lib_dir, "index.js")],
    bases: [lib_dir, join(base_dir, "node_modules")],
    cache: join(dist_dir, `${artifact}.json`),
    excluded: (dep) => dep.startsWith("@bokehjs/"),
    plugin: true,
  })

  print("Linking modules")
  if (!setup.rebuild) linker.load_cache()
  const bundles = linker.link()
  linker.store_cache()
  const outputs = [join(dist_dir, `${artifact}.js`)]

  const min_js = (js: string) => rename(js, {ext: '.min.js'})

  function bundle(minified: boolean, outputs: string[]) {
    bundles
      .map((bundle) => bundle.assemble(minified))
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
  return !is_failed(tsoutput)
}
