import {resolve, relative, join, dirname, basename, extname, normalize, sep} from "node:path"
import crypto from "node:crypto"

import {minifySync} from "oxc-minify"
import {parseSync} from "oxc-parser"
import chalk from "chalk"

import * as convert from "convert-source-map"

import type {Path} from "./sys.js"
import {read, write, file_exists, directory_exists} from "./sys.js"
import * as transforms from "./transforms.js"
import {to_cjs} from "./esm_to_cjs.js"
import {BuildError} from "./error.js"
import type {Graph} from "./graph.js"
import {detect_cycles} from "./graph.js"
import type {SourceMap, Section, Contents} from "./source_map.js"
import {load_source_map, chain, concat, shift_lines, extract_contents, restore_contents} from "./source_map.js"

const root_path = process.cwd()

const cache_version = 10

export type Parent = {
  file: Path
}

class ResolutionError extends BuildError {}

export type ResoType = "ESM" | "CJS"

export type ModuleType = "js" | "json"

export type ModuleInfo = {
  file: Path
  base_path: Path
  canonical?: string
  /** converted from an ES module */
  esm: boolean
  id: number | string
  hash: string
  changed: boolean
  source: string
  /** maps `source` to the original sources, if there are any */
  map: SourceMap | null
  dependency_paths: Map<string, Path>
  dependencies: Map<string, ModuleInfo>
  externals: Set<string>
  shims: Set<string>
}

export type ModuleCode = {
  source: string
  map: SourceMap
  min_source: string
  min_map: SourceMap
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
    readonly plugin: boolean) {}

  /** Source maps of modules (relative to the first one), shared by all preludes. */
  private readonly modules_maps = new Map<boolean, SourceMap>()

  assemble(options: AssemblyOptions): Artifact {
    let line = 0
    let sources: string = ""
    const sections: Section[] = []
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

    const {entry, artifacts, plugin} = this
    const minified = options.minified ?? false

    const {prefix, suffix, wrap} = !plugin ? dense_assembly : sparse_assembly

    const prelude = !plugin ? options.prelude.main : options.prelude.plugin
    const postlude = !plugin ? options.postlude.main : options.postlude.plugin

    sources += `${prelude}(${prefix}\n`
    const first_line = newlines(sources)

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

      // module's code starts on the same line as its wrapper
      const start = wrap(safe_id(module), "")
      sources += start

      const {code} = artifact
      const source = (minified ? code.min_source : code.source).trimEnd()
      sources += source
      sections.push({line, column: start.length, map: minified ? code.min_map : code.map})
      line += newlines(source)

      const end = ",\n"
      sources += end
      line += newlines(end)
    }

    const aliases_json = JSON.stringify(to_obj(aliases))
    const externals_json = JSON.stringify(to_obj(externals))

    sources += `${suffix}, ${safe_id(entry)}, ${aliases_json}, ${externals_json});${postlude}`

    let modules_map = this.modules_maps.get(minified)
    if (modules_map == null) {
      const name = (file: Path) => join("@@", relative(root_path, file)).replaceAll("\\", "/")
      modules_map = concat(sections, name)
      this.modules_maps.set(minified, modules_map)
    }

    return new Artifact(sources, shift_lines(modules_map, first_line))
  }
}

export class Artifact {
  constructor(readonly source: string,
              readonly sourcemap: SourceMap | null) {}

