import {resolve, relative, join, dirname, basename} from "path"
const {_builtinLibs} = require("repl")
import * as crypto from "crypto"

import * as ts from "typescript"
import * as terser from "terser"

import * as combine from "combine-source-map"
import * as convert from "convert-source-map"

import {read, write, fileExists, directoryExists, rename} from "./fs"
import * as preludes from "./prelude"
import * as transforms from "../src/compiler/transforms"

export function* imap<T, U>(iter: Iterable<T>, fn: (item: T, i: number) => U): Iterable<U> {
  let i = 0
  for (const item of iter) {
    yield fn(item, i++)
  }
}

export type Path = string

export interface Parent {
  file: Path
}

export interface ModuleInfo {
  file: Path
  base: Path
  base_path: Path
  canonical?: string
  id: number
  hash: string
  changed: boolean
  type: "js" | "json" | "css"
  source: string
  ast?: ts.SourceFile
  dependency_paths: Map<string, Path>
  dependency_map: Map<string, number>
  dependencies: Map<string, ModuleInfo>
}

export type ModuleCode = {
  source: string
  map?: string
  min_source: string
  min_map?: string
}

export interface ModuleArtifact {
  module: ModuleInfo
  code: ModuleCode
}

const to_obj = <T>(map: Map<string, T>): {[key: string]: T} => {
  const obj = Object.create(null)
  for (const [key, val] of map) {
    obj[key] = val
  }
  return obj
}

export type Assembly = {
  prefix: string
  suffix: string
  wrap: (id: number, source: string) => string
}

const dense_assembly: Assembly = {
  prefix: "[",
  suffix: "]",
  wrap: (_, source) => source,
}

const sparse_assembly: Assembly = {
  prefix: "{",
  suffix: "}",
  wrap: (id, source) => `${id}: ${source}`,
}

export class Bundle {
  constructor(
    readonly entry: ModuleInfo,
    readonly artifacts: ModuleArtifact[],
    readonly builtins: boolean,
    readonly prelude: string,
    readonly assembly: Assembly) {}

  assemble(minified: boolean = false): Artifact {
    let line = 0
    let sources: string = ""
    const sourcemap = combine.create()
    const exported = new Map<string, number>()

    const newlines = (source: string): number => {
      const result = source.match(/\n/g)
      return result != null ? result.length : 0
    }

    const {entry, artifacts, builtins, prelude, assembly: {prefix, suffix, wrap}} = this

    sources += `${prelude}(${prefix}\n`
    line += newlines(sources)

    for (const artifact of artifacts) {
      const {module} = artifact

      if (module.canonical != null)
        exported.set(module.canonical, module.id)

      const start = wrap(module.id, "")
      sources += start
      line += newlines(start)

      const source_with_sourcemap = minified ? artifact.code.min_source : artifact.code.source
      const source = combine.removeComments(source_with_sourcemap).trimRight()
      sources += source
      sourcemap.addFile({source: source_with_sourcemap, sourceFile: module.file}, {line})
      line += newlines(source)

      const end = ",\n"
      sources += end
      line += newlines(end)
    }

    const aliases = JSON.stringify(to_obj(exported))
    const parent_require = builtins ? `typeof "require" !== "undefined" && require` : "null"
    sources += `${suffix}, ${aliases}, ${entry.id}, ${parent_require});\n})\n`

    const source_map = convert.fromBase64(sourcemap.base64()).toObject()
    return new Artifact(sources, source_map, exported)
  }
}

export class Artifact {
  constructor(readonly source: string,
              readonly sourcemap: object,
              readonly exported: Map<string, number>) {}

  full_source(name: string): string {
    return `${this.source}\n${convert.generateMapFileComment(name)}\n`
  }

  get module_names(): string[] {
    return Array.from(this.exported.keys())
  }

  write(path: string): void {
    const dir = dirname(path)
    const name = basename(path, ".js")
    write(path, this.full_source(name + ".js.map"))
    write(join(dir, name + ".js.map"), JSON.stringify(this.sourcemap))
    write(join(dir, name + ".json"), JSON.stringify(this.module_names))
  }
}

export interface LinkerOpts {
  entries: Path[]
  bases?: Path[]
  excludes?: Path[] // paths: process, but don't include in a bundle
  ignores?: string[]  // modules: don't process at all
  builtins?: boolean
  cache?: Path
  minify?: boolean
}

export class Linker {
  readonly entries: Path[]
  readonly bases: Path[]
  readonly excludes: Set<Path>
  readonly ignores: Set<string>
  readonly builtins: boolean
  readonly cache_path?: Path
  readonly cache: Map<Path, ModuleArtifact>
  readonly minify: boolean

