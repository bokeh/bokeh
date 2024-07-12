import {resolve, relative, join, dirname, basename, extname, normalize, sep} from "path"
import module from "module"
import crypto from "crypto"

import ts from "typescript"
import * as terser from "terser"
import chalk from "chalk"

import * as combine from "combine-source-map"
import * as convert from "convert-source-map"

import type {Path} from "./sys"
import {read, write, file_exists, directory_exists, rename} from "./sys"
import {report_diagnostics} from "./compiler"
import * as transforms from "./transforms"
import {BuildError} from "./error"
import type {Graph} from "./graph"
import {detect_cycles} from "./graph"

const root_path = process.cwd()

const cache_version = 4

export type Transformers = ts.TransformerFactory<ts.SourceFile>[]

export type Parent = {
  file: Path
}

export type ResoType = "ESM" | "CJS"

export type ModuleType = "js" | "json" | "json5" | "yaml" | "css"

export type ModuleInfo = {
  file: Path
  base: Path
  base_path: Path
  canonical?: string
  resolution: ResoType
  id: number | string
  hash: string
  changed: boolean
  type: ModuleType
  source: string
  ast?: ts.SourceFile
  dependency_paths: Map<string, Path>
  dependency_map: Map<string, number>
  dependencies: Map<string, ModuleInfo>
  exported: transforms.Exports[]
  externals: Set<string>
  shims: Set<string>
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

export type AssemblyType = {
  prefix: string
  suffix: string
  wrap: (id: string, source: string) => string
}

const dense_assembly: AssemblyType = {
  prefix: "[",
  suffix: "]",
  wrap: (_, source) => source,
}

const sparse_assembly: AssemblyType = {
  prefix: "{",
  suffix: "}",
  wrap: (id, source) => `${id}: ${source}`,
}

export type AssemblyOptions = {
  prelude: {main: string, plugin: string}
  postlude: {main: string, plugin: string}
  minified?: boolean
}

export class Bundle {
  constructor(
    readonly entry: ModuleInfo,
    readonly artifacts: ModuleArtifact[],
    readonly builtins: boolean,
    readonly bases: Bundle[] = []) {}

  assemble(options: AssemblyOptions): Artifact {
    let line = 0
    let sources: string = ""
    const sourcemap = combine.create()
    const aliases = new Map<string, number | string>()
    const externals = new Map<string, boolean>()

    const newlines = (source: string): number => {
      const result = source.match(/\n/g)
      return result != null ? result.length : 0
    }

    const safe_id = (module: ModuleInfo): string => {
      const {id} = module
      return typeof id == "number" ? id.toString() : JSON.stringify(id)
    }

    const {entry, artifacts, bases} = this
    const minified = options.minified ?? false

    const plugin = bases.length != 0
    const {prefix, suffix, wrap} = !plugin ? dense_assembly : sparse_assembly

    const prelude = !plugin ? options.prelude.main : options.prelude.plugin
    const postlude = !plugin ? options.postlude.main : options.postlude.plugin

    sources += `${prelude}(${prefix}\n`
    line += newlines(sources)

    for (const artifact of artifacts) {
      const {module} = artifact

      if (module.canonical != null) {
        aliases.set(module.canonical, module.id)
      }

      for (const external of module.externals) {
        externals.set(external, true)
      }
      for (const external of module.shims) {
        externals.set(external, false)
      }

      const start = wrap(safe_id(module), "")
      sources += start
      line += newlines(start)

      const source_with_sourcemap = minified ? artifact.code.min_source : artifact.code.source
      const source = combine.removeComments(source_with_sourcemap).trimEnd()
      sources += source
      const map_path = join("@@", relative(root_path, module.file))
      sourcemap.addFile({source: source_with_sourcemap, sourceFile: map_path}, {line})
      line += newlines(source)

      const end = ",\n"
      sources += end
      line += newlines(end)
    }

    const aliases_json = JSON.stringify(to_obj(aliases))
    const externals_json = JSON.stringify(to_obj(externals))

    sources += `${suffix}, ${safe_id(entry)}, ${aliases_json}, ${externals_json});${postlude}`

    const source_map = convert.fromBase64(sourcemap.base64()).toObject()
    return new Artifact(sources, minified ? null : source_map, aliases)
  }

  protected *collect_exported(entry: ModuleInfo): Generator<string, void> {
    for (const item of entry.exported) {
      switch (item.type) {
        case "bindings": {
          for (const [, name] of item.bindings) {
            yield name
          }
          break
        }
        case "named": {
          yield item.name
          break
        }
        case "namespace": {
          const {name} = item
          if (name != null) {
            yield name
          } else {
            const module = entry.dependencies.get(item.module)
            if (module != null) {
              yield* this.collect_exported(module)
            }
          }
          break
        }
      }
    }
  }
}

export class Artifact {
  constructor(readonly source: string,
              readonly sourcemap: object | null,
              readonly exported: Map<string, number | string>) {}

  full_source(name: string): string {
    if (this.sourcemap != null) {
      return `${this.source}\n${convert.generateMapFileComment(name)}\n`
    } else {
      return `${this.source}\n`
    }
  }

  get module_names(): string[] {
    return Array.from(this.exported.keys())
  }

  write(path: string): void {
    const dir = dirname(path)
    const name = basename(path, ".js")
    write(path, this.full_source(`${name}.js.map`))
    if (this.sourcemap != null) {
      write(join(dir, `${name}.js.map`), JSON.stringify(this.sourcemap))
    }
  }
}

export interface LinkerOpts {
  entries: Path[]
  bases?: Path[]
  excludes?: Path[]    // paths: process, but don't include in a bundle
  externals?: (string | RegExp)[] // modules: delegate to an external require()
  excluded?: (dep: string) => boolean
  builtins?: boolean
  cache?: Path
  target?: "ES2022" | "ES2020" | "ES2017" | "ES2015"
  es_modules?: boolean
  minify?: boolean
  plugin?: boolean
  exports?: string[]
  shims?: string[]
  detect_cycles?: boolean
  overrides?: {[key: string]: string}
  apply_transforms?: boolean
}

export class Linker {
  readonly entries: Path[]
  readonly bases: Path[]
  readonly excludes: Set<Path>
  readonly external_modules: Set<string>
  readonly external_regex: RegExp[]
  readonly excluded: (dep: string) => boolean
  readonly builtins: boolean
  readonly cache_path?: Path
  readonly cache: Map<Path, ModuleArtifact>
  readonly target: "ES2022" | "ES2020" | "ES2017" | "ES2015" | null
  readonly es_modules: boolean
  readonly minify: boolean
  readonly plugin: boolean
  readonly exports: Set<string>
  readonly shims: Set<string>
  readonly detect_cycles: boolean
  readonly overrides: Map<string, string>
  readonly apply_transforms: boolean

  constructor(opts: LinkerOpts) {
    this.entries = opts.entries.map((path) => resolve(path))
    this.bases = (opts.bases ?? []).map((path) => resolve(path))
    this.excludes = new Set((opts.excludes ?? []).map((path) => resolve(path)))
    this.external_modules = new Set((opts.externals ?? []).filter((s) => typeof s === "string"))
    this.external_regex = (opts.externals ?? []).filter((s) => s instanceof RegExp)

    this.excluded = opts.excluded ?? (() => false)
    this.builtins = opts.builtins ?? false
    this.exports = new Set(opts.exports ?? [])

    if (this.builtins) {
      this.external_modules.add("module")
      this.external_modules.add("constants")

      for (const lib of module.builtinModules) {
        this.external_modules.add(lib)
      }
    }

    for (const entry of this.entries) {
      if (!file_exists(entry)) {
        throw new BuildError("linker", `entry path ${entry} doesn't exist or isn't a file`)
      }
    }

    for (const base of this.bases) {
      if (!directory_exists(base)) {
        throw new BuildError("linker", `base path ${base} doesn't exist or isn't a directory`)
      }
    }

    this.cache_path = opts.cache
    this.cache = new Map()

    this.target = opts.target ?? null
    this.es_modules = opts.es_modules ?? true
    this.minify = opts.minify ?? true
    this.plugin = opts.plugin ?? false

    this.shims = new Set(opts.shims ?? [])
    this.detect_cycles = opts.detect_cycles ?? true

    this.overrides = new Map(Object.entries(opts.overrides ?? {}))
    this.apply_transforms = opts.apply_transforms ?? true
  }

  is_external(dep: string): boolean {
    return this.external_modules.has(dep) || this.external_regex.some((re) => re.test(dep))
  }

  is_shimmed(dep: string): boolean {
    return this.shims.has(dep)
  }

  async link(): Promise<{bundles: Bundle[], status: boolean}> {
    let status = true

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
    if (!this.plugin) {
      all_modules.forEach((module, i) => module.id = i)
    } else {
      all_modules.forEach((module) => module.id = module.hash.slice(0, 10))
    }

    if (this.detect_cycles) {
      function is_internal(module: ModuleInfo) {
        return module.canonical != null
      }

      const nodes = all_modules.filter(is_internal)
      const graph: Graph<ModuleInfo> = new Map()
      for (const node of nodes) {
        const deps = [...node.dependencies.values()]
        graph.set(node, deps.filter(is_internal))
      }

      const cycles = detect_cycles(graph)
      if (cycles.length != 0) {
        status = false
        for (const cycle of cycles) {
          console.log(`${chalk.red("\u2717")} cycle detected:`)
          for (const module of cycle) {
            const is_last = cycle[cycle.length-1] == module
            console.log(`${is_last ? "\u2514" : "\u251c"}\u2500 ${module.canonical ?? module.base_path}`)
          }
        }
      }
    }

    const transformers = (module: ModuleInfo): Transformers => {
      const transformers: Transformers = []

      if (this.apply_transforms) {
        const remove_use_strict = transforms.remove_use_strict()
        transformers.push(remove_use_strict)

        const fix_esmodule = transforms.fix_esmodule()
        transformers.push(fix_esmodule)

        const remove_void0 = transforms.remove_void0()
        transformers.push(remove_void0)

        const fix_esexports = transforms.fix_esexports()
        transformers.push(fix_esexports)

        const fix_regl = transforms.fix_regl()
        transformers.push(fix_regl)
      }

      const rewrite_deps = transforms.rewrite_deps((dep) => {
        const module_dep = module.dependencies.get(dep)
        return module_dep != null ? module_dep.id : undefined
      })
      transformers.push(rewrite_deps)

      transformers.push(transforms.wrap_in_function(module.base_path))
      return transformers
    }

    const print = (module: ModuleInfo): string => {
      let ast = module.ast ?? this.parse_module(module)
      ast = transforms.apply(ast, ...transformers(module))
      const source = transforms.print_es(ast)
      return convert.removeMapFileComments(source)
    }

    const deps_changed = (module: ModuleInfo, cached: ModuleInfo): boolean => {
      if (module.dependencies.size != cached.dependencies.size) {
        return false
      }

      for (const [dep, module_dep] of module.dependencies) {
        const cached_dep = cached.dependencies.get(dep)
        if (cached_dep == null || cached_dep.id != module_dep.id) {
          return true
        }
      }
      return false
    }

    const artifacts = async (modules: ModuleInfo[]) => {
      const result = []
      for (const module of modules) {
        const cached = this.cache.get(module.file)

        let code: ModuleCode
        if (module.changed || (cached != null && deps_changed(module, cached.module))) {
          const source = print(module)
          const ecma = (() => {
            switch (this.target) {
              case "ES2022": return 2020 // TODO: 2022
              case null:
              case "ES2020": return 2020
              case "ES2017": return 2017
              case "ES2015": return 5
            }
          })()
          const minified = this.minify ? await minify(module, source, ecma) : {min_source: source}
          code = {source, ...minified}
        } else {
          code = cached!.code
        }

        result.push({module, code})
      }
      return result
    }

    const main_bundle = new Bundle(main, await artifacts(main_modules), this.builtins)

    const plugin_bundles: Bundle[] = []
    for (let j = 0; j < plugins.length; j++) {
      const plugin_bundle = new Bundle(plugins[j], await artifacts(plugin_modules[j]), this.builtins, [main_bundle])
      plugin_bundles.push(plugin_bundle)
    }

    const bundles = [main_bundle, ...plugin_bundles]

    this.cache.clear()
    for (const bundle of bundles) {
      for (const artifact of bundle.artifacts) {
        this.cache.set(artifact.module.file, artifact)
      }
    }

    return {bundles, status}
  }

  load_cache(): void {
    const {cache_path} = this
    if (cache_path == null || !file_exists(cache_path)) {
      return
    }

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
          shims: new Set(module.shims),
        },
        code,
      } as ModuleArtifact
      this.cache.set(artifact.module.file, artifact)
    }

    for (const {module} of this.cache.values()) {
      for (const [dep, file] of module.dependency_paths) {
        const file_entry = this.cache.get(file)
        if (file_entry == null) {
          throw new Error(`${file} not in cache`)
        }
        module.dependencies.set(dep, file_entry.module)
      }
    }
  }

  store_cache(): void {
    if (this.cache_path == null) {
      return
    }

    const artifacts = []
    for (const artifact of this.cache.values()) {
      const module = {
        ...artifact.module,
        changed: undefined,
        ast: undefined,
        dependencies: undefined,
      }

      artifacts.push({
        module: {
          ...module,
          dependency_map: [...module.dependency_map.entries()],
          dependency_paths: [...module.dependency_paths.entries()],
          externals: [...module.externals.values()],
          shims: [...module.shims.values()],
        },
        code: artifact.code,
      })
    }

    const json = JSON.stringify({version: cache_version, artifacts})
    write(this.cache_path, json)
  }

  protected readonly ext = ".js"

  get_package(dir: string): {[key: string]: unknown} {
    const pkg_path = join(dir, "package.json")
    if (file_exists(pkg_path)) {
      return JSON.parse(read(pkg_path)!)
    } else {
      return {}
    }
  }

  resolve_export_map(dir: string, subpath: string): string | null {
    const pkg = this.get_package(dir)
    const export_map = (pkg.exports ?? {}) as object
    const path = join(dir, subpath)
    for (const [key, val] of Object.entries(export_map)) {
      if (join(dir, key) == path) {
        return join(dir, val)
      }
    }
    return null
  }

  resolve_package(dir: string): string | null {
    const pkg = this.get_package(dir)

    const index = (() => {
      if (this.target != null && pkg.module != null) {
        return pkg.module as string
      } else if (pkg.main != null) {
        return pkg.main as string
      } else {
        return "index.js"
      }
    })()

    const path = join(dir, index)
    if (file_exists(path)) {
      return path
    }

    const js_file = `${path}.js`
    if (file_exists(js_file)) {
      return js_file
    }
    const json_file = `${path}.json`
    if (file_exists(json_file)) {
      return json_file
    }

    if (directory_exists(path)) {
      const index = join(path, "index.js")
      if (file_exists(index)) {
        return index
      }
    }

    return null
  }

  protected resolve_relative(dep: string, parent: Parent): Path | Error {
    const path = resolve(dirname(parent.file), dep)

    if (file_exists(path)) {
      return path
    }

    const js_file = `${path}.js`
    const json_file = `${path}.json`
    const has_js_file = file_exists(js_file)
    const has_json_file = file_exists(json_file)
    const has_file = has_js_file || has_json_file

    if (directory_exists(path)) {
      const pkg_file = this.resolve_package(path)
      if (pkg_file != null) {
        if (!has_file) {
          return pkg_file
        } else {
          return new BuildError("linker", `both ${has_js_file ? js_file : json_file} and ${pkg_file} exist`)
        }
      }
    }

    if (has_js_file) {
      return js_file
    } else if (has_json_file) {
      return json_file
    } else {
      return new BuildError("linker", `can't resolve '${dep}' from '${parent.file}'`)
    }
  }

  protected resolve_absolute(dep: string, parent: Parent): Path | Error {
    for (const base of this.bases) {
      let path = join(base, dep)
      if (file_exists(path)) {
        return path
      }

      const js_file = `${path}.js`
      if (file_exists(js_file)) {
        return js_file
      }
      const json_file = `${path}.json`
      if (file_exists(json_file)) {
        return json_file
      }

      if (directory_exists(path)) {
        const file = this.resolve_package(path)
        if (file != null) {
          return file
        }
      }

      const [dir, ...rest] = dep.split(sep)
      if (rest.length >= 1) {
        const path = join(base, dir)
        if (directory_exists(path)) {
          const file = this.resolve_export_map(path, rest.join(sep))
          if (file != null) {
            return file
          }
        }
      }

      if (parent.file.startsWith(base)) {
        let base_path = parent.file

        while (true) {
          base_path = dirname(base_path)

          if (base_path == base) {
            break
          }

          path = join(base_path, "node_modules", dep)

          if (directory_exists(path)) {
            const file = this.resolve_package(path)
            if (file != null) {
              return file
            }
          }
        }
      }
    }

    return new BuildError("linker", `can't resolve '${dep}' from '${parent.file}'`)
  }

  resolve_file(dep: string, parent: Parent): Path | Error {
    if (dep.startsWith(".")) {
      return this.resolve_relative(dep, parent)
    } else {
      return this.resolve_absolute(dep, parent)
    }
  }

  private parse_module({file, source}: {file: Path, source: string}): ts.SourceFile {
    return transforms.parse_es(file, source)
  }

  new_module(file: Path): ModuleInfo {
    let source = read(file)
    if (source == null) {
      throw new BuildError("linker", `'${file} doesn't exist`)
    }

    for (const [path, override] of this.overrides) {
      if (file.endsWith(normalize(path))) {
        source = override
        break
      }
    }

    const hash = crypto.createHash("sha256").update(source).digest("hex")
    const type: ModuleType = (() => {
      switch (extname(file)) {
        case ".json": return "json"
        case ".json5": return "json5"
        case ".yaml": return "yaml"
        case ".css": return "css"
        case ".mjs": return "js"
        case ".cjs": return "js"
        case ".js": return "js"
        default:
          throw new BuildError("linker", `unsupported extension of ${file}`)
      }
    })()

    const export_type = this.es_modules ? "default" : "="
    switch (type) {
      case "json": {
        source = `\
const json = ${source};
export ${export_type} json;
`
        break
      }
      case "json5": {
        source = `\
const json5 = \`
${source.replaceAll("\\", "\\\\")}
\`;
export ${export_type} json5;
`
        break
      }
      case "css": {
        source = `\
const css = \`${source}\`;
export ${export_type} css;
`
        break
      }
      case "yaml": {
        source = `\
const yaml = \`
${source}
\`;
export ${export_type} yaml;
`
        break
      }
      case "js": {
        break
      }
    }

    const [base, base_path, canonical, resolution] = ((): [string, string, string | undefined, ResoType] => {
      const [primary, ...secondary] = this.bases

      function canonicalize(path: Path): string {
        return path.replace(/\.js$/, "").replace(/\\/g, "/")
      }

      function get_package(base: Path, path: Path): {dir: Path, pkg: {[key: string]: any}} {
        const root = join(base, path)
        base = normalize(base)
        path = normalize(root)
        while (path != base) {
          if (directory_exists(path)) {
            const pkg_path = join(path, "package.json")
            if (file_exists(pkg_path)) {
              return {dir: path, pkg: JSON.parse(read(pkg_path)!)}
            }
          }
          path = dirname(path)
        }

        throw new BuildError("linker", `can't resolve package.json for ${root}`)
      }

      const path = relative(primary, file)
      if (!path.startsWith("..")) {
        return [primary, path, canonicalize(path), "ESM"]
      }

      for (const base of secondary) {
        const path = relative(base, file)
        if (!path.startsWith("..")) {
          if (type == "js") {
            const {dir, pkg} = get_package(base, path)
            const reso = pkg.type == "module" || pkg.module != null ? "ESM" : "CJS"
            const entry = pkg.module ?? pkg.name
            const primary = entry != null && join(dir, entry) == join(base, path)
            const name = canonicalize(primary ? basename(dir) : path)
            const exported = this.exports.has(name)
            return [base, path, exported ? name : undefined, reso]
          } else {
            return [base, path, undefined, "ESM"]
          }
        }
      }

      throw new BuildError("linker", `${file} is not under any of base paths`)
    })()

    const cached = this.cache.get(file)

    let ast: ts.SourceFile | undefined
    let dependency_paths: Map<string, Path>
    let externals: Set<string>
    let shims: Set<string>
    let exported: transforms.Exports[] = []

    const changed = cached == null || cached.module.hash != hash
    if (changed) {
      let collected: string[] | null = null
      if ((this.target != null && resolution == "ESM") || type == "json") {
        const {ES2022, ES2020, ES2017, ES2015} = ts.ScriptTarget
        const target = (() => {
          switch (this.target) {
            case "ES2022": return ES2022
            case null:
            case "ES2020": return ES2020
            case "ES2017": return ES2017
            case "ES2015": return ES2015
          }
        })()
        const imports = new Set<string>()
        if (canonical != "tslib") {
          imports.add("tslib")
        }

        const transform: {before: Transformers, after: Transformers} = {
          before: [transforms.collect_imports(imports), transforms.rename_exports(), transforms.collect_exports(exported)],
          after: [],
        }

        // XXX: .json extension will cause an internal error
        const {output, error} = transpile(type == "json" ? `${file}.ts` : file, source, target, transform)
        if (error != null) {
          throw new BuildError("linker", error)
        } else {
          source = output
          collected = [...imports]
        }
      }

      ast = this.parse_module({file, source})

      if (collected == null) {
        collected = transforms.collect_deps(ast)
      }
      const filtered = collected.filter((dep) => !this.is_external(dep) && !this.excluded(dep) && !this.is_shimmed(dep))

      dependency_paths = new Map()
      for (const dep of filtered) {
        const resolved = this.resolve_file(dep, {file})
        if (resolved instanceof Error) {
          console.log(resolved)
        } else {
          dependency_paths.set(dep, resolved)
        }
      }

      externals = new Set(collected.filter((dep) => this.is_external(dep)))
      shims = new Set(collected.filter((dep) => this.is_shimmed(dep)))
    } else {
      dependency_paths = cached.module.dependency_paths
      exported = cached.module.exported
      externals = cached.module.externals
      shims = cached.module.shims
      source = cached.module.source
    }

    return {
      file,
      base,
      base_path,
      canonical,
      resolution,
      id: NaN,
      hash,
      changed,
      source,
      ast,
      type,
      dependency_paths,
      dependency_map: new Map(),
      dependencies: new Map(),
      exported,
      externals,
      shims,
    }
  }

  resolve(files: Path[]): [ModuleInfo[], ModuleInfo[]] {
    const visited = new Map<Path, ModuleInfo>()
    const pending = [...files]

    for (;;) {
      const file = pending.shift()

      if (file == null) {
        break
      }
      if (visited.has(file) || this.excludes.has(file)) {
        continue
      }

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

      if (module == null) {
        break
      }
      if (reached.has(module) || this.excludes.has(module.file) || is_excluded(module)) {
        continue
      }

      reached.add(module)
      pending.unshift(...module.dependencies.values())
    }

    return [...reached.values()]
  }
}