  full_source(name: string): string {
    if (this.sourcemap != null) {
      return `${this.source}\n${convert.generateMapFileComment(name)}\n`
    } else {
      return `${this.source}\n`
    }
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

export type LinkerOpts = {
  entries: Path[]
  bases?: Path[]
  externals?: (string | RegExp)[] // modules: delegate to an external require()
  excluded?: (dep: string) => boolean
  import_map?: {[key: string]: string}
  cache?: Path
  plugin?: boolean
  exports?: string[]
  shims?: string[]
  detect_cycles?: boolean
  overrides?: {[key: string]: string}
}

export class Linker {
  readonly entries: Path[]
  readonly bases: Path[]
  readonly external_modules: Set<string>
  readonly external_regex: RegExp[]
  readonly excluded: (dep: string) => boolean
  readonly import_map: {[key: string]: string}
  readonly cache_path?: Path
  readonly cache: Map<Path, ModuleArtifact>
  readonly plugin: boolean
  readonly exports: Set<string>
  readonly shims: Set<string>
  readonly detect_cycles: boolean
  readonly overrides: Map<string, string>

  /** whether `cache` differs from what is stored in `cache_path` */
  private cache_changed = true

  constructor(opts: LinkerOpts) {
    this.entries = opts.entries.map((path) => resolve(path))
    this.bases = (opts.bases ?? []).map((path) => resolve(path))
    this.external_modules = new Set((opts.externals ?? []).filter((s) => typeof s === "string"))
    this.external_regex = (opts.externals ?? []).filter((s) => s instanceof RegExp)

    this.excluded = opts.excluded ?? (() => false)
    this.import_map = opts.import_map ?? {}
    this.exports = new Set(opts.exports ?? [])

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

    this.plugin = opts.plugin ?? false

    this.shims = new Set(opts.shims ?? [])
    this.detect_cycles = opts.detect_cycles ?? true

    this.overrides = new Map(Object.entries(opts.overrides ?? {}))
  }

  is_external(dep: string): boolean {
    return this.external_modules.has(dep) || this.external_regex.some((re) => re.test(dep))
  }

  is_shimmed(dep: string): boolean {
    return this.shims.has(dep)
  }

  async link(): Promise<{bundles: Bundle[], status: boolean}> {
    let status = true

    const entries = this.resolve(this.entries)
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
      const graph: Graph<ModuleInfo> = new Map()
      for (const module of all_modules) {
        graph.set(module, [...module.dependencies.values()])
      }

      // Converted ES modules tolerate cycles as long as cyclic dependencies are used lazily,
      // but e.g. a named re-export of a module that is still being evaluated is undefined.
      // So report cycles involving ES modules. Cycles of CommonJS modules (e.g. in
      // mathjax-full) are allowed, as they were before.
      const cycles = detect_cycles(graph).filter((cycle) => cycle.some((module) => module.esm))
      if (cycles.length != 0) {
        status = false
        for (const cycle of cycles) {
          console.log(`${chalk.red("\u2717")} cycle detected:`)
          const names = [...cycle, cycle[0]].map((module) => module.canonical ?? module.base_path.replaceAll("\\", "/"))
          names.forEach((name, i) => {
            console.log(`${i == names.length - 1 ? "\u2514" : "\u251c"}\u2500 ${name}`)
          })
        }
      }
    }

    const print = (module: ModuleInfo): {source: string, map: SourceMap} => {
      const resolve = (dep: string) => module.dependencies.get(dep)?.id
      const {code, map} = transforms.link_module(module.file, module.source, module.base_path, resolve)
      return {source: code, map: chain(map, module.map)}
    }

    const deps_changed = (module: ModuleInfo, cached: ModuleInfo): boolean => {
      if (module.dependencies.size != cached.dependencies.size) {
        return true
      }

      for (const [dep, module_dep] of module.dependencies) {
        const cached_dep = cached.dependencies.get(dep)
        if (cached_dep == null || cached_dep.id != module_dep.id) {
          return true
        }
      }
      return false
    }

    let reprinted = 0

    const artifacts = async (modules: ModuleInfo[]) => {
      const result = []
      for (const module of modules) {
        const cached = this.cache.get(module.file)

        let code: ModuleCode
        if (module.changed || (cached != null && deps_changed(module, cached.module))) {
          const printed = print(module)
          const minified = minify(module, printed.source)
          code = {...printed, min_source: minified.code, min_map: chain(minified.map, printed.map)}
          reprinted++
        } else {
          code = cached!.code
        }

        result.push({module, code})
      }
      return result
    }

    const main_bundle = new Bundle(main, await artifacts(main_modules), this.plugin)

    const plugin_bundles: Bundle[] = []
    for (let j = 0; j < plugins.length; j++) {
      const plugin_bundle = new Bundle(plugins[j], await artifacts(plugin_modules[j]), true)
      plugin_bundles.push(plugin_bundle)
    }

    const bundles = [main_bundle, ...plugin_bundles]

    const files = new Set(bundles.flatMap((bundle) => bundle.artifacts.map((artifact) => artifact.module.file)))
    this.cache_changed ||= reprinted != 0 || files.size != this.cache.size || [...this.cache.keys()].some((file) => !files.has(file))

    this.cache.clear()
    for (const bundle of bundles) {
      for (const artifact of bundle.artifacts) {
        this.cache.set(artifact.module.file, artifact)
      }
    }

    return {bundles, status}
  }

  /**
   * Linker options that affect cached artifacts (e.g. which dependencies are
   * external or how modules are named), so that a cache is discarded when they
   * change. Otherwise, unchanged modules would keep stale resolutions.
   */
  protected get cache_config(): string {
    return JSON.stringify({
      bases: this.bases,
      externals: [...this.external_modules].sort(),
      external_regex: this.external_regex.map((re) => re.toString()),
      exports: [...this.exports].sort(),
      shims: [...this.shims].sort(),
      import_map: this.import_map,
      plugin: this.plugin,
      overrides: [...this.overrides.entries()],
    })
  }

  load_cache(): void {
    const {cache_path} = this
    if (cache_path == null || !file_exists(cache_path)) {
      return
    }

    this.cache.clear()
    this.cache_changed = true

    const json = JSON.parse(read(cache_path)!)
    if (json.version !== cache_version) {
      console.warn("ignoring cache due to format version mismatch")
      return
    }

    if (json.config !== this.cache_config) {
      console.warn("ignoring cache due to linker configuration change")
      return
    }

    // contents of sources are stored once, not in every source map
    const contents: Contents = json.contents
    const restore = (map: SourceMap | null) => map != null ? restore_contents(map, contents) : null

    for (const {module, code} of json.artifacts) {
      const artifact = {
        module: {
          ...module,
          map: restore(module.map),
          changed: false,
          dependencies: new Map(),
          dependency_paths: new Map(module.dependency_paths),
          externals: new Set(module.externals),
          shims: new Set(module.shims),
        },
        code: {...code, map: restore(code.map), min_map: restore(code.min_map)},
      }
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

    this.cache_changed = false
  }

  store_cache(): void {
    if (this.cache_path == null || !this.cache_changed) {
      return
    }

    const contents: Contents = {}
    const extract = (map: SourceMap | null) => map != null ? extract_contents(map, contents) : null

    const artifacts = []
    for (const artifact of this.cache.values()) {
      const {code} = artifact
      const module = {
        ...artifact.module,
        map: extract(artifact.module.map),
        changed: undefined,
        dependencies: undefined,
      }

      artifacts.push({
        module: {
          ...module,
          dependency_paths: [...module.dependency_paths.entries()],
          externals: [...module.externals.values()],
          shims: [...module.shims.values()],
        },
        code: {...code, map: extract(code.map), min_map: extract(code.min_map)},
      })
    }

    const json = JSON.stringify({version: cache_version, config: this.cache_config, artifacts, contents})
    write(this.cache_path, json)
    this.cache_changed = false
  }

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
    const export_map = (pkg.exports ?? {})
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
      if (pkg.module != null) {
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
          return new ResolutionError("linker", `both ${has_js_file ? js_file : json_file} and ${pkg_file} exist`)
        }
      }
    }