  constructor(opts: LinkerOpts) {
    this.entries = opts.entries
    this.bases = (opts.bases || []).map((path) => resolve(path))
    this.excludes = new Set((opts.excludes || []).map((path) => resolve(path)))
    this.ignores = new Set(opts.ignores || [])
    this.builtins = opts.builtins || false

    if (this.builtins) {
      this.ignores.add("module")
      this.ignores.add("constants")

      for (const lib of _builtinLibs)
        this.ignores.add(lib)
    }

    for (const base of this.bases) {
      if (!directoryExists(base))
        throw new Error(`base path ${base} doesn't exist or isn't a directory`)
    }

    this.cache_path = opts.cache
    this.cache = new Map()
    this.load_cache()

    this.minify = opts.minify != null ? opts.minify : true
  }

  link(): Bundle[] {
    const [entries] = this.resolve(this.entries)
    const [main, ...plugins] = entries

    const dirnames = plugins.map((plugin) => dirname(plugin.file))
    const is_excluded = (module: ModuleInfo) => {
      return dirnames.find((e) => module.file.startsWith(e)) != null
    }

    const main_modules = this.reachable(main, is_excluded)
    const parents = new Set(main_modules)

    const plugin_models: ModuleInfo[][] = []

    for (const plugin of plugins) {
      const files = this.reachable(plugin, (module) => parents.has(module))
      plugin_models.push(files)
    }

    main_modules.concat(...plugin_models).forEach((module, i) => module.id = i)

    const print = (module: ModuleInfo) => {
      let ast = module.ast || transforms.parse_es(module.file, module.source)

      const rewrite_deps = transforms.rewrite_deps((dep) => {
        const module_dep = module.dependencies.get(dep)
        return module_dep != null ? module_dep.id : undefined
      })
      ast = transforms.apply(ast, rewrite_deps)

      if (module.type == "json")
        ast = transforms.add_json_export(ast)

      ast = transforms.wrap_in_function(ast, module.base_path)

      const source = transforms.print_es(ast)
      return convert.removeMapFileComments(source)
    }

    const deps_changed = (module: ModuleInfo, cached: ModuleInfo) => {
      if (module.dependencies.size != cached.dependencies.size)
        return false

      for (const [dep, module_dep] of module.dependencies) {
        const cached_dep = cached.dependencies.get(dep)
        if (cached_dep == null || cached_dep.id != module_dep.id)
          return true
      }
      return false
    }

    const artifacts = (modules: ModuleInfo[]) => {
      return modules.map((module) => {
        const cached = this.cache.get(module.file)

        let code: ModuleCode
        if (module.changed || (cached != null && deps_changed(module, cached.module))) {
          const source = print(module)
          const minified = this.minify ? minify(module, source) : {min_source: source}
          code = {source, ...minified}
        } else
          code = cached!.code

        return {module, code}
      })
    }

    const main_bundle = new Bundle(main, artifacts(main_modules), this.builtins, preludes.prelude, dense_assembly)

    const plugin_bundles: Bundle[] = []
    for (let j = 0; j < plugins.length; j++) {
      const plugin_bundle = new Bundle(plugins[j], artifacts(plugin_models[j]), this.builtins, preludes.plugin_prelude, sparse_assembly)
      plugin_bundles.push(plugin_bundle)
    }

    const bundles = [main_bundle, ...plugin_bundles]

    this.cache.clear()
    for (const bundle of bundles) {
      for (const artifact of bundle.artifacts) {
        this.cache.set(artifact.module.file, artifact)
      }
    }

    return bundles
  }

  load_cache(): void {
    const {cache_path} = this
    if (cache_path == null || !fileExists(cache_path))
      return

    this.cache.clear()

    const json = JSON.parse(read(cache_path)!)
    for (const {module, code} of json) {
      const artifact = {
        module: {
          ...module,
          ast: undefined,
          changed: false,
          dependencies: new Map(),
          dependency_map: new Map(module.dependency_map),
          dependency_paths: new Map(module.dependency_paths),
        },
        code
      } as ModuleArtifact
      this.cache.set(artifact.module.file, artifact)
    }

    for (const {module} of this.cache.values()) {
      for (const [dep, file] of module.dependency_paths) {
        module.dependencies.set(dep, this.cache.get(file)!.module)
      }
    }
  }

  store_cache(): void {
    if (this.cache_path == null)
      return

    const serializable = []
    for (const artifact of this.cache.values()) {
      const module = {...artifact.module}

      delete module.changed
      delete module.ast
      delete module.dependencies

      serializable.push({
        module: {
          ...module,
          dependency_map: [...module.dependency_map.entries()],
          dependency_paths: [...module.dependency_paths.entries()],
        },
        code: artifact.code,
      })
    }

    const json = JSON.stringify(serializable)
    write(this.cache_path, json)
  }

  protected readonly ext = ".js"

  protected resolve_relative(dep: string, parent: Parent): string {
    const path = resolve(dirname(parent.file), dep)

    if (fileExists(path))
      return path

    const file = path + this.ext
    const has_file = fileExists(file)

    const index = join(path, "index" + this.ext)
    const has_index = fileExists(index)

    if (has_file && has_index)
      throw new Error(`both ${file} and ${index} exist, remove one of them or clean the build and recompile`)
    else if (has_file)
      return file
    else if (has_index)
      return index
    else
      throw new Error(`can't resolve '${dep}' from '${parent.file}'`)
  }

