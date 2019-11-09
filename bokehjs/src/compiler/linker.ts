import {resolve, relative, join, dirname, basename, extname} from "path"
const {_builtinLibs} = require("repl")
import * as crypto from "crypto"

import * as ts from "typescript"
import * as terser from "terser"

import * as combine from "combine-source-map"
import * as convert from "convert-source-map"

import {read, write, file_exists, directory_exists, rename, Path} from "./sys"
import {report_diagnostics} from "./compiler"
import * as preludes from "./prelude"
import * as transforms from "./transforms"

const cache_version = 2

export function* imap<T, U>(iter: Iterable<T>, fn: (item: T, i: number) => U): Iterable<U> {
  let i = 0
  for (const item of iter) {
    yield fn(item, i++)
  }
}

export type Transformers = ts.TransformerFactory<ts.SourceFile>[]

export type Parent = {
  file: Path
}

export type ModuleType = "js" | "json" | "css"

export type ModuleInfo = {
  file: Path
  base: Path
  base_path: Path
  canonical?: string
  id: number | string
  hash: string
  changed: boolean
  type: ModuleType
  source: string
  ast?: ts.SourceFile
  dependency_paths: Map<string, Path>
  dependency_map: Map<string, number>
  dependencies: Map<string, ModuleInfo>
  externals: Set<string>
}

export type ModuleCode = {
  source: string
  map?: string
  min_source: string
  min_map?: string
}

export type ModuleArtifact = {
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
  wrap: (id: string, source: string) => string
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
    const aliases = new Map<string, number | string>()
    const externals = new Map<string, true>()

    const newlines = (source: string): number => {
      const result = source.match(/\n/g)
      return result != null ? result.length : 0
    }

    const safe_id = (module: ModuleInfo): string => {
      const {id} = module
      return typeof id == "number" ? id.toString() : JSON.stringify(id)
    }

    const {entry, artifacts, prelude, assembly: {prefix, suffix, wrap}} = this

    sources += `${prelude}(${prefix}\n`
    line += newlines(sources)

    for (const artifact of artifacts) {
      const {module} = artifact

      if (module.canonical != null)
        aliases.set(module.canonical, module.id)

      for (const external of module.externals)
        externals.set(external, true)

      const start = wrap(safe_id(module), "")
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

    const aliases_json = JSON.stringify(to_obj(aliases))
    const externals_json = JSON.stringify(to_obj(externals))
    sources += `${suffix}, ${safe_id(entry)}, ${aliases_json}, ${externals_json});\n})\n`

    const source_map = convert.fromBase64(sourcemap.base64()).toObject()
    return new Artifact(sources, source_map, aliases)
  }
}

export class Artifact {
  constructor(readonly source: string,
              readonly sourcemap: object,
              readonly exported: Map<string, number | string>) {}

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
  }
}

export interface LinkerOpts {
  entries: Path[]
  bases?: Path[]
  excludes?: Path[]    // paths: process, but don't include in a bundle
  externals?: string[] // modules: delegate to an external require()
  excluded?: (dep: string) => boolean
  builtins?: boolean
  cache?: Path
  transpile?: boolean
  minify?: boolean
  plugin?: boolean
  export_all?: boolean
}

export class Linker {
  readonly entries: Path[]
  readonly bases: Path[]
  readonly excludes: Set<Path>
  readonly externals: Set<string>
  readonly excluded: (dep: string) => boolean
  readonly builtins: boolean
  readonly cache_path?: Path
  readonly cache: Map<Path, ModuleArtifact>
  readonly transpile: boolean
  readonly minify: boolean
  readonly plugin: boolean
  readonly export_all: boolean