    if (has_js_file) {
      return js_file
    } else if (has_json_file) {
      return json_file
    } else {
      return new ResolutionError("linker", `can't resolve '${dep}' from '${parent.file}'`)
    }
  }

  protected resolve_absolute(dep: string, parent: Parent): Path | Error {
    if (dep in this.import_map) {
      const result = this.resolve_file(this.import_map[dep], parent)
      if (result instanceof ResolutionError) {
        return new ResolutionError("linker", `can't resolve '${dep}' from '${parent.file}'`)
      } else {
        return result
      }
    }

    if (dep.startsWith("#")) {
      for (const [pattern, maps_to] of Object.entries(this.import_map)) {
        const [prefix, suffix] = pattern.split("*")
        if (dep.startsWith(prefix) && dep.endsWith(suffix)) {
          const core = dep.slice(prefix.length).slice(0, dep.length - suffix.length)
          const path = maps_to.replace("*", core)
          const result = this.resolve_file(path, parent)
          if (result instanceof ResolutionError) {
            return new ResolutionError("linker", `can't resolve '${dep}' from '${parent.file}'`)
          } else {
            return result
          }
        }
      }
    }

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

    return new ResolutionError("linker", `can't resolve '${dep}' from '${parent.file}'`)
  }

  resolve_file(dep: string, parent: Parent): Path | Error {
    if (dep.startsWith(".")) {
      return this.resolve_relative(dep, parent)
    } else {
      return this.resolve_absolute(dep, parent)
    }
  }

  new_module(file: Path): ModuleInfo {
    let source = read(file)
    if (source == null) {
      throw new BuildError("linker", `'${file} doesn't exist`)
    }

    let overridden = false
    for (const [path, override] of this.overrides) {
      if (file.endsWith(normalize(path))) {
        source = override
        overridden = true
        break
      }
    }

    // Removing the trailing source map comment doesn't invalidate the map.
    const input_map = !overridden ? load_source_map(file, source) : null
    source = convert.removeMapFileComments(convert.removeComments(source))

    const hash = crypto.createHash("sha256").update(source).update(JSON.stringify(input_map)).digest("hex")
    const type: ModuleType = (() => {
      switch (extname(file)) {
        case ".json": return "json"
        case ".mjs": return "js"
        case ".cjs": return "js"
        case ".js": return "js"
        default:
          throw new BuildError("linker", `unsupported extension of ${file}`)
      }
    })()

    switch (type) {
      case "json": {
        source = `\
const json = ${source};
export default json;
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
            // Use the package's path relative to the base (not just `basename(dir)`),
            // so that scoped packages (`@preact/signals`) and subpackages
            // (`preact/hooks`) get their full names.
            const name = canonicalize(primary ? relative(base, dir) : path)
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

    let dependency_paths: Map<string, Path>
    let externals: Set<string>
    let esm: boolean
    let shims: Set<string>
    let map: SourceMap | null

    const changed = cached == null || cached.module.hash != hash
    if (changed) {
      let collected: string[]
      if (resolution == "ESM" || type == "json") {
        // Bundles provide tslib to extensions, so include it, unless this is tslib itself.
        const imports = new Set<string>()
        if (canonical != "tslib" && this.resolve_file("tslib", {file}) != file) {
          imports.add("tslib")
        }

        esm = true
        const converted = to_cjs(file, source)
        source = converted.code
        map = chain(converted.map, input_map)
        // `require()` calls are allowed in ESM modules under the primary base only (e.g. test's `auto_index`)
        const requires = base == this.bases[0] ? transforms.collect_deps(transforms.parse_script(file, source)) : []
        collected = [...new Set([...imports, ...converted.deps, ...requires])]
      } else {
        esm = false
        map = input_map
        collected = transforms.collect_deps(transforms.parse_script(file, source))
      }
      const filtered = collected.filter((dep) => !this.is_external(dep) && !this.excluded(dep) && !this.is_shimmed(dep))

      dependency_paths = new Map()
      for (const dep of filtered) {
        const resolved = this.resolve_file(dep, {file})
        if (resolved instanceof Error) {
          console.error(`${chalk.red("resolution failed")}: ${resolved.message}`)
        } else {
          dependency_paths.set(dep, resolved)
        }
      }

      externals = new Set(collected.filter((dep) => this.is_external(dep)))
      shims = new Set(collected.filter((dep) => this.is_shimmed(dep)))
    } else {
      dependency_paths = cached.module.dependency_paths
      externals = cached.module.externals
      shims = cached.module.shims
      source = cached.module.source
      esm = cached.module.esm
      map = cached.module.map
    }

    return {
      file,
      base_path,
      canonical,
      esm,
      id: NaN,
      hash,
      changed,
      source,
      map,
      dependency_paths,
      dependencies: new Map(),
      externals,
      shims,
    }
  }

  resolve(files: Path[]): ModuleInfo[] {
    const visited = new Map<Path, ModuleInfo>()
    const pending = [...files]

    for (;;) {
      const file = pending.shift()

      if (file == null) {
        break
      }
      if (visited.has(file)) {
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

    return files.map((file) => visited.get(file)!)
  }

  reachable(entry: ModuleInfo, is_excluded: (module: ModuleInfo) => boolean): ModuleInfo[] {
    const reached = new Set<ModuleInfo>()
    const pending = [entry]

    for (;;) {
      const module = pending.shift()

      if (module == null) {
        break
      }
      if (reached.has(module) || is_excluded(module)) {
        continue
      }

      reached.add(module)
      pending.unshift(...module.dependencies.values())
    }

    return [...reached.values()]
  }
}

// oxc-minify preserves only legal comments, i.e. `/*! ... */`, `//! ...`, or ones that
// include `@license` or `@preserve`. Third-party code may include license notices
// as ordinary comments, so mark comments that look like license notices as legal.
const license_like = /copyright|license|\(c\)/i
const legal = /^!|@license|@preserve/

function mark_license_comments(name: string, source: string): string {
  const {comments} = parseSync(name, source, {sourceType: "script"})
  let result = ""
  let pos = 0
  for (const {type, value, start, end} of comments) {
    if (!license_like.test(value) || legal.test(value) || (type == "Line" && value.includes("*/"))) {
      continue
    }
    result += `${source.slice(pos, start)}/*!${value}*/`
    pos = end
  }
  return result + source.slice(pos)
}

function minify(module: ModuleInfo, source: string): {code: string, map: SourceMap} {
  // oxc infers module type from the extension (e.g. `.mjs` or `.cjs`), which would allow
  // it to remove the unused top-level module function, so always use `.js`.
  const name = `${basename(module.file, extname(module.file))}.js`
  const {code, map, errors} = minifySync(name, mark_license_comments(name, source), {
    module: false,
    sourcemap: true,
    compress: {target: "es2024", keepNames: {function: false, class: true}},
    mangle: {toplevel: false, keepNames: {function: false, class: true}},
    codegen: {asciiOnly: true, legalComments: "inline"},
  })

  if (errors.length != 0) {
    throw new BuildError("linker", `failed to minify ${module.file}: ${errors.map((error) => error.message).join("\n")}`)
  }
  if (code.trim().length == 0) {
    throw new BuildError("linker", `minification of ${module.file} resulted in empty output`)
  }

  return {code, map: map as SourceMap}
}