  protected resolve_absolute(dep: string, parent: Parent): string {
    const resolve_with_index = (path: string): string | null => {
      let index = "index" + this.ext

      const pkg_path = join(path, "package.json")
      if (fileExists(pkg_path)) {
        const pkg = JSON.parse(read(pkg_path)!)
        if (pkg.main != null)
          index = pkg.main
      }

      let file = join(path, index)
      if (fileExists(file))
        return file
      else {
        file += this.ext
        if (fileExists(file))
          return file
      }

      return null
    }

    for (const base of this.bases) {
      let path = join(base, dep)
      const file = path + this.ext

      if (fileExists(file))
        return file

      if (directoryExists(path)) {
        const file = resolve_with_index(path)
        if (file != null)
          return file
      }

      if (parent.file.startsWith(base)) {
        let base_path = parent.file

        while (true) {
          base_path = dirname(base_path)

          if (base_path == base)
            break

          path = join(base_path, "node_modules", dep)

          if (directoryExists(path)) {
            const file = resolve_with_index(path)
            if (file != null)
              return file
          }
        }
      }
    }

    throw new Error(`can't resolve '${dep}' from '${parent.file}'`)
  }

  resolve_file(dep: string, parent: Parent): Path {
    if (dep.startsWith("."))
      return this.resolve_relative(dep, parent)
    else
      return this.resolve_absolute(dep, parent)
  }

  new_module(file: Path): ModuleInfo {
    const source = read(file)!
    const hash = crypto.createHash("sha256").update(source).digest("hex")
    const is_json = file.endsWith(".json")
    const is_css = file.endsWith(".css")
    const [base, base_path, canonical] = ((): [string, string, string | undefined] => {
      const [primary, ...secondary] = this.bases

      const path = relative(primary, file)
      if (!path.startsWith("..")) {
        return [primary, path, path.replace(/\.js$/, "").replace(/\\/g, "/")]
      }

      for (const base of secondary) {
        const path = relative(base, file)
        if (!path.startsWith("..")) {
          return [base, path, undefined]
        }
      }

      throw new Error(`${file} is not under any of base paths`)
    })()

    const cached = this.cache.get(file)

    let ast: ts.SourceFile | undefined
    let dependency_paths: Map<string, Path>

    const changed = cached == null || cached.module.hash != hash
    if (changed) {
      ast = transforms.parse_es(file, source)

      const collected = transforms.collect_deps(ast).filter((dep) => !this.ignores.has(dep))
      dependency_paths = new Map(collected.map((dep) => [dep, this.resolve_file(dep, {file})]))
    } else
      dependency_paths = cached!.module.dependency_paths

    return {
      file,
      base,
      base_path,
      canonical,
      id: NaN,
      hash,
      changed,
      source,
      ast,
      type: is_json ? "json" : (is_css ? "css" : "js"),
      dependency_paths,
      dependency_map: new Map(),
      dependencies: new Map(),
    }
  }

  resolve(files: Path[]): [ModuleInfo[], ModuleInfo[]] {
    const visited = new Map<Path, ModuleInfo>()
    const pending = files.map((file) => resolve(file))

    for (;;) {
      const file = pending.shift()

      if (file == null)
        break
      if (visited.has(file) || this.excludes.has(file))
        continue

      const module = this.new_module(file)
      visited.set(module.file, module)
      pending.unshift(...module.dependency_paths.values())
    }

    for (const module of visited.values()) {
      for (const [dep, file] of module.dependency_paths) {
        module.dependencies.set(dep, visited.get(file)!)
      }
    }

    const entries = files.map((file) => visited.get(file)!)
    return [entries, [...visited.values()]]
  }

  reachable(entry: ModuleInfo, is_excluded: (module: ModuleInfo) => boolean): ModuleInfo[] {
    const reached = new Set<ModuleInfo>()
    const pending = [entry]

    for (;;) {
      const module = pending.shift()

      if (module == null)
        break
      if (reached.has(module) || this.excludes.has(module.file) || is_excluded(module))
        continue

      reached.add(module)
      pending.unshift(...module.dependencies.values())
    }

    return [...reached.values()]
  }
}

export function minify(module: ModuleInfo, source: string): {min_source: string, min_map?: string} {
  const name = basename(module.file)
  const min_js = rename(name, {ext: '.min.js'})
  const min_js_map = rename(name, {ext: '.min.js.map'})

  const minify_opts: terser.MinifyOptions = {
    output: {
      comments: /^!|copyright|license|\(c\)/i,
    },
    sourceMap: {
      filename: basename(min_js),
      url: basename(min_js_map),
    },
  }

  const {code, map, error} = terser.minify(source, minify_opts)

  if (error != null) {
    const {message, line, col} = error as any
    throw new Error(`${module.file}:${line-1}:${col}: ${message}`)
  }

  return {min_source: code || "", min_map: map}
}