  constructor(opts: LinkerOpts) {
    this.entries = opts.entries.map((path) => resolve(path))
    this.bases = (opts.bases || []).map((path) => resolve(path))
    this.excludes = new Set((opts.excludes || []).map((path) => resolve(path)))
    this.externals = new Set(opts.externals || [])
    this.excluded = opts.excluded || (() => false)
    this.builtins = opts.builtins || false
    this.export_all = opts.export_all || false

    if (this.builtins) {
      this.externals.add("module")
      this.externals.add("constants")

      for (const lib of _builtinLibs)
        this.externals.add(lib)
    }

    for (const entry of this.entries) {
      if (!file_exists(entry))
        throw new Error(`entry path ${entry} doesn't exist or isn't a file`)
    }

    for (const base of this.bases) {
      if (!directory_exists(base))
        throw new Error(`base path ${base} doesn't exist or isn't a directory`)
    }

    this.cache_path = opts.cache
    this.cache = new Map()

    this.transpile = opts.transpile != null ? opts.transpile : false
    this.minify = opts.minify != null ? opts.minify : true
    this.plugin = opts.plugin != null ? opts.plugin : false
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

    const plugin_modules: ModuleInfo[][] = []

    for (const plugin of plugins) {
      const files = this.reachable(plugin, (module) => parents.has(module))
      plugin_modules.push(files)
    }

    const all_modules = main_modules.concat(...plugin_modules)
    if (!this.plugin)
      all_modules.forEach((module, i) => module.id = i)
    else
      all_modules.forEach((module) => module.id = module.hash.slice(0, 10))

    const transformers = (module: ModuleInfo): Transformers => {
      const transformers = []

      switch (module.type) {
        case "js": {
          const remove_use_strict = transforms.remove_use_strict()
          transformers.push(remove_use_strict)

          const remove_esmodule = transforms.remove_esmodule()
          transformers.push(remove_esmodule)

          const rewrite_deps = transforms.rewrite_deps((dep) => {
            const module_dep = module.dependencies.get(dep)
            return module_dep != null ? module_dep.id : undefined
          })
          transformers.push(rewrite_deps)
          break
        }
        case "json": {
          transformers.push(transforms.add_json_export())
          break
        }
        case "css": {
          // ???
          break
        }
      }

      transformers.push(transforms.wrap_in_function(module.base_path))
      return transformers
    }

    const print = (module: ModuleInfo): string => {
      let ast = module.ast || this.parse_module(module)
      ast = transforms.apply(ast, ...transformers(module))
      const source = transforms.print_es(ast)
      return convert.removeMapFileComments(source)
    }

    const deps_changed = (module: ModuleInfo, cached: ModuleInfo): boolean => {
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

    const main_prelude = !this.plugin ? preludes.prelude : preludes.plugin_prelude
    const main_assembly = !this.plugin ? dense_assembly : sparse_assembly

    const main_bundle = new Bundle(main, artifacts(main_modules), this.builtins, main_prelude, main_assembly)

    const plugin_bundles: Bundle[] = []
    for (let j = 0; j < plugins.length; j++) {
      const plugin_bundle = new Bundle(plugins[j], artifacts(plugin_modules[j]), this.builtins, preludes.plugin_prelude, sparse_assembly)
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
    if (cache_path == null || !file_exists(cache_path))
      return

    this.cache.clear()

    const json = JSON.parse(read(cache_path)!)
    if (json.version !== cache_version) {
      console.warn("ignoring cache due to format version mismatch")
      return
    }

    for (const {module, code} of json.artifacts) {
      const artifact = {
        module: {
          ...module,
          ast: undefined,
          changed: false,
          dependencies: new Map(),
          dependency_map: new Map(module.dependency_map),
          dependency_paths: new Map(module.dependency_paths),
          externals: new Set(module.externals),
        },
        code,
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

    const artifacts = []
    for (const artifact of this.cache.values()) {
      const module = {...artifact.module}

      delete module.changed
      delete module.ast
      delete module.dependencies

      artifacts.push({
        module: {
          ...module,
          dependency_map: [...module.dependency_map.entries()],
          dependency_paths: [...module.dependency_paths.entries()],
          externals: [...module.externals.values()],
        },
        code: artifact.code,
      })
    }

    const json = JSON.stringify({version: cache_version, artifacts})
    write(this.cache_path, json)
  }

  protected readonly ext = ".js"

  resolve_package(dir: string): string | null {
    const index = (() => {
      const pkg_path = join(dir, "package.json")
      if (file_exists(pkg_path)) {
        const pkg = JSON.parse(read(pkg_path)!)
        if (pkg.module != null)
          return pkg.module
        if (pkg.main != null)
          return pkg.main
      }
      return "index.js"
    })()

    const path = join(dir, index)
    if (file_exists(path))
      return path

    const js_file = path + ".js"
    if (file_exists(js_file))
      return js_file
    const json_file = path + ".json"
    if (file_exists(json_file))
      return json_file

    if (directory_exists(path)) {
      const index = join(path, "index.js")
      if (file_exists(index))
        return index
    }

    return null
  }

  protected resolve_relative(dep: string, parent: Parent): string {
    const path = resolve(dirname(parent.file), dep)

    if (file_exists(path))
      return path

    const js_file = path + ".js"
    const json_file = path + ".json"
    const has_js_file = file_exists(js_file)
    const has_json_file = file_exists(json_file)
    const has_file = has_js_file || has_json_file

    if (directory_exists(path)) {
      const pkg_file = this.resolve_package(path)
      if (pkg_file != null) {
        if (!has_file)
          return pkg_file
        else
          throw new Error(`both ${has_js_file ? js_file : json_file} and ${pkg_file} exist`)
      }
    }

    if (has_js_file)
      return js_file
    else if (has_json_file)
      return json_file
    else
      throw new Error(`can't resolve '${dep}' from '${parent.file}'`)
  }

  protected resolve_absolute(dep: string, parent: Parent): string {
    for (const base of this.bases) {
      let path = join(base, dep)
      if (file_exists(path))
        return path

      const js_file = path + ".js"
      if (file_exists(js_file))
        return js_file
      const json_file = path + ".json"
      if (file_exists(json_file))
        return json_file

      if (directory_exists(path)) {
        const file = this.resolve_package(path)
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

          if (directory_exists(path)) {
            const file = this.resolve_package(path)
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

  private parse_module({file, source, type}: {file: Path, source: string, type: ModuleType}): ts.SourceFile {
    const {ES2017, JSON} = ts.ScriptTarget
    return transforms.parse_es(file, source, type == "json" ? JSON : ES2017)
  }

  new_module(file: Path): ModuleInfo {
    let source = read(file)!
    const hash = crypto.createHash("sha256").update(source).digest("hex")
    const type = (() => {
      switch (extname(file)) {
        case ".json": return "json"
        case ".css": return "css"
        case ".mjs": return "js"
        case ".js": return "js"
        default:
          throw new Error(`unsupported extension of ${file}`)
      }
    })()
    const [base, base_path, canonical] = ((): [string, string, string | undefined] => {
      const [primary, ...secondary] = this.bases

      function canonicalize(path: Path): string {
        return path.replace(/\.js$/, "").replace(/\\/g, "/")
      }

      const path = relative(primary, file)
      if (!path.startsWith("..")) {
        return [primary, path, canonicalize(path)]
      }

      for (const base of secondary) {
        const path = relative(base, file)
        if (!path.startsWith("..")) {
          return [base, path, this.export_all ? canonicalize(path) : undefined]
        }
      }

      throw new Error(`${file} is not under any of base paths`)
    })()

    const cached = this.cache.get(file)

    let ast: ts.SourceFile | undefined
    let dependency_paths: Map<string, Path>
    let externals: Set<string>

    const changed = cached == null || cached.module.hash != hash
    if (changed) {
      if (type == "js") {
        const {ES2017, ES5} = ts.ScriptTarget
        const {output, error} = transpile(source, !this.transpile ? ES2017 : ES5)
        if (error)
          throw new Error(error)
        else
          source = output
      }

      ast = this.parse_module({file, source, type})

      const collected = transforms.collect_deps(ast)
      const filtered = collected.filter((dep) => !this.externals.has(dep) && !this.excluded(dep))

      dependency_paths = new Map(filtered.map((dep) => [dep, this.resolve_file(dep, {file})]))
      externals = new Set(collected.filter((dep) => this.externals.has(dep)))
    } else {
      dependency_paths = cached!.module.dependency_paths
      externals = cached!.module.externals
      source = cached!.module.source
    }

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
      type,
      dependency_paths,
      dependency_map: new Map(),
      dependencies: new Map(),
      externals,
    }
  }

  resolve(files: Path[]): [ModuleInfo[], ModuleInfo[]] {
    const visited = new Map<Path, ModuleInfo>()
    const pending = [...files]

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

export function transpile(source: string, target: ts.ScriptTarget, transformers?: Transformers): {output: string, error?: string} {
  const {outputText: output, diagnostics} = ts.transpileModule(source, {
    reportDiagnostics: true,
    compilerOptions: {
      target,
      module: ts.ModuleKind.CommonJS,
      importHelpers: true,
    },
    transformers: {after: transformers},
  })

  if (diagnostics == null || diagnostics.length == 0)
    return {output}
  else {
    const {text} = report_diagnostics(diagnostics)
    return {output, error: text}
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