export function transpile(file: Path, source: string, target: ts.ScriptTarget,
    transformers?: {before: Transformers, after: Transformers}): {output: string, error?: string} {
  const {outputText: output, diagnostics} = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      importHelpers: true,
      downlevelIteration: true,
    },
    transformers,
  })

  if (diagnostics == null || diagnostics.length == 0) {
    return {output}
  } else {
    const {text} = report_diagnostics(diagnostics)
    return {output, error: text}
  }
}

export async function minify(module: ModuleInfo, source: string, ecma: terser.ECMA): Promise<{min_source: string, min_map?: string}> {
  const name = basename(module.file)
  const min_js = rename(name, {ext: ".min.js"})
  const min_js_map = rename(name, {ext: ".min.js.map"})

  const minify_opts: terser.MinifyOptions = {
    ecma,
    format: {
      comments: /^!|copyright|license|\(c\)/i,
      // https://github.com/terser/terser/issues/410
      ascii_only: true,
    },
    sourceMap: {
      filename: basename(min_js),
      url: basename(min_js_map),
    },
  }

  try {
    const {code, map} = await terser.minify(source, minify_opts)
    return {
      min_source: code ?? "",
      min_map: typeof map === "string" ? map : undefined,
    }
  } catch (error) {
    throw new BuildError("linker", `${error}`)
  }
}
